import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    CloudSun, Droplets, MapPin, AlertTriangle, Bug, Navigation,
    ChevronDown, Wind, Map as MapIcon, Plane, ThermometerSun, Leaf, Info,
    CheckCircle2, AlertCircle, ArrowRight, ChevronRight, ShieldAlert, CloudRain, Settings,
    Wheat, IndianRupee, Activity
} from 'lucide-react';

const CircularProgress = ({ value, label, subLabel, color, size = 120, strokeWidth = 8, bgColor = '#e1efe6' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90 overflow-visible">
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke={bgColor} strokeWidth={strokeWidth} fill="none"
                />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke={color} strokeWidth={strokeWidth} fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center px-1 w-full">
                <span className="text-xl font-bold text-nature-900 dark:text-white leading-none">{value}%</span>
                {label && <span className="text-[9px] text-nature-500 uppercase tracking-tighter mt-1 leading-tight break-words w-full">{label}</span>}
                {subLabel && <span className="text-[9px] text-nature-400 mt-0.5">{subLabel}</span>}
            </div>
        </div>
    );
};

import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { useLiveTranslation } from '../hooks/useLiveTranslation';
import { useOfflineStore } from '../store/useOfflineStore';
import { useAlerts } from '../context/AlertsContext';

export default function Dashboard() {
    const { tLive: t } = useLiveTranslation();
    const { user } = useAuth();
    const [profile, setProfile] = useState({ name: 'Farmer', farmer_id: '---' });
    const { isOnline } = useOfflineStore();
    const { alerts, recs = [] } = useAlerts();

    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                const { data, error } = await supabase
                    .from('users')
                    .select('name, farmer_id')
                    .eq('id', user.id)
                    .single();
                if (!error && data) setProfile(data);
            }
        };
        fetchProfile();
    }, [user]);

    // Simulated live data mixed with REAL telemetry
    const [liveData, setLiveData] = useState({
        temp: 26.0,
        moisture: 31,
        irrigationUsage: 78,
        humidity: 68,
        wind: 11.1,
        soilTemp: 23,
        ph: 6.2
    });

    // 1. Fetch Real Weather Data (Temp, Humidity, Wind)
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const API_KEY = "e5c8c35726d52c53ed66735380eae2e9";
                const url = `https://api.openweathermap.org/data/2.5/weather?q=Pune&appid=${API_KEY}&units=metric`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.main) {
                    setLiveData(prev => ({
                        ...prev,
                        temp: data.main.temp,
                        humidity: data.main.humidity,
                        wind: data.wind.speed,
                        soilTemp: Math.round(data.main.temp - 2) // Approximate soil temp
                    }));
                }
            } catch (err) {
                console.error("Weather sync failed:", err);
            }
        };

        fetchWeather();
        const interval = setInterval(fetchWeather, 300000); // Poll every 5 mins
        return () => clearInterval(interval);
    }, []);

    // 2. Fetch Real Sensor Data (Moisture, pH)
    useEffect(() => {
        const fetchTelemetry = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('sensor_data')
                .select('*')
                .eq('farmer_id', 'GLOBAL_AI_SEED')
                .order('created_at', { ascending: false })
                .limit(1);

            if (data && data.length > 0) {
                const latest = data[0];
                setLiveData(prev => ({
                    ...prev,
                    moisture: latest.moisture || prev.moisture,
                    ph: latest.ph || prev.ph
                }));
            }
        };

        fetchTelemetry();
        const interval = setInterval(fetchTelemetry, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, [user]);

    return (
        <div className="min-h-screen bg-transparent text-nature-700 dark:text-nature-200 font-sans p-2">

            {/* Top Toolbar */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-4 mb-6 bg-white dark:bg-nature-950/60 backdrop-blur-md p-3 rounded-2xl border border-nature-200 dark:border-nature-800 shadow-sm">
                <div className="flex flex-wrap items-center gap-4 xl:gap-6 w-full xl:w-auto overflow-hidden">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <CloudSun className="w-5 h-5 text-orange-400" />
                        <span className="text-nature-700 dark:text-nature-200 font-medium">{t('Welcome Farmer')}</span>
                        <span className="text-earth-600 font-bold text-sm ml-2 bg-earth-50 px-2 py-1 rounded border border-earth-100">{profile.farmer_id}</span>
                        <span className="text-nature-900 dark:text-white font-bold text-lg ml-2 border-r border-nature-300 pr-4 transition-all">{liveData.temp}°C</span>
                    </div>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        <span className="text-nature-700 dark:text-nature-200 transition-all">{liveData.humidity}%</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full xl:w-auto justify-start xl:justify-end relative z-[100]">

                    {/* Online / Offline Status Indicator (Moved to Right) */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-nature-950 rounded-lg border border-nature-200 dark:border-nature-800 shadow-sm transition">
                        <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-[pulse_2s_ease-in-out_infinite]' : 'bg-red-500'}`}></span>
                        <span className={`text-xs font-bold ${isOnline ? 'text-green-700' : 'text-red-600'}`}>
                            {isOnline ? t('Online') : t('Offline')}
                        </span>
                    </div>

                    <Link to="/app/insights" className="flex items-center gap-2 bg-white dark:bg-nature-950 px-3 py-1.5 rounded-lg border border-nature-200 dark:border-nature-800 whitespace-nowrap hover:bg-nature-50 dark:bg-nature-900 cursor-pointer transition shadow-sm">
                        <Plane className="w-4 h-4 text-nature-500" />
                        <span className="text-xs text-nature-600 font-medium">{t('Drone Status: Online')}</span>
                    </Link>
                    <Link to="/app/map" className="p-2 bg-white dark:bg-nature-950 rounded-lg border border-nature-200 dark:border-nature-800 hover:bg-nature-50 dark:bg-nature-900 cursor-pointer transition shadow-sm">
                        <MapPin className="w-5 h-5 text-nature-500 hover:text-earth-500" />
                    </Link>

                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Link to="/app/map" className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 p-4 shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-2 group">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:bg-blue-100 transition">
                        <MapIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="text-sm font-bold text-nature-800 dark:text-nature-100 text-center">{t('Farm Overview')}</span>
                </Link>
                <Link to="/app/irrigation" className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 p-4 shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-2 group">
                    <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center border border-cyan-100 group-hover:bg-cyan-100 transition">
                        <Droplets className="w-5 h-5 text-cyan-500" />
                    </div>
                    <span className="text-sm font-bold text-nature-800 dark:text-nature-100 text-center">{t('Irrigation Control')}</span>
                </Link>
                <Link to="/app/insights" className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 p-4 shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-2 group">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100 group-hover:bg-purple-100 transition">
                        <Plane className="w-5 h-5 text-purple-500" />
                    </div>
                    <span className="text-sm font-bold text-nature-800 dark:text-nature-100 text-center">{t('Drone Missions')}</span>
                </Link>
                <Link to="/app/alerts" className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 p-4 shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-2 group">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100 group-hover:bg-red-100 transition">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <span className="text-sm font-bold text-nature-800 dark:text-nature-100 text-center">{t('Alerts')}</span>
                </Link>

            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                {/* COLUMN 1 (Left) */}
                <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-4">

                    {/* Farm Info */}
                    <div className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl p-5 border border-nature-200 dark:border-nature-800 shadow-md hover:shadow-lg transition relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-earth-100 rounded-bl-full blur-2xl opacity-50"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <h2 className="text-xl font-bold text-nature-900 dark:text-white flex items-center gap-2">
                                    <Leaf className="w-5 h-5 text-green-500" /> {profile.name}'s Farm
                                </h2>
                                <p className="text-xs text-nature-500 mt-1 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Maharashtra, India
                                </p>
                            </div>
                            <div className="bg-nature-50 dark:bg-nature-900 p-2 rounded-lg border border-nature-100 dark:border-nature-700/50 flex items-center gap-2">
                                <CloudSun className="w-5 h-5 text-orange-400" />
                                <span className="text-nature-900 dark:text-white font-bold transition-all">{liveData.temp}°C</span>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-nature-100 dark:border-nature-700/50 pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <Droplets className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm font-medium text-nature-700 dark:text-nature-200">{t('Irrigation')}</span>
                                </div>
                                <span className="text-xl font-bold text-nature-900 dark:text-white transition-all">{liveData.irrigationUsage}%</span>
                            </div>
                            <div className="w-full bg-nature-100 dark:bg-nature-800 rounded-full h-2 mb-2 overflow-hidden">
                                <div className="bg-gradient-to-r from-earth-400 to-earth-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${liveData.irrigationUsage}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs text-nature-500">
                                <span>{t('Optimal Moisture')}</span>
                                <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {t('Active')}</span>
                                <span>{t('Root Zone')}</span>
                            </div>
                        </div>

                        <Link to="/app/map" className="absolute inset-0 z-20" aria-label="Go to Map"></Link>

                        <div className="mt-4 bg-nature-50 dark:bg-nature-900 rounded-xl p-3 border border-nature-100 dark:border-nature-700/50 flex justify-between items-center relative z-30 pointer-events-none">
                            <div className="flex items-center gap-2">
                                <ThermometerSun className="w-4 h-4 text-orange-500" />
                                <span className="text-sm font-medium text-nature-700 dark:text-nature-200">{t('Soil Moisture')}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-bold text-nature-900 dark:text-white transition-all">{liveData.moisture}%</span>
                                <p className="text-[10px] text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {t('Moderate')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Soil Condition */}
                    <div className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl p-5 border border-nature-200 dark:border-nature-800 shadow-sm relative flex flex-col items-center">
                        <div className="flex justify-between items-center mb-6 w-full">
                            <h3 className="text-base font-bold text-nature-900 dark:text-white flex items-center gap-2 flex-wrap">
                                {t('Soil Condition')}
                            </h3>
                            <button className="text-nature-400 hover:text-nature-600 cursor-pointer p-1"><Info className="w-4 h-4" /></button>
                        </div>

                        <div className="flex justify-around items-center w-full gap-2">
                            <CircularProgress value={liveData.moisture} label={t('Soil Moisture')} subLabel={t('Moderate')} color="#3b82f6" bgColor="#e1efe6" size={96} strokeWidth={6} />
                            <CircularProgress value={liveData.soilTemp} label={t('Soil Temp')} subLabel={t('Normal')} color="#f59e0b" bgColor="#e1efe6" size={96} strokeWidth={6} />
                            <div className="flex flex-col items-center justify-center relative" style={{ width: 96, height: 96 }}>
                                <svg width="96" height="96" className="transform -rotate-90 overflow-visible">
                                    <circle cx="48" cy="48" r="45" stroke="#e1efe6" strokeWidth="6" fill="none" />
                                    <circle cx="48" cy="48" r="45" stroke="#22c55e" strokeWidth="6" fill="none" strokeDasharray="282.7" strokeDashoffset="100" strokeLinecap="round" className="transition-all duration-1000" />
                                </svg>
                                <div className="absolute flex flex-col items-center justify-center text-center px-1 w-full">
                                    <span className="text-xl font-bold text-nature-900 dark:text-white transition-all leading-none">{liveData.ph}</span>
                                    <span className="text-[9px] text-nature-500 uppercase tracking-tighter mt-1 leading-tight break-words w-full">{t('pH Level')}</span>
                                    <span className="text-[9px] text-green-600 mt-0.5">{t('Optimal')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Alerts Widget */}
                    <Link to="/app/alerts" className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 shadow-md hover:shadow-lg transition flex flex-col group cursor-pointer overflow-hidden max-h-[260px]">
                        <div className="px-5 py-4 border-b border-nature-100 dark:border-nature-700/50 flex justify-between items-center group-hover:bg-nature-50 dark:bg-nature-900/50 rounded-t-2xl transition">
                            <h3 className="text-base font-bold text-nature-900 dark:text-white flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500" /> {t('Alerts')}
                            </h3>
                            <ChevronRight className="w-4 h-4 text-nature-400 group-hover:text-nature-700 dark:text-nature-200 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div className="p-3 space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                            {alerts.length === 0 ? (
                                <div className="flex items-center justify-center py-6 text-nature-400 text-sm">No active alerts — all clear ✅</div>
                            ) : alerts.slice(0, 3).map(alert => (
                                <div key={alert.id} className={`${alert.bg} border ${alert.border} rounded-xl p-3 flex gap-3 hover:opacity-90 transition`}>
                                    <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full ${alert.bg} flex items-center justify-center border ${alert.border}`}>
                                        <AlertTriangle className={`w-4 h-4 ${alert.color}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-semibold text-nature-900 dark:text-white">{alert.title}</h4>
                                        </div>
                                        <p className="text-[11px] text-nature-600 leading-tight mt-1 line-clamp-2">{alert.msg}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Link>

                </div>

                {/* COLUMN 2 (Center) */}
                <div className="md:col-span-12 lg:col-span-5 flex flex-col gap-4">

                    {/* Crop Health Map Image Card */}
                    <Link to="/app/map" className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 p-4 relative flex flex-col group shadow-md hover:shadow-lg transition cursor-pointer">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-bold text-nature-900 dark:text-white group-hover:text-earth-600 transition-colors">{t('Crop Health Map')}</h3>
                            <div className="text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded-full border border-green-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> {t('Very Healthy')}
                            </div>
                        </div>

                        {/* Tab Headers */}
                        <div className="absolute top-4 right-4 flex gap-2 z-10 bg-white dark:bg-nature-950/90 backdrop-blur-md p-1.5 rounded-xl shadow-md border border-nature-200 dark:border-nature-800">
                            <button className="px-3 py-1.5 text-xs font-semibold text-nature-600 hover:text-nature-900 dark:text-white transition rounded-lg hover:bg-nature-50 dark:bg-nature-900">3D</button>
                            <button className="px-3 py-1.5 text-xs font-semibold bg-earth-500 text-white rounded-lg border border-earth-600 shadow-sm leading-none flex items-center">30 Apr</button>
                            <button className="px-3 py-1.5 text-xs font-semibold text-nature-600 hover:text-nature-900 dark:text-white transition rounded-lg hover:bg-nature-50 dark:bg-nature-900">1 May</button>
                            <button className="px-3 py-1.5 text-xs font-semibold text-nature-600 hover:text-nature-900 dark:text-white transition rounded-lg hover:bg-nature-50 dark:bg-nature-900">2 May</button>
                        </div>

                        <div className="w-full h-52 rounded-xl overflow-hidden relative border border-nature-200 dark:border-nature-800">
                            <img src="/images/crop-health.png" alt="Crop Health Map" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-nature-900/10 to-transparent"></div>
                        </div>
                    </Link>

                    {/* Automated Drone Mission */}
                    <Link to="/app/insights" className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 p-4 flex items-center justify-between group cursor-pointer hover:bg-nature-50 dark:bg-nature-900 hover:shadow-md transition shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-earth-50 border border-earth-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plane className="w-5 h-5 text-earth-500 group-hover:text-earth-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-nature-900 dark:text-white group-hover:text-earth-600 transition-colors">{t('Automated Drone Mission 09')}</h4>
                                <p className="text-xs text-nature-500">{t('Today at')} 11:45 AM</p>
                            </div>
                        </div>
                        <div className="bg-nature-50 dark:bg-nature-900 rounded-lg py-1.5 px-3 border border-nature-200 dark:border-nature-800 flex items-center gap-2 group-hover:bg-white dark:bg-nature-950 transition-colors">
                            <Plane className="w-3 h-3 text-nature-400 group-hover:text-earth-500" />
                            <span className="text-xs font-bold text-nature-700 dark:text-nature-200 group-hover:text-earth-600">18m 20s</span>
                        </div>
                    </Link>

                    {/* NDVI Vegetation Map (Small View) */}
                    <div className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 p-4 shadow-sm flex-1 flex flex-col">
                        <h3 className="text-base font-bold text-nature-900 dark:text-white mb-3 group-hover:text-earth-600 transition-colors">{t('NDVI Vegetation Map')}</h3>
                        <div className="w-full flex-1 rounded-xl overflow-hidden relative border border-nature-200 dark:border-nature-800 min-h-[140px] max-h-[220px]">
                            <img src="/images/ndvi-map.png" alt="NDVI" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-x-2 bottom-2 bg-white dark:bg-nature-950/90 backdrop-blur-sm border border-nature-200 dark:border-nature-800 rounded-lg p-1.5 flex gap-1 justify-center sm:justify-between overflow-x-auto scrollbar-hide flex-wrap pointer-events-none">
                                <button className="px-3 py-1 text-[10px] font-bold bg-earth-500 text-white rounded-md">NDVI</button>
                                <button className="px-3 py-1 text-[10px] font-semibold text-nature-700 dark:text-nature-200 hover:text-nature-900 dark:text-white whitespace-nowrap">{t('Topography')}</button>
                                <button className="px-3 py-1 text-[10px] font-semibold text-nature-700 dark:text-nature-200 hover:text-nature-900 dark:text-white whitespace-nowrap">{t('Crop Zones')}</button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* COLUMN 3 (Right) */}
                <div className="md:col-span-12 lg:col-span-3 flex flex-col gap-4">

                    {/* Irrigation Control Widget */}
                    <Link to="/app/irrigation" className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 p-4 sm:p-5 shadow-md hover:shadow-lg transition relative flex flex-col group cursor-pointer w-full mb-4">
                        <div className="flex justify-between items-center mb-4 sm:mb-6">
                            <h3 className="text-lg font-bold text-nature-900 dark:text-white group-hover:text-earth-600 transition-colors">{t('Irrigation Control')}</h3>
                            <button className="text-nature-400 hover:text-earth-500 p-1"><Settings className="w-4 h-4" /></button>
                        </div>

                        <div className="flex justify-center mb-4 sm:mb-6 relative items-center py-4">
                            {/* Outer decorative ring */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[140px] h-[140px] rounded-full border border-nature-100 dark:border-nature-700/50"></div>
                            </div>
                            <CircularProgress value={liveData.moisture} color="#c38d4e" bgColor="#e1efe6" size={120} strokeWidth={8} />

                            <div className="absolute right-0 sm:right-0 top-0 bg-white dark:bg-nature-950/95 backdrop-blur-md border border-nature-200 dark:border-nature-800 shadow-md p-2 rounded-xl text-right z-10 hidden sm:block">
                                <span className="text-[10px] text-nature-500 uppercase tracking-wider block">{t('Next Irrigation')}</span>
                                <span className="text-xs font-bold text-nature-900 dark:text-white flex items-center gap-1 justify-end"><Droplets className="w-3 h-3 text-blue-500" /> 3 {t('Hours')}</span>
                            </div>
                            <div className="absolute right-0 sm:right-0 bottom-0 bg-white dark:bg-nature-950/95 backdrop-blur-md border border-nature-200 dark:border-nature-800 shadow-md p-2 rounded-xl text-right z-10 hidden sm:block">
                                <span className="text-[10px] text-nature-500 uppercase tracking-wider block">{t('Pump Status')}</span>
                                <span className="text-xs font-bold text-nature-900 dark:text-white flex items-center gap-1 justify-end text-green-600"><Activity className="w-3 h-3" /> {t('Active')}</span>
                            </div>
                        </div>

                        <div className="space-y-2 mt-auto">
                            <div className="flex justify-between items-center text-sm border-b border-nature-100 dark:border-nature-700/50 pb-2">
                                <span className="text-nature-500">{t('Soil Moisture')}</span>
                                <span className="text-nature-900 dark:text-white font-semibold flex items-center gap-2">
                                    <Leaf className="w-4 h-4 text-green-500" /> 108 %
                                    <div className="w-16 h-2 bg-nature-100 dark:bg-nature-800 rounded-full overflow-hidden ml-2">
                                        <div className="bg-earth-500 h-full w-[31%]"></div>
                                    </div>
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-nature-500">{t('Valve Status')}</span>
                                <span className="text-nature-900 dark:text-white font-bold text-green-600">{t('Optimal Flow')}</span>
                            </div>
                        </div>

                        <div className="w-full mt-auto bg-earth-500 group-hover:bg-earth-600 text-white font-bold py-3 rounded-xl shadow-[0_4px_10px_rgba(195,141,78,0.3)] transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2 relative z-30 pointer-events-none">
                            {t('CONTROL PANEL')}
                        </div>
                    </Link>

                    {/* Recommendations (Moved here to rebalance layout) */}
                    <Link to="/app/recommendations" className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 shadow-md hover:shadow-lg transition flex flex-col cursor-pointer group w-full">
                        <div className="px-5 py-3 border-b border-nature-100 dark:border-nature-700/50 flex justify-between items-center group-hover:bg-nature-50 dark:bg-nature-900/50 rounded-t-2xl transition">
                            <h3 className="text-base font-bold text-nature-900 dark:text-white flex items-center gap-2 group-hover:text-earth-600 transition-colors">
                                {t('Recommendations')}
                            </h3>
                            <ChevronRight className="w-4 h-4 text-nature-400 group-hover:text-nature-700 dark:text-nature-200 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div className="p-3 space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                            {recs.length === 0 ? (
                                <div className="flex items-center justify-center py-6 text-nature-400 text-sm">No recommendations available.</div>
                            ) : recs.slice(0, 3).map(rec => {
                                const Icon = rec.icon;
                                return (
                                    <div key={rec.id} className={`${rec.iconBg} border border-nature-100 dark:border-nature-700/50/50 rounded-xl p-3 flex gap-3 hover:opacity-90 transition cursor-pointer group`}>
                                        <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full ${rec.iconBg} border border-nature-200 dark:border-nature-800/50 flex items-center justify-center ${rec.iconColor} group-hover:scale-110 transition-transform`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-nature-900 dark:text-white leading-tight">{rec.title}</h4>
                                            <p className="text-[11px] text-nature-600 leading-tight mt-1 line-clamp-2">{rec.reason}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Link>

                </div>

            </div>
        </div >
    );
}
