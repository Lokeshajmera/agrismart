import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

export const useOfflineStore = create((set, get) => ({
    isOnline: navigator.onLine,
    offlineData: JSON.parse(localStorage.getItem('offline_sensor_data') || '[]'),
    
    setOnlineStatus: (status) => {
        set({ isOnline: status });
        if (status) {
            get().syncData();
        }
    },

    addOfflineData: (data) => {
        const currentData = get().offlineData;
        const newData = [...currentData, { ...data, timestamp: new Date().toISOString() }];
        localStorage.setItem('offline_sensor_data', JSON.stringify(newData));
        set({ offlineData: newData });
        toast('Data saved locally (Offline Mode)', { icon: '💾' });
    },

    clearOfflineData: () => {
        localStorage.removeItem('offline_sensor_data');
        set({ offlineData: [] });
    },

    syncData: async () => {
        const dataToSync = get().offlineData;
        if (dataToSync.length === 0) return;

        try {
            toast.loading('Syncing offline data...', { id: 'sync' });
            
            const { error } = await supabase
                .from('sensor_data')
                .insert(dataToSync.map(d => ({
                    farmer_id: d.farmer_id,
                    moisture: d.moisture,
                    temperature: d.temperature,
                    ph: d.ph,
                    water_level: d.water_level,
                    // If your DB expects specific columns, insert them here. 
                    // Let's assume created_at uses timestamp if provided, 
                    // otherwise Supabase sets it to now().
                })));

            if (error) throw error;
            
            get().clearOfflineData();
            toast.success('Offline data synced successfully!', { id: 'sync' });
        } catch (error) {
            console.error("Error syncing offline data:", error);
            toast.error('Failed to sync offline data. Will try again later.', { id: 'sync' });
        }
    }
}));
