import React, { useEffect } from 'react';
import { useOfflineStore } from '../store/useOfflineStore';
import { Wifi, WifiOff } from 'lucide-react';

export default function OfflineBanner() {
 const { isOnline, setOnlineStatus } = useOfflineStore();

 useEffect(() => {
 const handleOnline = () => setOnlineStatus(true);
 const handleOffline = () => setOnlineStatus(false);

 window.addEventListener('online', handleOnline);
 window.addEventListener('offline', handleOffline);

 return () => {
 window.removeEventListener('online', handleOnline);
 window.removeEventListener('offline', handleOffline);
 };
 }, [setOnlineStatus]);

 if (isOnline) {
 // We only show the green connected banner briefly or hide it.
 // Let's hide it when online for a cleaner UI, but maybe a brief toast is better.
 // Alternatively, show a very slim green banner.
 return null;
 }

 return (
 <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium z-[9999] relative">
 <WifiOff className="w-4 h-4" />
 ⚠ Offline Mode: Data will sync when internet is available
 </div>
 );
}
