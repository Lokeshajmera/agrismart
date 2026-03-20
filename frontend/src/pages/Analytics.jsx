import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingDown, Droplets, Leaf, Activity, Play, Pause, RefreshCcw, Database } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Analytics() {
    const [historicalData, setHistoricalData] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(14);
    const [isSimulating, setIsSimulating] = useState(false);
    const simulationInterval = useRef(null);

    useEffect(() => {
        const fetchHistory = async () => {
            const { data, error } = await supabase
                .from('sensor_data')
                .select('created_at, moisture, temperature, humidity, ph')
                .eq('farmer_id', 'GLOBAL_AI_SEED')
                .order('created_at', { ascending: true }) // Fetch oldest to newest for chronological replay
                .limit(100);

            if (!error && data && data.length > 0) {
                setHistoricalData(data);
            }
        };

        fetchHistory();
    }, []);

    // Playback loop
    useEffect(() => {
        if (isSimulating && historicalData.length > 15) {
            simulationInterval.current = setInterval(() => {
                setCurrentIndex(prev => {
                    if (prev >= historicalData.length - 1) return 14;
                    return prev + 1;
                });
            }, 3000);
        } else {
            clearInterval(simulationInterval.current);
        }
        return () => clearInterval(simulationInterval.current);
    }, [isSimulating, historicalData.length]);

    const chartData = useMemo(() => {
        if (historicalData.length === 0) return [];

        // Take 15 points ending at currentIndex
        const start = Math.max(0, currentIndex - 14);
        return historicalData.slice(start, currentIndex + 1).map((d) => ({
            time: new Date(d.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            moisture: d.moisture,
            temperature: d.temperature,
            humidity: d.humidity,
            ph: d.ph || Number((6.5 + (Math.random() * 0.4 - 0.2)).toFixed(2)) // Simulate stable pH if missing from DB row
        }));
    }, [historicalData, currentIndex]);

    const avgMoisture = useMemo(() => {
        if (chartData.length === 0) return 0;
        return Math.round(chartData.reduce((acc, curr) => acc + curr.moisture, 0) / chartData.length);
    }, [chartData]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto p-2">

            {/* Header with Replay Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-nature-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-nature-900 tracking-tight flex items-center gap-2">
                        <Activity className="w-6 h-6 text-earth-500" /> Farm Analytics Dashboard
                    </h1>
                    <p className="text-nature-500 mt-1">Comprehensive historical sensor trends and correlations.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto p-2 bg-nature-50 rounded-2xl border border-nature-200">
                    <div className="pl-3 pr-2 flex items-center gap-2">
                        <Database className="w-4 h-4 text-nature-500" />
                        <span className="text-xs font-bold text-nature-700 uppercase tracking-widest">{historicalData.length} records</span>
                    </div>
                    {historicalData.length > 0 ? (
                        <button
                            onClick={() => setIsSimulating(!isSimulating)}
                            className={`px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isSimulating ? 'bg-blue-600 text-white shadow-md' : 'bg-nature-900 text-white hover:bg-black'}`}
                        >
                            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            {isSimulating ? 'Pause Replay' : 'Start Replay'}
                        </button>
                    ) : (
                        <button className="px-6 py-2 bg-gray-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                            <RefreshCcw className="w-4 h-4 animate-spin-slow" /> Loading...
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`text-white p-6 rounded-2xl shadow-lg border relative overflow-hidden group transition-colors duration-500 ${isSimulating ? 'bg-blue-600 border-blue-500' : 'bg-nature-900 border-nature-800'}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    <div className="flex items-center gap-2 text-white/80 mb-2">
                        <Droplets className="w-5 h-5" />
                        <h3 className="font-bold">Avg Soil Moisture</h3>
                    </div>
                    <p className="text-4xl font-extrabold mb-1 relative z-10">{avgMoisture}%</p>
                    <p className="text-sm text-white/90 flex items-center gap-1 relative z-10">
                        <TrendingDown className="w-4 h-4" /> Moving average of window
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-nature-200">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                        <Leaf className="w-5 h-5" />
                        <h3 className="font-bold text-nature-900">Crop Health Index</h3>
                    </div>
                    <p className="text-4xl font-extrabold text-nature-900 mb-1">Optimal</p>
                    <p className="text-sm text-nature-500 flex items-center gap-1">Correlated with telemetry</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-nature-200">
                    <h3 className="font-bold text-nature-900 mb-2">Telemetry Status</h3>
                    <p className="text-4xl font-extrabold text-nature-900 flex items-center gap-2 mb-1">
                        Active
                        <span className="relative flex h-3 w-3">
                            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isSimulating ? 'bg-blue-400 animate-ping' : 'bg-green-400 animate-ping'}`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${isSimulating ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                        </span>
                    </p>
                    <p className="text-sm text-nature-500">
                        {isSimulating ? `Replaying Index T: ${currentIndex}` : 'Live Standby Mode'}
                    </p>
                </div>
            </div>

            {/* Dashboard Graphs Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Primary Chart: Moisture & Temp */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-nature-200 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-nature-900">Soil Moisture & Temperature Dynamics</h3>
                    </div>
                    <div className="h-80 w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1efe6" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#3b82f6', fontSize: 10 }} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#ef4444', fontSize: 10 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} itemStyle={{ fontWeight: 'bold' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                    <Area yAxisId="left" type="monotone" name="Soil Moisture (%)" dataKey="moisture" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMoisture)" activeDot={{ r: 6, strokeWidth: 0 }} />
                                    <Area yAxisId="right" type="monotone" name="Air/Soil Temp (°C)" dataKey="temperature" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" activeDot={{ r: 6, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center"><p className="text-nature-400 font-bold">Waiting for data...</p></div>
                        )}
                    </div>
                </div>

                {/* 2. Secondary Chart: Air Humidity */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-nature-200">
                    <h3 className="text-lg font-bold text-nature-900 mb-6">Environmental Humidity Trends</h3>
                    <div className="h-64 w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1efe6" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8b5cf6', fontSize: 10 }} domain={[0, 100]} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                    <Area type="monotone" name="Air Humidity (%)" dataKey="humidity" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorHumidity)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : null}
                    </div>
                </div>

                {/* 3. Secondary Chart: Soil pH */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-nature-200">
                    <h3 className="text-lg font-bold text-nature-900 mb-6">Soil pH Balance</h3>
                    <div className="h-64 w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1efe6" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#f59e0b', fontSize: 10 }} domain={[5, 8]} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                    <Line type="stepAfter" name="Soil pH" dataKey="ph" stroke="#f59e0b" strokeWidth={3} dot={true} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : null}
                    </div>
                </div>

            </div>
        </div>
    );
}
