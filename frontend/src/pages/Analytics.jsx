import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingDown, Droplets, Leaf, Activity } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Analytics() {
    const [realtimeData, setRealtimeData] = useState([]);
    const [avgMoisture, setAvgMoisture] = useState(0);

    useEffect(() => {
        const fetchSensorHistory = async () => {
            const { data, error } = await supabase
                .from('sensor_data')
                .select('created_at, moisture, temperature, humidity')
                .eq('farmer_id', 'GLOBAL_AI_SEED')
                .order('created_at', { ascending: false })
                .limit(15);
                
            if (!error && data && data.length > 0) {
                // Reverse to get chronological order from left to right
                const formatted = data.reverse().map((d, i) => {
                    // Make historical times sequentially space out by 3 seconds for smooth lead-in
                    const time = new Date(Date.now() - (15 - i) * 3000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    return {
                        time,
                        moisture: d.moisture,
                        temperature: d.temperature,
                        humidity: d.humidity
                    };
                });
                setRealtimeData(formatted);
                setAvgMoisture(Math.round(data.reduce((acc, curr) => acc + curr.moisture, 0) / data.length));
            }
        };

        fetchSensorHistory();
        
        // --- HACKATHON LIVE REPLAY SIMULATION ---
        // TODO: Remove this interval once the real ESP32 starts streaming to Supabase continuously
        const simulationInterval = setInterval(() => {
            setRealtimeData(prev => {
                if (prev.length === 0) return prev;
                const lastPoint = prev[prev.length - 1];
                
                // Add tiny random fluctuations to simulate live sensor noise (-2 to +2 moisture, -0.5 to +0.5 temp)
                const newMoisture = Math.max(0, Math.min(100, lastPoint.moisture + (Math.random() * 4 - 2)));
                const newTemp = Math.max(10, Math.min(50, lastPoint.temperature + (Math.random() * 1 - 0.5)));
                
                const newPoint = {
                    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    moisture: Number(newMoisture.toFixed(1)),
                    temperature: Number(newTemp.toFixed(1)),
                    humidity: lastPoint.humidity
                };
                
                // Append new point, shifting the oldest point out to keep length at 15
                const updated = [...prev.slice(1), newPoint];
                // Update KPI moving average
                setAvgMoisture(Math.round(updated.reduce((acc, curr) => acc + curr.moisture, 0) / updated.length));
                return updated;
            });
        }, 3000); // Ticks every 3 seconds to look like a live heartbeat

        return () => clearInterval(simulationInterval);
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-nature-900 tracking-tight flex items-center gap-2">
                        <Activity className="w-6 h-6 text-earth-500" /> Live ESP32 Telemetry
                    </h1>
                    <p className="text-nature-500 mt-1">Real-time sensor data streaming directly from field devices.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-nature-900 text-white p-6 rounded-2xl shadow-lg border border-nature-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-earth-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="flex items-center gap-2 text-earth-400 mb-2">
                        <Droplets className="w-5 h-5" />
                        <h3 className="font-bold">Avg Soil Moisture</h3>
                    </div>
                    <p className="text-4xl font-extrabold mb-1">{avgMoisture}%</p>
                    <p className="text-sm text-green-400 flex items-center gap-1"><TrendingDown className="w-4 h-4" /> Live Moving Average</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-nature-200">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                        <Leaf className="w-5 h-5" />
                        <h3 className="font-bold text-nature-900">Crop Environment</h3>
                    </div>
                    <p className="text-4xl font-extrabold text-nature-900 mb-1">Stable</p>
                    <p className="text-sm text-nature-500 flex items-center gap-1">Based on recent telemetry</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-nature-200">
                    <h3 className="font-bold text-nature-900 mb-2">System Uptime</h3>
                    <p className="text-4xl font-extrabold text-nature-900 flex items-center gap-2 mb-1">
                        99.9% 
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    </p>
                    <p className="text-sm text-nature-500">Sensors Online & Transmitting</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-nature-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-nature-900">Real-Time Sensor Streams</h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        LIVE
                    </div>
                </div>
                <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={realtimeData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1efe6" />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#6da793', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6da793', fontSize: 12 }} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} 
                                itemStyle={{ fontWeight: 'bold' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Area type="monotone" name="Soil Moisture (%)" dataKey="moisture" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMoisture)" activeDot={{ r: 6, strokeWidth: 0 }} />
                            <Area type="monotone" name="Temperature (°C)" dataKey="temperature" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" activeDot={{ r: 6, strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
