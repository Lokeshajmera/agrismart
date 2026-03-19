import React, { useState, useEffect, useRef, useMemo } from 'react';
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

    // Core Control State
    const [systemAuto, setSystemAuto] = useState(true);
    const [valves, setValves] = useState([
        { id: 1, name: t('Area 1 (North Section)'), status: 'closed', type: 'primary' },
        { id: 2, name: t('Area 2 (South Section)'), status: 'closed', type: 'secondary' },
    ]);

    // Simulation State
    const [historicalData, setHistoricalData] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSimulating, setIsSimulating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [alerts, setAlerts] = useState([]);

    // External Data State
    const [weather, setWeather] = useState({ temp: 28, humidity: 60, rain: 0, city: 'Pune' });
    const API_KEY = "e5c8c35726d52c53ed66735380eae2e9";

    const simulationInterval = useRef(null);
    const fetchedRef = useRef(false);

    // 1. Fetch History for Simulation
    useEffect(() => {
        const fetchHistory = async () => {
            if (fetchedRef.current) return;
            fetchedRef.current = true;
            setIsLoading(true);
            try {
                // Read from GLOBAL_AI_SEED to ensure we have the massive dataset
                const farmerId = 'GLOBAL_AI_SEED';

                const { data } = await supabase
                    .from('sensor_data')
                    .select('*')
                    .eq('farmer_id', farmerId)
                    .order('created_at', { ascending: true })
                    .limit(100);

                if (data && data.length > 0) {
                    setHistoricalData(data);
                } else {
                    toast.error(t('No AI dataset found. Seed data first.'));
                }
            } catch (err) {
                console.error('Error fetching history:', err);
                fetchedRef.current = false;
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    // 2. Fetch Live Weather Intelligence
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const url = `https://api.openweathermap.org/data/2.5/weather?q=${weather.city}&appid=${API_KEY}&units=metric`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.main) {
                    setWeather({
                        temp: data.main.temp,
                        humidity: data.main.humidity,
                        rain: data.rain ? (data.rain['1h'] || 0) : 0,
                        city: data.name
                    });
                }
            } catch (err) {
                console.error('Weather fetch error:', err);
            }
        };
        fetchWeather();
        const interval = setInterval(fetchWeather, 300000); // Update every 5 mins
        return () => clearInterval(interval);
    }, [weather.city]);

    const currentData = useMemo(() => {
        if (historicalData.length === 0) return { moisture: 36, moisture_b: 40, temperature: 28, water_level: 80, ph: 6.5 };
        const data = historicalData[currentIndex];
        return {
            ...data,
            moisture_b: data.moisture_b || (data.moisture + (Math.random() * 20 - 10))
        };
    }, [historicalData, currentIndex]);

    // 3. AI NATIVE ALGORITHM
    const predictWaterLiters = (m, t, h, r, ph) => {
        let baseWater = 40;
        let predictedWater = Math.round(
            baseWater
            - (m * 0.4)
            + (t * 0.5)
            - (r * 3)
            + (Math.abs((ph || 6.5) - 6.5) * 2)
        );
        return Math.max(0, Math.min(predictedWater, 60)); // Bounded 0-60 Liters
    };

    // 4. ML Logic Engine & Precise Thresholds Requested
    useEffect(() => {
        if (!currentData || historicalData.length === 0) return;

        let newAlerts = [];
        let { moisture, moisture_b, water_level, ph } = currentData;

        const waterRequiredArea1 = predictWaterLiters(moisture, weather.temp, weather.humidity, weather.rain, ph);
        const waterRequiredArea2 = predictWaterLiters(moisture_b, weather.temp, weather.humidity, weather.rain, ph);
        const maxWaterReq = Math.max(waterRequiredArea1, waterRequiredArea2);

        // Area 1 AI Alerts
        if (moisture < 30) {
            newAlerts.push({ id: 'ai-req-1', text: t('⚠ Area 1: Irrigation required today'), type: 'warning', icon: Droplets });
        }
        if (moisture >= 40) {
            newAlerts.push({ id: 'high-moist-1', text: t('💧 Area 1: High Moisture Detected (>40%)'), type: 'success', icon: CheckCircle2 });
        }

        // Area 2 AI Alerts
        if (moisture_b < 30) {
            newAlerts.push({ id: 'ai-req-2', text: t('⚠ Area 2: Irrigation required today'), type: 'warning', icon: Droplets });
        }
        if (moisture_b >= 40) {
            newAlerts.push({ id: 'high-moist-2', text: t('💧 Area 2: High Moisture Detected (>40%)'), type: 'success', icon: CheckCircle2 });
        }

        // Emergency Hardware Lock
        const isWaterCritical = water_level < 20;
        if (isWaterCritical) {
            newAlerts.push({ id: 'water-locked', text: t('CRITICAL: Water level below 20%. All pumps locked.'), type: 'error', icon: AlertCircle });
        }

        // Auto Mode Logic Implementation
        if (systemAuto) {
            // Explicit Request: "when water moist level goes over the 30 it should stop watering and below it shoul dgive"
            let shouldOpenA = (moisture < 30);
            let shouldOpenB = (moisture_b < 30);

            if (moisture >= 30) shouldOpenA = false;
            if (moisture_b >= 30) shouldOpenB = false;

            // Emergency Hard Stop
            if (isWaterCritical) {
                shouldOpenA = false;
                shouldOpenB = false;
                toast.error(t('EMERGENCY STOP: Tank Level < 20%. Pumps shutdown.'), { id: 'emergency-tank', duration: 3000 });
            }

            setValves(prev => {
                const statusA = shouldOpenA ? 'open' : 'closed';
                const statusB = shouldOpenB ? 'open' : 'closed';
                if (prev[0].status === statusA && prev[1].status === statusB) return prev;
                return prev.map(v => ({
                    ...v,
                    status: (v.id === 1 ? statusA : statusB)
                }));
            });
        }

        setAlerts(prev => JSON.stringify(prev) === JSON.stringify(newAlerts) ? prev : newAlerts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentData, systemAuto, weather, historicalData.length]);

    // Simulation Loop Restored
    useEffect(() => {
        if (isSimulating && historicalData.length > 0) {
            simulationInterval.current = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % historicalData.length);
            }, 3000);
        } else {
            clearInterval(simulationInterval.current);
        }
        return () => clearInterval(simulationInterval.current);
    }, [isSimulating, historicalData.length]);

    const toggleValve = (id) => {
        if (systemAuto) {
            toast.error(t('Switch to Manual Mode to control valves.'));
            return;
        }
        setValves(valves.map(v => v.id === id ? { ...v, status: v.status === 'open' ? 'closed' : 'open' } : v));
    };

    const chartData = useMemo(() => {
        if (historicalData.length === 0) return [];
        const start = Math.max(0, currentIndex - 19);
        return historicalData.slice(start, currentIndex + 1).map((d) => ({
            ...d,
            time: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
    }, [historicalData, currentIndex]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto p-4">
            {/* The Back button link has been purposefully removed per requirements. */}

            {/* Restored Simulation Toolbar */}
            <div className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-center justify-between gap-4 ${isSimulating ? 'bg-blue-600 border-blue-400 shadow-lg text-white' : 'bg-white border-nature-200'}`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSimulating ? 'bg-white/20' : 'bg-nature-100'}`}>
                        <Play className={`w-5 h-5 ${isSimulating ? 'text-white' : 'text-nature-600'}`} />
                    </div>
                    <div>
                        <h4 className={`text-sm font-bold ${isSimulating ? 'text-white' : 'text-nature-900'}`}>{t('Historical Simulation')}</h4>
                        <p className={`text-xs ${isSimulating ? 'text-blue-100' : 'text-nature-50'}`}>
                            {isSimulating ? `${t('Replaying sensor data index')}: ${currentIndex}` : t('Data replay is paused. Toggle to test your auto-logic.')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {historicalData.length > 0 ? (
                        <button
                            onClick={() => setIsSimulating(!isSimulating)}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isSimulating ? 'bg-white text-blue-600 hover:bg-blue-50 shadow-md' : 'bg-nature-900 text-white hover:bg-black'}`}
                        >
                            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            {isSimulating ? t('Pause Replay') : t('Start Replay')}
                        </button>
                    ) : (
                        <button
                            className="flex-1 md:flex-none px-6 py-2 bg-gray-400 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Loading Data...
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-nature-900 tracking-tight">{t('Irrigation Control Center')}</h1>
                    <p className="text-nature-500 mt-1">{t('Synchronize manual overrides with automated threshold logic.')}</p>
                </div>
                <button
                    onClick={() => setSystemAuto(!systemAuto)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm border ${systemAuto ? 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600' : 'bg-white text-nature-700 border-nature-200 hover:bg-nature-50'}`}
                >
                    <Settings2 className="w-4 h-4" />
                    {systemAuto ? t('Auto Mode Active') : t('Manual Mode Active')}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-6">
                    {/* Weather Intelligence Card */}
                    <div className="bg-nature-50 p-6 rounded-3xl border border-nature-200 flex items-center justify-between shadow-inner">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-nature-900 text-white rounded-2xl">
                                <Sun className="w-5 h-5 animate-spin-slow" />
                            </div>
                            <div>
                                <h4 className="font-bold text-nature-900 text-sm">{weather.city} {t('Weather')}</h4>
                                <p className="text-xs text-nature-500 uppercase tracking-widest font-bold">{t('Real-time Intelligence')}</p>
                            </div>
                        </div>
                        <div className="flex gap-6 text-right">
                            <div>
                                <p className="text-[10px] text-nature-400 font-bold uppercase">{t('Temp')}</p>
                                <p className="font-black text-nature-900">{weather.temp}°C</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-nature-400 font-bold uppercase">{t('Humidity')}</p>
                                <p className="font-black text-nature-900">{weather.humidity}%</p>
                            </div>
                            {weather.rain > 0 && (
                                <div>
                                    <p className="text-[10px] text-red-500 font-bold uppercase">{t('Rain')}</p>
                                    <p className="font-black text-red-600">{weather.rain}mm</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pumping Unit 1 */}
                    <PumpCard
                        id={1}
                        title={t('Pumping Unit #1')}
                        subtitle={t('Serving Area 1')}
                        isActive={valves[0].status === 'open'}
                        moisture={currentData.moisture}
                        waterRequired={predictWaterLiters(currentData.moisture, weather.temp, weather.humidity, weather.rain, currentData.ph)}
                        t={t}
                    />
                    {/* Pumping Unit 2 */}
                    <PumpCard
                        id={2}
                        title={t('Pumping Unit #2')}
                        subtitle={t('Serving Area 2')}
                        isActive={valves[1].status === 'open'}
                        moisture={currentData.moisture_b}
                        waterRequired={predictWaterLiters(currentData.moisture_b, weather.temp, weather.humidity, weather.rain, currentData.ph)}
                        t={t}
                    />
                </div>

                {/* Field Control Section */}
                <div className="bg-white p-8 rounded-3xl border border-nature-200 shadow-sm flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-nature-900">{t('Field Logic Control')}</h3>
                            <p className="text-sm text-nature-500">{systemAuto ? t('Independent Dual-Channel AI') : t('Manual Zone Overrides')}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 w-full sm:w-48">
                            <div className="flex justify-between w-full text-[10px] font-bold text-nature-400 uppercase tracking-widest">
                                <span>{t('Main Tank')}</span>
                                <span className={currentData.water_level < 20 ? 'text-red-500' : 'text-blue-500'}>{currentData.water_level.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-2 bg-nature-100 rounded-full overflow-hidden border border-nature-200/50">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${currentData.water_level}%` }}
                                    className={`h-full rounded-full ${currentData.water_level < 20 ? 'bg-red-500' : 'bg-blue-500'}`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 mb-8">
                        {valves.map(valve => (
                            <div
                                key={valve.id}
                                onClick={() => toggleValve(valve.id)}
                                className={`p-6 rounded-2xl border transition-all cursor-pointer group ${valve.status === 'open' ? 'border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-500/10' : 'border-nature-100 bg-white hover:border-nature-300'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-4 items-center">
                                        <div className={`p-4 rounded-xl transition-all ${valve.status === 'open' ? 'bg-blue-500 text-white shadow-lg' : 'bg-nature-50 text-nature-400 group-hover:bg-nature-100'}`}>
                                            <Droplets className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-nature-900 text-base">{valve.name}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <p className="text-xs text-nature-500">{t('Soil Moisture')}: <span className={`font-bold ${(valve.id === 1 ? currentData.moisture : currentData.moisture_b) < 30 ? 'text-red-500' : 'text-nature-700'}`}>{(valve.id === 1 ? currentData.moisture : currentData.moisture_b).toFixed(1)}%</span></p>
                                                <span className={`w-1.5 h-1.5 rounded-full ${valve.status === 'open' ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                                                <p className="text-[10px] text-nature-400 uppercase font-bold tracking-widest">{valve.status === 'open' ? t('Irrigating') : t('Idle')}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-7 rounded-full relative transition-colors ${valve.status === 'open' ? 'bg-blue-600' : 'bg-nature-200'} ${systemAuto ? 'opacity-40' : ''}`}>
                                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${valve.status === 'open' ? 'left-6' : 'left-1'}`} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* System Alerts */}
                    <div className="mt-2 border-t border-nature-100 pt-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-50 rounded-lg text-red-600">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-bold text-nature-900 uppercase tracking-widest">{t('Intelligence Alerts')}</h3>
                        </div>

                        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            <AnimatePresence mode='popLayout'>
                                {alerts.length > 0 ? (
                                    alerts.map(alert => (
                                        <motion.div
                                            key={alert.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${alert.type === 'error' ? 'bg-red-50 border-red-100/50 text-red-800' :
                                                    alert.type === 'warning' ? 'bg-orange-50 border-orange-100/50 text-orange-800' :
                                                        'bg-green-50 border-green-100/50 text-green-800'
                                                }`}
                                        >
                                            <alert.icon className="w-4 h-4 shrink-0 mt-0.5" />
                                            <p className="text-xs font-bold leading-relaxed">{alert.text}</p>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="flex items-center gap-3 p-4 bg-nature-50 rounded-xl border border-dashed border-nature-200">
                                        <CheckCircle2 className="w-5 h-5 text-nature-300" />
                                        <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">{t('No active AI recommendations')}</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trends Section */}
            <div className="bg-white p-8 rounded-3xl border border-nature-200 shadow-sm overflow-hidden mt-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-earth-50 rounded-lg text-earth-600">
                            <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-nature-900">{t('Telemetry Trends')}</h3>
                    </div>
                    {isSimulating && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 uppercase animate-pulse">
                            {t('Live Replay Active')}
                        </div>
                    )}
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }} />
                            <Legend iconType="circle" />
                            <Line type="monotone" dataKey="moisture" name={t('Area 1 Moisture')} stroke="#3B82F6" strokeWidth={3} dot={false} />
                            <Line type="monotone" dataKey="moisture_b" name={t('Area 2 Moisture')} stroke="#10B981" strokeWidth={3} dot={false} />
                            <Line type="monotone" dataKey="ph" name={t('Soil pH')} stroke="#F59E0B" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

const PumpCard = ({ id, title, subtitle, isActive, moisture, waterRequired, t }) => (
    <div className="bg-nature-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden group border border-nature-800">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-500/20 transition-all" />

        <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl transition-all ${isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50' : 'bg-nature-800 text-nature-400'}`}>
                    <Power className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-xl">{title}</h3>
                    <p className="text-nature-400 text-[10px] uppercase tracking-widest">{subtitle}</p>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-bold tracking-tighter border ${isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-nature-800 text-nature-500 border-nature-700'}`}>
                    {isActive ? t('PUMP ON') : t('STANDBY')}
                </div>
                {isActive ? (
                    <p className="text-[10px] text-emerald-400 mt-2 font-bold uppercase tracking-widest animate-pulse">
                        🚿 {t('Irrigation Started')}
                    </p>
                ) : (
                    <p className="text-[10px] text-nature-500 mt-2 font-bold uppercase tracking-widest">
                        🌱 {t('Pump Off / Moisture Adequate')}
                    </p>
                )}
            </div>
        </div>

        <div className="space-y-6 relative z-10">
            <Indicator label={t('Flow Velocity')} value={isActive ? "45 L/min" : "0 L/min"} progress={isActive ? 65 : 0} />
            <Indicator label={t('Supply Demand')} value={isActive ? `${waterRequired} L` : "0 L"} progress={isActive ? 100 : 0} color="bg-nature-400" />

            <div className="pt-6 mt-6 border-t border-nature-800 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-nature-400 bg-nature-800/50 p-3 rounded-xl border border-nature-800/50">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    <div>
                        <p className="text-[9px] uppercase font-bold tracking-widest text-nature-600">{t('Soil')}</p>
                        <p className="text-xs font-bold text-white">{moisture ? moisture.toFixed(1) : 0}%</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-nature-400 bg-nature-800/50 p-3 rounded-xl border border-nature-800/50">
                    <BrainCircuit className="w-5 h-5 text-emerald-500" />
                    <div>
                        <p className="text-[9px] uppercase font-bold tracking-widest text-nature-600">{t('Need')}</p>
                        <p className="text-xs font-bold text-white">{waterRequired}L</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const Indicator = ({ label, value, progress }) => (
    <div>
        <div className="flex justify-between text-xs mb-2">
            <span className="text-nature-400 font-medium">{label}</span>
            <span className="font-bold text-white tracking-widest uppercase">{value}</span>
        </div>
        <div className="w-full bg-nature-800 rounded-full h-1.5 overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="bg-blue-500 h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                transition={{ duration: 1 }}
            />
        </div>
    </div>
);
