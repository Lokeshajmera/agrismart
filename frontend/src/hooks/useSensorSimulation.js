import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { useOfflineStore } from '../store/useOfflineStore';

export const useSensorSimulation = () => {
    const { user } = useAuth();
    const [isSimulating, setIsSimulating] = useState(false);
    const [farmerId, setFarmerId] = useState(null);
    const { isOnline, addOfflineData } = useOfflineStore();

    // Fetch Farmer ID of the current user
    useEffect(() => {
        const fetchFarmerId = async () => {
            if (user) {
                const { data } = await supabase.from('users').select('farmer_id').eq('id', user.id).single();
                if (data) setFarmerId(data.farmer_id);
            }
        };
        fetchFarmerId();
    }, [user]);

    // Interval logic for pushing data
    useEffect(() => {
        let interval;
        if (isSimulating && farmerId) {
            toast.success("IoT Simulation Started! Spawning data every 5 seconds.");
            
            interval = setInterval(async () => {
                // Generate realistic simulated metrics
                const moisture = (Math.random() * (80 - 20) + 20).toFixed(1);
                const temperature = (Math.random() * (40 - 20) + 20).toFixed(1);
                const ph = (Math.random() * (8 - 5.5) + 5.5).toFixed(1);
                const water_level = (Math.random() * (100 - 30) + 30).toFixed(1);

                const dataPoint = {
                    farmer_id: farmerId,
                    moisture: parseFloat(moisture),
                    temperature: parseFloat(temperature),
                    ph: parseFloat(ph),
                    water_level: parseFloat(water_level),
                    created_at: new Date().toISOString()
                };

                if (isOnline) {
                    const { error } = await supabase.from('sensor_data').insert([dataPoint]);
                    
                    if (error) {
                        console.error("Simulation Insert Error: ", error);
                        toast.error("Failed to push telemetry.");
                    }
                } else {
                    addOfflineData(dataPoint);
                }
            }, 5000); 

        } else if (!isSimulating && interval) {
            clearInterval(interval);
            toast.success("IoT Simulation Stopped.");
        }
        
        return () => clearInterval(interval);
    }, [isSimulating, farmerId]);

    const toggleSimulation = () => {
        if (!farmerId) {
            toast.error("Profile not complete. Cannot simulate without a Farmer ID.");
            return;
        }
        setIsSimulating(!isSimulating);
    };

    return { isSimulating, toggleSimulation };
};
