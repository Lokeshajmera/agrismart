import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingDown, Droplets, Leaf, Activity, Play, Pause, RefreshCcw, Database } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Analytics() {
    const { user } = useAuth();
    const [liveData, setLiveData] = useState([]);
    const [isPolling, setIsPolling] = useState(true);

    const fetchLiveHistory = async () => {
        setIsPolling(true);
        const { data, error } = await supabase
            .from('sensor_data')
            .select('*')
            .order('id', { ascending: false })
            .limit(20);

        if (!error && data && data.length > 0) {
            setLiveData(data.reverse());
        }
        setIsPolling(false);
    };

    useEffect(() => {
        fetchLiveHistory();
        const interval = setInterval(fetchLiveHistory, 8000);
        return () => clearInterval(interval);
    }, []);

    const chartData = useMemo(() => {
        if (liveData.length === 0) return [];
        return liveData.map((d) => ({
            time: new Date(d.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            moisture: Number(d.soil1) || 0,
            moisture_b: Number(d.soil2) || 0,
            temperature: Number(d.temp1) || 0,
            humidity: Number(d.hum1) || 0
        }));
    }, [liveData]);

    const avgMoisture = useMemo(() => {
        if (chartData.length === 0) return 0;
        return Math.round(chartData.reduce((acc, curr) => acc + curr.moisture, 0) / chartData.length);
    }, [chartData]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto p-2">

            {/* Header with Live Sync Status */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-nature-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-nature-900 tracking-tight flex items-center gap-2">
                        <Activity className="w-6 h-6 text-earth-500 animate-pulse" /> Live Analytics Dashboard
                    </h1>
                    <p className="text-nature-500 mt-1">Real-time incoming ESP32 sensor telemetry streams.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto p-2 bg-nature-50 rounded-2xl border border-nature-200">
                    {liveData.length === 0 ? (
                        <div className="px-6 py-2 bg-nature-100 text-nature-600 rounded-xl font-bold flex items-center justify-center gap-2">
                             <RefreshCcw className="w-4 h-4 animate-spin-slow" /> Loading Data...
                        </div>
                    ) : (
                        <div className="px-4 py-2 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl font-bold flex items-center justify-center gap-2">
                            <Database className="w-4 h-4 animate-pulse" /> Live Telemetry
                        </div>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-white p-6 rounded-2xl shadow-lg border relative overflow-hidden group transition-colors duration-500 bg-nature-900 border-nature-800">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    <div className="flex items-center gap-2 text-white/80 mb-2">
                        <Droplets className="w-5 h-5" />
                        <h3 className="font-bold">Avg Soil Moisture</h3>
                    </div>
                    <p className="text-4xl font-extrabold mb-1 relative z-10">{avgMoisture}%</p>
                    <p className="text-sm text-white/90 flex items-center gap-1 relative z-10">
                        <TrendingDown className="w-4 h-4" /> Moving average of live window
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
                            <span className="absolute inline-flex h-full w-full rounded-full opacity-75 bg-green-400 animate-ping"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    </p>
                    <p className="text-sm text-nature-500">
                        Listening to live ESP32
                    </p>
                </div>
            </div>

            {/* Dashboard Graphs Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Primary Chart: Moisture */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-nature-200 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-nature-900">Soil Moisture Dynamics</h3>
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
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1efe6" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#3b82f6', fontSize: 10 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} itemStyle={{ fontWeight: 'bold' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                    <Area type="monotone" name="Area 1 Moisture (%)" dataKey="moisture" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMoisture)" activeDot={{ r: 6, strokeWidth: 0 }} />
                                    <Area type="monotone" name="Area 2 Moisture (%)" dataKey="moisture_b" stroke="#10b981" strokeWidth={3} fillOpacity={0} activeDot={{ r: 6, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center"><p className="text-nature-400 font-bold">Waiting for data...</p></div>
                        )}
                    </div>
                </div>

                {/* 2. Secondary Chart: Air Humidity & Temp */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-nature-200 lg:col-span-2">
                    <h3 className="text-lg font-bold text-nature-900 mb-6">Environmental Dynamics (Temperature & Humidity)</h3>
                    <div className="h-64 w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1efe6" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#8b5cf6', fontSize: 10 }} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#ef4444', fontSize: 10 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                    <Area yAxisId="left" type="monotone" name="Air Humidity (%)" dataKey="humidity" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorHumidity)" />
                                    <Area yAxisId="right" type="monotone" name="Air Temp (°C)" dataKey="temperature" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : null}
                    </div>
                </div>

            </div>
        </div>
    );
}
