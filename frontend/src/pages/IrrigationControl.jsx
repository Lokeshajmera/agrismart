import React, { useState, useEffect, useMemo } from 'react';
import {
 Droplets, Settings2, Power, AlertCircle, Clock,
 Play, Pause, RefreshCcw, Activity, ThermometerSun,
 Database, BrainCircuit, Waves, CheckCircle2, Wind,
 CloudRain, Sun
} from 'lucide-react';
import {
 LineChart, Line, XAxis, YAxis, CartesianGrid,
 Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLiveTranslation } from '../hooks/useLiveTranslation';

export default function IrrigationControl() {
 const { tLive: t } = useLiveTranslation();
 const { user } = useAuth();

 // Live Data State
 const [liveData, setLiveData] = useState([]);
 const [isLoading, setIsLoading] = useState(true);

 // AI Logic Local States (Replaces DB columns as requested)
 const [mode1, setMode1] = useState('auto');
 const [mode2, setMode2] = useState('auto');

 // External Data State (Weather Fallback)
 const [weather, setWeather] = useState({ temp: 28, humidity: 60, rain: 0, city: 'Pune' });
 const API_KEY = "e5c8c35726d52c53ed66735380eae2e9";

 const fetchLiveStream = async () => {
 if (liveData.length === 0) setIsLoading(true);
 try {
 const { data } = await supabase
 .from('sensor_data')
 .select('*')
 .order('created_at', { ascending: false })
 .limit(20);

 if (data && data.length > 0) {
 setLiveData(data.reverse()); // Set chronologically left to right
 }
 } catch (err) { } finally { setIsLoading(false); }
 };

 // 1. Fetch Live Stream
 useEffect(() => {
 fetchLiveStream();
 const interval = setInterval(fetchLiveStream, 5000); // 5s deep polling
 return () => clearInterval(interval);
 }, []);

 // 2. Fetch Live Weather Intelligence
 useEffect(() => {
 const fetchWeather = async () => {
 try {
 const url = `https://api.openweathermap.org/data/2.5/weather?q=${weather.city}&appid=${API_KEY}&units=metric`;
 const response = await fetch(url);
 const data = await response.json();
 if (data.main) {
 setWeather({ temp: data.main.temp, humidity: data.main.humidity, rain: data.rain ? (data.rain['1h'] || 0) : 0, city: data.name });
 }
 } catch (err) { }
 };
 fetchWeather();
 const interval = setInterval(fetchWeather, 300000);
 return () => clearInterval(interval);
 }, [weather.city]);

 const currentData = useMemo(() => {
 if (liveData.length === 0) return null;
 return liveData[liveData.length - 1]; // Absolute latest DB row
 }, [liveData]);

 // Helpers to generate UI averages matching backend
 const getAvg1 = (d) => {
 let count = 0, sum = 0;
 if (d.soil1 !== null) { sum += Number(d.soil1); count++; }
 if (d.soil2 !== null) { sum += Number(d.soil2); count++; }
 return count > 0 ? sum / count : 0;
 };

 const getAvg2 = (d) => {
 let count = 0, sum = 0;
 if (d.soil3 !== null) { sum += Number(d.soil3); count++; }
 if (d.soil4 !== null) { sum += Number(d.soil4); count++; }
 return count > 0 ? sum / count : 0;
 };

 const getReason = (avg, temp, mode) => {
 if (mode === 'manual') return 'Manual Override Activated';
 if (avg > 70) return 'Overwatering – Irrigation OFF';
 if (temp > 28 && avg < 45) return 'High Temperature – Priority Irrigation';
 if (temp < 15 && avg < 45) return 'Cold Conditions – Irrigation Blocked';
 if (avg < 35) return 'Low Moisture – Irrigation ON';
 if (avg > 60) return 'Optimal Moisture – Irrigation OFF';
 return 'Stable Environment Checks';
 };

 // --- FRONTEND AI MATRIX ENGINE ---
 // Safely replaces the backend interval. Executes precisely on mode or liveData change.
 useEffect(() => {
 if (!currentData) return;

 const temp = Number(currentData.temp1) || weather.temp;
 const avg1 = getAvg1(currentData);
 const avg2 = getAvg2(currentData);

 const evaluateArea = (avg, currentMode, currentIrr) => {
 if (currentMode === 'manual') return currentIrr; // DO NOT override user
 if (avg > 70) return false; // OVERWATER -> Force OFF
 if (temp > 28 && avg < 45) return true; // Priority ON
 if (temp < 15 && avg < 45) return false; // Block OFF
 if (avg < 35) return true; // Low Moist -> ON
 if (avg > 60) return false; // Optimal -> OFF
 return currentIrr;
 };

 const newIrr1 = evaluateArea(avg1, mode1, currentData.irrigation1 || false);
 const newIrr2 = evaluateArea(avg2, mode2, currentData.irrigation2 || false);

 // Only explicitly update the database columns if the intelligent matrix determines a state change!
 if (newIrr1 !== (currentData.irrigation1 || false) || newIrr2 !== (currentData.irrigation2 || false)) {
 supabase.from('sensor_data')
 .update({ irrigation1: newIrr1, irrigation2: newIrr2 })
 .eq('id', currentData.id)
 .then(() => fetchLiveStream()); // Optimistic UI refresh
 }
 }, [currentData, mode1, mode2, weather.temp]);


 // Database Sync Actions
 const handleModeChange = (areaId, newMode) => {
 if (areaId === 1) setMode1(newMode);
 if (areaId === 2) setMode2(newMode);
 toast.success(`Area ${areaId} switched to ${newMode.toUpperCase()} mode!`);
 };

 const handleTogglePump = async (areaId) => {
 if (!currentData) return;
 const currentMode = areaId === 1 ? mode1 : mode2;
 const irrCol = areaId === 1 ? 'irrigation1' : 'irrigation2';

 if (currentMode === 'auto') {
 toast.error('Switch to MANUAL mode first to override AI rules.', { duration: 3000 });
 return;
 }

 const newState = !currentData[irrCol];
 // Optimistic UI update for instantaneous feedback
 const updatedData = [...liveData];
 updatedData[updatedData.length - 1] = { ...currentData, [irrCol]: newState };
 setLiveData(updatedData);

 try {
 await supabase.from('sensor_data').update({ [irrCol]: newState }).eq('id', currentData.id);
 toast.success(`Area ${areaId} Pump is now ${newState ? 'ON' : 'OFF'}`);
 } catch (err) {
 toast.error('Failed to command pump.');
 fetchLiveStream(); // Revert optimism on failure
 }
 };

 const chartData = useMemo(() => {
 if (liveData.length === 0) return [];
 return liveData.map((d) => ({
 time: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
 avg1: getAvg1(d),
 avg2: getAvg2(d)
 }));
 }, [liveData]);

 const activeData = currentData || {
 temp1: weather.temp,
 water_level: 85,
 soil1: null,
 soil2: null,
 soil3: null,
 soil4: null,
 irrigation1: false,
 irrigation2: false
 };

 const temp = Number(activeData.temp1) || weather.temp;
 const water = Number(activeData.water_level) || 85;

 const avg1 = getAvg1(activeData);
 const avg2 = getAvg2(activeData);
 const dispIrr1 = activeData.irrigation1 || false;
 const dispIrr2 = activeData.irrigation2 || false;

 const isAutoMode = mode1 === 'auto' && mode2 === 'auto';
 const toggleGlobalMode = () => {
 const newMode = isAutoMode ? 'manual' : 'auto';
 setMode1(newMode);
 setMode2(newMode);
 toast.success(`Switched to ${newMode.toUpperCase()} mode!`);
 };

 return (
 <div className="max-w-[1400px] mx-auto p-4 md:p-6 animate-in fade-in duration-500">

 {/* Header */}
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-nature-950 rounded-2xl p-4 md:p-6 border border-nature-200/60 dark:border-nature-800 shadow-sm mb-6">
 <div>
 <h1 className="text-xl md:text-2xl font-bold text-nature-900 dark:text-white flex items-center gap-3">
 <Activity className="w-5 h-5 md:w-6 md:h-6 text-orange-500" /> {t('Live Irrigation Control')}
 </h1>
 <p className="text-[11px] md:text-[13px] text-nature-500 dark:text-white mt-1.5 font-medium">{t('Synchronize manual overrides with automated real-time thresholds.')}</p>
 </div>
 <div className="flex items-center gap-4">
 <button
 onClick={toggleGlobalMode}
 className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide flex items-center gap-2 transition-all ${isAutoMode ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-nature-100 text-nature-600 dark:text-white hover:bg-nature-200'}`}
 >
 {isAutoMode && <Settings2 className="w-4 h-4" />}
 {isAutoMode ? t('Auto Mode Active') : t('Manual Override')}
 </button>
 <div className="flex items-center gap-2 text-nature-400 dark:text-white text-[10px] font-bold uppercase tracking-widest px-1">
 <RefreshCcw className={`w-3.5 h-3.5 ${!currentData ? 'animate-spin' : 'animate-spin-slow'} text-emerald-500`} />
 {!currentData ? t('CONNECTING') : t('SYNCING')}
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

 {/* Left Column (Weather & Pumps) */}
 <div className="lg:col-span-2 space-y-6">

 {/* Weather Mini-Card */}
 <div className="bg-white dark:bg-nature-950 rounded-2xl p-5 border border-nature-200/60 dark:border-nature-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-nature-50 dark:bg-nature-900 rounded-xl flex items-center justify-center border border-nature-100 dark:border-nature-800">
 <ThermometerSun className="w-6 h-6 text-nature-700 dark:text-white " />
 </div>
 <div>
 <h3 className="font-bold text-[13px] md:text-sm text-nature-900 dark:text-white">{weather.city} {t('Weather')}</h3>
 <p className="text-[9px] md:text-[10px] text-nature-500 dark:text-white font-bold tracking-wider uppercase mt-1">{t('REAL-TIME INTELLIGENCE')}</p>
 </div>
 </div>
 <div className="flex gap-6 sm:gap-10 sm:pr-4">
 <div className="text-center sm:text-right">
 <p className="text-[9px] md:text-[10px] text-nature-400 dark:text-white font-bold uppercase tracking-wider mb-1">{t('TEMP')}</p>
 <p className="text-sm md:text-base font-bold text-nature-900 dark:text-white">{weather.temp.toFixed(1)}°C</p>
 </div>
 <div className="text-center sm:text-right">
 <p className="text-[9px] md:text-[10px] text-nature-400 dark:text-white font-bold uppercase tracking-wider mb-1">{t('HUMIDITY')}</p>
 <p className="text-sm md:text-base font-bold text-nature-900 dark:text-white">{weather.humidity}%</p>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
 <DarkPumpCard id={1} title={t("Pumping Unit #1")} moisture={avg1} isPumping={dispIrr1} isAutoMode={isAutoMode} onToggle={() => handleTogglePump(1)} t={t} reason={getReason(avg1, temp, mode1)} />
 <DarkPumpCard id={2} title={t("Pumping Unit #2")} moisture={avg2} isPumping={dispIrr2} isAutoMode={isAutoMode} onToggle={() => handleTogglePump(2)} t={t} reason={getReason(avg2, temp, mode2)} />
 </div>
 </div>

 {/* Right Column (Logic Control) */}
 <div className="lg:col-span-1">
 <div className="bg-white dark:bg-nature-950 rounded-3xl p-6 border border-nature-200/60 dark:border-nature-800 shadow-sm h-full flex flex-col">
 <div className="flex justify-between items-start mb-8">
 <div>
 <h3 className="font-bold text-[15px] text-nature-900 dark:text-white">{t('Field Logic Control')}</h3>
 <p className="text-[11px] text-nature-500 dark:text-white font-medium mt-1.5">{t('Independent Dual-Channel AI')}</p>
 </div>
 <div className="text-right">
 <p className="text-[9px] text-nature-400 dark:text-white font-bold uppercase tracking-widest mb-1">{t('MAIN TANK')}</p>
 <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1.5">{water.toFixed(1)}%</p>
 <div className="w-20 h-1.5 bg-nature-100 dark:bg-nature-800 rounded-full overflow-hidden">
 <div className={`h-full rounded-full shadow-sm ${water < 20 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${water}%` }}></div>
 </div>
 </div>
 </div>

 <div className="space-y-4">
 {/* Area 1 Toggle */}
 <div className="flex items-center justify-between border border-[#e2e8f0] dark:border-nature-800 p-5 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.015)] bg-white dark:bg-nature-900 mb-4">
 <div className="flex items-center gap-5">
 <div className="w-[48px] h-[48px] rounded-[16px] bg-[#eef3f0] dark:bg-nature-800 flex items-center justify-center text-[#698a76] dark:text-white border border-[#e2e8e5] dark:border-nature-700">
 <Droplets className="w-[22px] h-[22px] opacity-90" />
 </div>
 <div>
 <h4 className="font-extrabold text-[15px] text-[#1a211e] dark:text-white tracking-tight">{t('Area 1 (North Section)')}</h4>
 <p className="text-[12px] text-[#8aa396] dark:text-white mt-1 font-medium">{t('Soil Moisture:')} <span className="font-extrabold text-[#1a211e] dark:text-white ml-1">{avg1.toFixed(1)}%</span> <span className="mx-2 text-[#cbd5e1] dark:text-white">•</span> <span className={dispIrr1 ? 'text-blue-500 dark:text-blue-400 font-extrabold' : 'text-[#8aa396] dark:text-white font-extrabold uppercase'}>{dispIrr1 ? t('PUMPING') : t('IDLE')}</span></p>
 </div>
 </div>
 <label className={`relative inline-flex items-center ${!isAutoMode ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} group mr-2`}>
 <input type="checkbox" className="sr-only peer" checked={dispIrr1} onChange={() => handleTogglePump(1)} disabled={isAutoMode} />
 <div className="w-[46px] h-[26px] bg-[#e2e8f0] dark:bg-nature-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#cbd5e1] after:border after:rounded-full after:h-[22px] after:w-[22px] after:transition-all peer-checked:bg-blue-500"></div>
 </label>
 </div>

 {/* Area 2 Toggle */}
 <div className="flex items-center justify-between border border-[#e2e8f0] dark:border-nature-800 p-5 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.015)] bg-white dark:bg-nature-900">
 <div className="flex items-center gap-5">
 <div className="w-[48px] h-[48px] rounded-[16px] bg-[#eef3f0] dark:bg-nature-800 flex items-center justify-center text-[#698a76] dark:text-white border border-[#e2e8e5] dark:border-nature-700">
 <Droplets className="w-[22px] h-[22px] opacity-90" />
 </div>
 <div>
 <h4 className="font-extrabold text-[15px] text-[#1a211e] dark:text-white tracking-tight">{t('Area 2 (South Section)')}</h4>
 <p className="text-[12px] text-[#8aa396] dark:text-white mt-1 font-medium">{t('Soil Moisture:')} <span className="font-extrabold text-[#1a211e] dark:text-white ml-1">{avg2.toFixed(1)}%</span> <span className="mx-2 text-[#cbd5e1] dark:text-white">•</span> <span className={dispIrr2 ? 'text-blue-500 dark:text-blue-400 font-extrabold' : 'text-[#8aa396] dark:text-white font-extrabold uppercase'}>{dispIrr2 ? t('PUMPING') : t('IDLE')}</span></p>
 </div>
 </div>
 <label className={`relative inline-flex items-center ${!isAutoMode ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} group mr-2`}>
 <input type="checkbox" className="sr-only peer" checked={dispIrr2} onChange={() => handleTogglePump(2)} disabled={isAutoMode} />
 <div className="w-[46px] h-[26px] bg-[#e2e8f0] dark:bg-nature-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#cbd5e1] after:border after:rounded-full after:h-[22px] after:w-[22px] after:transition-all peer-checked:bg-blue-500"></div>
 </label>
 </div>
 </div>

 <div className="pt-8 mt-5 border-t border-[#f1f5f9] dark:border-nature-800">
 <h4 className="text-[13px] font-extrabold text-[#1a211e] dark:text-white flex items-center gap-2 uppercase tracking-widest mb-4">
 <AlertCircle className="w-[18px] h-[18px] text-red-500" /> {t('INTELLIGENCE ALERTS')}
 </h4>
 <div className="bg-[#f8fafc] dark:bg-nature-900 border border-dashed border-[#bbf7d0] dark:border-nature-700 rounded-[16px] p-4 flex items-center gap-3 w-full">
 <div className="w-6 h-6 rounded-full border border-[#cbd5e1] dark:border-nature-600 flex items-center justify-center bg-white dark:bg-nature-800"><div className="w-2.5 h-2.5 bg-[#cbd5e1] dark:bg-nature-500 rounded-full"></div></div>
 <span className="text-[11px] font-extrabold text-[#64748b] dark:text-white tracking-wider uppercase">{t('NO ACTIVE AI RECOMMENDATIONS')}</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Trends Section */}
 <div className="bg-white dark:bg-nature-950 rounded-3xl p-6 sm:p-8 border border-nature-200/60 dark:border-nature-800 shadow-sm mt-6">
 <div className="flex items-center gap-3 mb-8">
 <Activity className="w-5 h-5 text-orange-400" />
 <h3 className="text-[15px] font-bold text-nature-900 dark:text-white">{t('Telemetry Trends')}</h3>
 </div>
 <div className="h-[260px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={chartData}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
 <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dx={-10} />
 <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
 <Line type="monotone" dataKey="avg1" name={t("Area 1 Moist")} stroke="#3B82F6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} />
 <Line type="monotone" dataKey="avg2" name={t("Area 2 Moist")} stroke="#10B981" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>

 </div>
 );
}

