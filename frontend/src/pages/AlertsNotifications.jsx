import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
 AlertTriangle, Info, CheckCircle, Clock, CloudRain,
 Thermometer, Wind, Zap, Droplets, Sun, RefreshCw, BellOff
} from 'lucide-react';
import { useAlerts } from '../context/AlertsContext';
import { useAuth } from '../context/AuthContext';

const ICON_MAP = {
 thermometer: Thermometer,
 rain: CloudRain,
 wind: Wind,
 zap: Zap,
 droplets: Droplets,
 sun: Sun,
 critical: AlertTriangle,
 warning: AlertTriangle,
 info: Info,
 success: CheckCircle,
};

function timeAgo(date) {
 if (!date) return '';
 const diffMs = Date.now() - new Date(date).getTime();
 const mins = Math.floor(diffMs / 60000);
 if (mins < 1) return 'just now';
 if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
 const hrs = Math.floor(mins / 60);
 if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
 return `${Math.floor(hrs / 24)} day(s) ago`;
}

export default function AlertsNotifications() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const { alerts, loading, lastUpdated, markAllRead, refresh } = useAlerts();
 const [refreshing, setRefreshing] = useState(false);

 const handleRefresh = async () => {
 setRefreshing(true);
 await refresh();
 setTimeout(() => setRefreshing(false), 1000); // min 1s so spinner is visible
 };

 return (
 <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
 {/* Header */}
 <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
 <div>
 <h1 className="text-2xl font-bold text-nature-900 dark:text-white tracking-tight">{t("Alerts & Notifications")}</h1>
 <p className="text-nature-500 dark:text-white mt-1 text-sm">
 {t("Real-time weather alerts for your farm. Auto-refreshes every 10 minutes.")}
 </p>
 {lastUpdated && (
 <p className="text-[11px] text-nature-400 dark:text-white mt-0.5 flex items-center gap-1">
 <Clock className="w-3 h-3" />
 Last updated: {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
 </p>
 )}
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={handleRefresh}
 disabled={refreshing}
 className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all cursor-pointer border ${
 refreshing
 ? 'bg-earth-50 text-earth-600 border-earth-300 scale-95'
 : 'text-nature-600 dark:text-white bg-nature-100 dark:bg-nature-800 hover:bg-green-100 dark:hover:bg-green-900/40 hover:text-green-700 hover:border-green-300 active:scale-95 border-nature-200 dark:border-nature-800'
 }`}
 title="Refresh now"
 >
 <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
 {refreshing ? t('Refreshing...') : t('Refresh')}
 </button>
 {alerts.length > 0 && (
 <button
 onClick={markAllRead}
 className="flex items-center gap-1.5 text-sm font-medium text-white bg-earth-600 hover:bg-earth-700 active:scale-95 px-4 py-2 rounded-lg transition-all shadow-sm cursor-pointer"
 >
 <CheckCircle className="w-4 h-4" /> {t("Mark all as read")}
 </button>
 )}
 </div>
 </div>

 {/* Loading State */}
 {loading && (
 <div className="flex flex-col items-center justify-center py-16 text-nature-400 dark:text-white gap-3">
 <RefreshCw className="w-8 h-8 animate-spin" />
 <p className="text-sm font-medium">{t("Fetching live weather data...")}</p>
 </div>
 )}

 {/* Empty State */}
 {!loading && alerts.length === 0 && (
 <div className="flex flex-col items-center justify-center py-20 text-nature-400 dark:text-white gap-3">
 <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
 <BellOff className="w-8 h-8 text-green-500" />
 </div>
 <p className="text-lg font-bold text-nature-700 dark:text-white ">{t("No Active Alerts")}</p>
 <p className="text-sm text-nature-400 dark:text-white">{t("All notifications have been cleared. Alerts will appear here when weather conditions change.")}</p>
 <button
 onClick={refresh}
 className="mt-2 flex items-center gap-1.5 text-sm font-medium text-earth-600 hover:underline"
 >
 <RefreshCw className="w-3.5 h-3.5" /> {t("Check again")}
 </button>
 </div>
 )}

 {/* Alert Cards */}
 {!loading && alerts.length > 0 && (
 <div className="space-y-4">
 {alerts.map(alert => {
 const IconComp = ICON_MAP[alert.icon] || ICON_MAP[alert.type] || Info;
 const isCritical = alert.type === 'critical';
 return (
 <div
 key={alert.id}
 className={`p-4 rounded-xl border ${alert.bg} ${alert.border} flex gap-4 transition-all hover:shadow-md ${isCritical ? 'ring-1 ring-red-200' : ''}`}
 >
 {/* Icon */}
 <div className={`mt-0.5 shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${alert.bg} ${alert.border}`}>
 <IconComp className={`w-5 h-5 ${alert.color}`} />
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start mb-1 gap-2">
 <h3 className={`font-bold text-sm ${isCritical ? 'text-red-900' : 'text-nature-900 dark:text-white'}`}>
 {isCritical && <span className="mr-1">🚨</span>}
 {t(alert.title)}
 </h3>
 <span className="text-[11px] text-nature-400 dark:text-white flex items-center gap-1 whitespace-nowrap shrink-0">
 <Clock className="w-3 h-3" />
 {timeAgo(alert.time)}
 </span>
 </div>
 <p className="text-nature-700 dark:text-white text-sm leading-relaxed">{t(alert.msg)}</p>
 <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
 alert.type === 'critical' ? 'bg-red-100 text-red-700' :
 alert.type === 'warning' ? 'bg-orange-100 text-orange-700' :
 alert.type === 'success' ? 'bg-green-100 text-green-700' :
 'bg-blue-100 text-blue-700'
 }`}>
 {t(alert.type)}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* Source Note */}
 {!loading && (
 <p className="text-center text-[11px] text-nature-400 dark:text-white pt-4 border-t border-nature-100 dark:border-nature-700/50">
 ⛅ Weather data sourced from OpenWeatherMap · {userProfile?.district || 'Pune'}{userProfile?.state ? `, ${userProfile.state}` : ', Maharashtra'}
 </p>
 )}
 </div>
 );
}
