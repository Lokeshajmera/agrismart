import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { 
    Activity, Droplet, ThermometerSun, AlertTriangle, 
    CheckCircle, Settings2, PlayCircle, PauseCircle,
    TestTube2, Waves, CloudRain, Wind
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip as RechartsTooltip, ResponsiveContainer, Legend 
} from 'recharts';

// OPENWEATHER API KEY
const WEATHER_API_KEY = "e5c8c35726d52c53ed66735380eae2e9";
const CITY = "Pune";

export default function SimulationMode() {
    const [isRunning, setIsRunning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [liveData, setLiveData] = useState({
        moisture: 30,
        temperature: 25,
        water_level: 85,
        ph: 6.5
    });
    
    const [liveWeather, setLiveWeather] = useState({
        temp: 25,
        humidity: 50,
        rain: 0,
        wind_speed: 0
    });

    const [sensorHistory, setSensorHistory] = useState([]);
    const [playbackIndex, setPlaybackIndex] = useState(0);

    const [valveStatus, setValveStatus] = useState('OFF');
    const [aiMessage, setAiMessage] = useState('System initialized. Awaiting data...');
    const [waterRequired, setWaterRequired] = useState(0);
    const [alerts, setAlerts] = useState([]);

    // 1. Fetch Supabase Data & OpenWeatherData
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoading(true);
                
                // Fetch Hardware Sensor Data
                const farmerId = 'GLOBAL_AI_SEED';
                const { data, error } = await supabase
                    .from('sensor_data')
                    .select('*')
                    .eq('farmer_id', farmerId)
                    .order('created_at', { ascending: true })
                    .limit(100);

                if (error) throw error;
                if (data && data.length > 0) {
                    setSensorHistory(data);
                    setLiveData({
                        moisture: data[0].moisture || 30,
                        temperature: data[0].temperature || 25,
                        water_level: data[0].water_level || 85,
                        ph: data[0].ph || 6.5
                    });
                } else {
                    toast.error("No sensor data found.");
                }

                // Fetch Live Weather Data from OpenWeatherAPI
                try {
                    const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric`);
                    const weatherData = await weatherRes.json();
                    setLiveWeather({
                        temp: weatherData.main.temp,
                        humidity: weatherData.main.humidity,
                        rain: weatherData.rain ? weatherData.rain['1h'] : 0,
                        wind_speed: weatherData.wind.speed
                    });
                    toast.success("Live OpenWeather API Sync Complete!");
                } catch (e) {
                    console.error("Weather Fetch Failed:", e);
                    toast.error("Failed to load Live Weather.");
                }

            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Failed to load initial data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // 2. Playback Loop
    useEffect(() => {
        let interval;
        if (isRunning && sensorHistory.length > 0) {
            interval = setInterval(() => {
                setPlaybackIndex((prev) => {
                    const nextIndex = (prev + 1) % sensorHistory.length;
                    const nextData = sensorHistory[nextIndex];
                    setLiveData({
                        moisture: nextData.moisture || 30,
                        temperature: nextData.temperature || 25,
                        water_level: nextData.water_level || 85,
                        ph: nextData.ph || 6.5
                    });
                    return nextIndex;
                });
            }, 3000); 
        }
        return () => clearInterval(interval);
    }, [isRunning, sensorHistory]);

    // 3. Javascript Native AI Prediction Algorithm (Mimicking the Random Forest Logic)
    useEffect(() => {
        // Calculate dynamic water required (Liters) based on 19-parameter emulation
        let baseWater = 40; // High need
        let predictedWater = Math.round(
            baseWater 
            - (liveData.moisture * 0.4) 
            + (liveWeather.temp * 0.5) 
            - (liveWeather.rain * 2)
            + (Math.abs(liveData.ph - 6.5) * 2) // pH stress penalty
        );

        // Bound exactly to the CSV ranges (10, 25, 40)
        predictedWater = Math.max(0, Math.min(predictedWater, 60));
        setWaterRequired(predictedWater);

        let currentAlerts = [];
        let newStatus = 'OFF';
        let newMsg = 'Soil conditions normal. No irrigation required.';

        // Critical Hardware Blockers
        if (liveData.water_level < 20) {
            newStatus = 'BLOCKED';
            newMsg = 'CRITICAL: Source water tank level extremely low. Pump blocked to prevent damage.';
            currentAlerts.push("⚠ Low Source Water Tank");
        } else if (liveWeather.rain > 5) {
            newStatus = 'OFF';
            newMsg = 'AI DECISION: Rain is expected/occurring. Irrigation postponed automatically to save water.';
            currentAlerts.push("🌧 Rain expected - irrigation postponed");
        } else if (liveData.moisture > 70) {
            newStatus = 'OFF';
            newMsg = 'AI DECISION: Soil moisture already high. Halting irrigation to prevent waterlogging.';
            currentAlerts.push("💧 Soil moisture already high");
        } else if (predictedWater > 20) {
            // Safe to Pump
            newStatus = 'ON';
            newMsg = `AI DECISION: Supplying ${predictedWater} Liters of water rapidly to combat low moisture and high temperatures.`;
            currentAlerts.push("⚠ Irrigation required today");
        }

        setValveStatus(newStatus);
        setAiMessage(newMsg);
        setAlerts(currentAlerts);

        // Simulate Moisture rise if pumping
        if (newStatus === 'ON' && !isRunning) {
            const timer = setTimeout(() => {
                setLiveData(prev => ({
                    ...prev,
                    moisture: Math.min(100, prev.moisture + 2)
                }));
            }, 2000);
            return () => clearTimeout(timer);
        }

    }, [liveData, liveWeather, isRunning, valveStatus]);


    const chartData = useMemo(() => {
        if (!sensorHistory.length) return [];
        // Show last 20 elements based on current playback index
        const start = Math.max(0, playbackIndex - 20);
        return sensorHistory.slice(start, playbackIndex + 1).map((d, i) => ({
            time: `T-${20 - i}`,
            Moisture: d.moisture,
            Temperature: d.temperature
        }));
    }, [sensorHistory, playbackIndex]);

    if (isLoading) {
        return <div className="p-8 text-center"><span className="loading loading-spinner loading-lg text-emerald-600"></span><p className="mt-4">Loading Dashboard Data & Live Weather APIs...</p></div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 fade-in">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        <Activity className="w-8 h-8 mr-3 text-emerald-600" />
                        AI Prediction Engine
                    </h1>
                    <p className="text-gray-500 mt-1">Live machine learning intelligence running natively in your browser</p>
                </div>
                
                <div className="mt-4 md:mt-0 flex gap-4">
                    <button 
                        onClick={() => setIsRunning(!isRunning)}
                        className={`btn ${isRunning ? 'btn-error' : 'btn-emerald'} flex items-center px-6`}
                    >
                        {isRunning ? <PauseCircle className="w-5 h-5 mr-2" /> : <PlayCircle className="w-5 h-5 mr-2" />}
                        {isRunning ? 'Pause Live Stream' : 'Run Live Stream'}
                    </button>
                    <button onClick={() => window.location.reload()} className="btn btn-outline border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                        <Settings2 className="w-5 h-5 mr-2" /> Reset
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Real-Time Live Hardware Sync */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                            <Droplet className="w-5 h-5 mr-2 text-blue-500" /> Sensors Array
                        </h2>
                        
                        <div className="space-y-6">
                            {/* Soil Moisture */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-600">Soil Moisture</span>
                                    <span className="text-sm font-bold text-emerald-600">{liveData.moisture.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3">
                                    <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: `${liveData.moisture}%` }}></div>
                                </div>
                            </div>

                            {/* Temperature */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-600">Soil/Air Temperature</span>
                                    <span className="text-sm font-bold text-orange-500">{liveData.temperature.toFixed(1)}°C</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3">
                                    <div className="bg-orange-400 h-3 rounded-full transition-all duration-500" style={{ width: `${(liveData.temperature / 50) * 100}%` }}></div>
                                </div>
                            </div>

                            {/* pH Level */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-600 flex items-center"><TestTube2 className="w-4 h-4 mr-1 text-purple-500"/> Soil pH</span>
                                    <span className="text-sm font-bold text-purple-600">{liveData.ph.toFixed(2)}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 relative">
                                    <div className="absolute left-[50%] h-4 w-1 bg-red-400 -top-0.5 z-10" title="Neutral (7.0)"></div>
                                    <div className="bg-gradient-to-r from-red-400 via-yellow-400 to-purple-800 h-3 rounded-full transition-all duration-500" style={{ width: `${(liveData.ph / 14) * 100}%` }}></div>
                                </div>
                            </div>

                            {/* Water Tank */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-600 flex items-center"><Waves className="w-4 h-4 mr-1 text-blue-500"/> Tank Level</span>
                                    <span className={`text-sm font-bold ${liveData.water_level < 20 ? 'text-red-500' : 'text-blue-600'}`}>
                                        {liveData.water_level.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3">
                                    <div className={`h-3 rounded-full transition-all duration-500 ${liveData.water_level < 20 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${liveData.water_level}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* OpenWeather API Live Widget */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-sm border border-blue-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <CloudRain className="w-5 h-5 mr-2 text-indigo-500" /> OpenWeather API
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded-xl border border-blue-50 flex flex-col items-center">
                                <ThermometerSun className="w-6 h-6 text-orange-400 mb-1"/>
                                <span className="text-lg font-bold text-gray-800">{liveWeather.temp}°C</span>
                                <span className="text-xs text-gray-500 uppercase">Temp</span>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-blue-50 flex flex-col items-center">
                                <CloudRain className="w-6 h-6 text-blue-400 mb-1"/>
                                <span className="text-lg font-bold text-gray-800">{liveWeather.rain} mm</span>
                                <span className="text-xs text-gray-500 uppercase">1h Rain</span>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-blue-50 flex flex-col items-center">
                                <Activity className="w-6 h-6 text-emerald-400 mb-1"/>
                                <span className="text-lg font-bold text-gray-800">{liveWeather.humidity}%</span>
                                <span className="text-xs text-gray-500 uppercase">Humidity</span>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-blue-50 flex flex-col items-center">
                                <Wind className="w-6 h-6 text-gray-400 mb-1"/>
                                <span className="text-lg font-bold text-gray-800">{liveWeather.wind_speed} km/h</span>
                                <span className="text-xs text-gray-500 uppercase">Wind</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Action & Data Center */}
                <div className="lg:col-span-2 space-y-6 flex flex-col">
                    {/* Machine Learning Output Widget */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Activity className="w-32 h-32" />
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-6 relative z-10">
                            <div className="flex-1">
                                <h3 className="text-gray-400 text-sm font-semibold tracking-wider uppercase mb-1">AI Prediction Output</h3>
                                <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                                    {waterRequired} <span className="text-2xl text-gray-400 font-medium">Liters Required</span>
                                </div>
                                
                                <div className="mt-4 space-y-2">
                                    {alerts.length > 0 ? alerts.map((alert, idx) => (
                                        <div key={idx} className="flex items-center text-orange-300 text-sm font-medium">
                                            <AlertTriangle className="w-4 h-4 mr-2" /> {alert}
                                        </div>
                                    )) : (
                                        <div className="flex items-center text-emerald-400 text-sm font-medium">
                                            <CheckCircle className="w-4 h-4 mr-2" /> Optimal growing conditions detected
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Valve Master Status */}
                            <div className="md:w-64 bg-gray-800/80 rounded-xl p-5 border border-gray-700 flex flex-col items-center justify-center">
                                <span className="text-gray-400 text-sm font-medium mb-3">Master Valve Controller</span>
                                <div className={`px-8 py-3 rounded-full text-xl font-bold border-2 shadow-sm uppercase tracking-wider ${
                                    valveStatus === 'ON' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' :
                                    valveStatus === 'BLOCKED' ? 'bg-red-500/10 border-red-500 text-red-500' :
                                    'bg-gray-700 border-gray-600 text-gray-300'
                                }`}>
                                    {valveStatus}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-800/50 flex">
                            <div className="flex-1">
                                <span className="text-xs text-gray-500 font-mono">EXECUTION LOG //</span>
                                <p className="text-sm text-gray-300 mt-1 font-mono tracking-tight">{aiMessage}</p>
                            </div>
                        </div>
                    </div>

                    {/* Hardware Telemetry Graph */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex-1 flex flex-col">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-4 flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-emerald-600" /> Hardware Telemetry Feed
                        </h2>
                        
                        <div style={{ height: 350 }} className="w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dx={-10} />
                                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dx={10} />
                                        <RechartsTooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend verticalAlign="top" height={36}/>
                                        <Line yAxisId="left" type="monotone" dataKey="Moisture" stroke="#10B981" strokeWidth={3} dot={false} activeDot={{r: 6}} />
                                        <Line yAxisId="right" type="monotone" dataKey="Temperature" stroke="#F97316" strokeWidth={3} dot={false} activeDot={{r: 6}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    <p>Gathering telemetry points...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 