const DarkPumpCard = ({ id, title, moisture, isPumping, isAutoMode, onToggle, t, reason }) => {
 let needLevel = t("MODERATE");
 let needPercent = 45;
 if (moisture < 35) { needLevel = t("HIGH"); needPercent = 85; }
 else if (moisture > 60) { needLevel = t("LOW"); needPercent = 15; }

 return (
 <div className="bg-[#27362f] text-white rounded-[24px] p-6 lg:p-7 shadow-xl border border-[#3b4c44] min-w-0">
 <div className="flex justify-between items-start mb-8">
 <div className="flex items-center gap-5">
 <button
 onClick={!isAutoMode ? onToggle : undefined}
 className={`w-[52px] h-[52px] rounded-[18px] flex items-center justify-center transition-all ${isPumping ? 'bg-[#3b82f6] text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-[#35483f] text-[#8aa396] border border-[#4c6356] hover:bg-[#3d5349] cursor-pointer'}`}
 >
 <Power className="w-[22px] h-[22px]" />
 </button>
 <div>
 <h3 className="font-bold text-[17px] text-white">{title}</h3>
 <p className={`text-[10px] font-bold tracking-widest mt-1.5 uppercase flex items-center gap-1.5 ${isPumping ? 'text-blue-400' : 'text-[#8aa396]'}`}>
 <span className="w-3 h-3 rounded-full flex items-center justify-center bg-current opacity-20"><span className="w-1.5 h-1.5 rounded-full bg-current"></span></span>
 {isPumping ? t('PUMP ACTIVE / INJECTING') : t('PUMP OFF / MOISTURE ADEQUATE')}
 </p>
 </div>
 </div>
 <div className={`px-4 py-1.5 rounded-full border text-[10px] uppercase font-bold tracking-widest ${isPumping ? 'bg-blue-900/30 border-blue-800/50 text-blue-400' : 'bg-[#1e2a24] border-[#3b4c44] text-[#8aa396]'}`}>
 {isPumping ? t('ACTIVE') : t('STANDBY')}
 </div>
 </div>

 <div className="space-y-5">
 <div className="flex justify-between items-center text-[13px] pb-4 border-b border-[#3b4c44]">
 <span className="text-[#8aa396] font-medium tracking-wide">{t('Pump Status')}</span>
 <span className={`font-bold uppercase tracking-wider ${isPumping ? 'text-blue-400' : 'text-white'}`}>{isPumping ? t('ACTIVE') : t('STANDBY')}</span>
 </div>
 <div className="flex justify-between items-center text-[13px] pb-4 border-b border-[#3b4c44] pt-1">
 <span className="text-[#8aa396] font-medium tracking-wide">{t('Irrigation Need')}</span>
 <span className="text-white font-bold uppercase tracking-wider">{needLevel}</span>
 </div>
 <div className="w-full bg-[#1e2a24] h-1.5 rounded-full overflow-hidden border border-[#3b4c44] mt-2">
 <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${needPercent}%` }}></div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4 mt-8">
 <div className="bg-[#1e2a24] p-4 lg:p-5 rounded-2xl border border-[#3b4c44] flex items-center gap-4">
 <Activity className="w-5 h-5 text-[#8aa396]" />
 <div>
 <p className="text-[9px] text-[#8aa396] font-bold uppercase tracking-widest mb-1">{t('SOIL')}</p>
 <p className="text-[15px] font-bold text-white">{moisture.toFixed(1)}%</p>
 </div>
 </div>
 <div className="bg-[#1e2a24] p-4 lg:p-5 rounded-2xl border border-[#3b4c44] flex items-center gap-4">
 <Droplets className="w-5 h-5 text-[#8aa396]" />
 <div>
 <p className="text-[9px] text-[#8aa396] font-bold uppercase tracking-widest mb-1">{t('NEED')}</p>
 <p className="text-[13px] font-bold text-white uppercase">{needLevel}</p>
 </div>
 </div>
 </div>
 </div>
 );
};
