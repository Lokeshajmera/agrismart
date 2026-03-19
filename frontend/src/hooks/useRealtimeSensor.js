import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useOfflineStore } from '../store/useOfflineStore';

export const useRealtimeSensor = () => {
    const { user } = useAuth();
    const [sensorData, setSensorData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [farmerId, setFarmerId] = useState(null);
    const [lastPing, setLastPing] = useState(null);
    const { isOnline, offlineData } = useOfflineStore();

    // Identify user's farmer ID
    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                const { data } = await supabase.from('users').select('farmer_id').eq('id', user.id).single();
                if (data) setFarmerId(data.farmer_id);
            }
        };
        fetchUserData();
    }, [user]);

    useEffect(() => {
        if (!farmerId) return;

        let isMounted = true;
        
        const fetchData = async () => {
            try {
                setLoading(true);
                // Grab the historical last 20 readings on boot
                const { data, error } = await supabase
                    .from('sensor_data')
                    .select('*')
                    .eq('farmer_id', farmerId)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (error) throw error;
                if (isMounted) {
                    setSensorData(data.reverse()); // Set chronologically for chart
                    if (data.length > 0) setLastPing(new Date());
                }
            } catch (err) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        // ==========================================
        // Establish WebSockets for Supabase Realtime
        // ==========================================
        const channel = supabase
            .channel(`public:sensor_data:farmer_id=eq.${farmerId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'sensor_data',
                filter: `farmer_id=eq.${farmerId}` 
            }, (payload) => {
                if (isMounted) {
                    setSensorData(prev => {
                        const newData = [...prev, payload.new];
                        // Slide window to maximum 20 points
                        if (newData.length > 20) newData.shift();
                        return newData;
                    });
                    setLastPing(new Date());
                }
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [farmerId]);

    // Merge offline data if disconnected or there is remaining offline data
    const combinedData = [...sensorData, ...offlineData].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).slice(-20);
    const currentLoading = isOnline ? loading : false;
    const currentLastPing = offlineData.length > 0 ? new Date(offlineData[offlineData.length - 1].created_at) : lastPing;

    return { sensorData: combinedData, loading: currentLoading, error, lastPing: currentLastPing };
};
