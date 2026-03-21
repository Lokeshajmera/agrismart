import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ThermometerSun, Droplets, Wind, Play, Square, Loader2 } from 'lucide-react';
import { useRealtimeSensor } from '../hooks/useRealtimeSensor';
import { useSensorSimulation } from '../hooks/useSensorSimulation';
import { useOfflineStore } from '../store/useOfflineStore';

export default function SensorMonitoring() {
    const { sensorData, loading, lastPing } = useRealtimeSensor();
    const { isSimulating, toggleSimulation } = useSensorSimulation();
    const { isOnline } = useOfflineStore();

    const latest = useMemo(() => {
        if (!sensorData || sensorData.length === 0) return null;
        return sensorData[sensorData.length - 1];
    }, [sensorData]);

    const chartData = useMemo(() => {
        if (!sensorData) return [];
        return sensorData.map(d => {
            const date = new Date(d.created_at);
            return {
                time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                moist: d.moisture,
                temp: d.temperature,
                ph: d.ph,
                waterLevel: d.water_level
            };
        });
    }, [sensorData]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-nature-900 dark:text-white tracking-tight">Sensor Network</h1>
                    <p className="text-nature-500 mt-1">Live telemetry from deployed IoT devices.</p>
                </div>
                
                <button 
                    onClick={toggleSimulation}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 ${
                        isSimulating 
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                        : 'bg-earth-500 hover:bg-earth-600 text-white'
                    }`}
                >
                    {isSimulating ? (
                        <><Square className="w-4 h-4" /> Stop Simulation</>
                    ) : (
                        <><Play className="w-4 h-4" /> Start Simulator</>
                    )}
                </button>
            </div>

            {loading && sensorData.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-nature-950 rounded-2xl border border-nature-200 dark:border-nature-800">
                    <Loader2 className="w-8 h-8 text-earth-500 animate-spin mb-4" />
                    <p className="text-nature-600">Syncing with hardware network...</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Soil Moisture', stat: latest ? `${latest.moisture}%` : '---', desc: 'Realtime Probe A', icon: Droplets, clr: 'text-blue-500' },
                            { label: 'Water Level', stat: latest ? `${latest.water_level}%` : '---', desc: 'Main Tank', icon: Droplets, clr: 'text-orange-500' },
                            { label: 'Ambient Temp', stat: latest ? `${latest.temperature}°C` : '---', desc: 'Sector 1', icon: ThermometerSun, clr: 'text-red-500' },
                            { label: 'Soil pH Level', stat: latest ? latest.ph : '---', desc: 'Sector 1', icon: Wind, clr: 'text-green-500' },
                        ].map((sensor, i) => (
                            <div key={i} className="bg-white dark:bg-nature-950 p-5 rounded-xl border border-nature-200 dark:border-nature-800 shadow-sm flex flex-col justify-between">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-2 rounded-lg bg-nature-50 dark:bg-nature-900 ${sensor.clr}`}>
                                        <sensor.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {latest && isOnline ? (
                                            <>
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                <span className="text-xs font-semibold text-green-700">Live</span>
                                            </>
                                        ) : latest && !isOnline ? (
                                            <>
                                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                                <span className="text-xs font-semibold text-yellow-700">Cached</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                                <span className="text-xs font-semibold text-gray-500">Offline</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-nature-900 dark:text-white">{sensor.stat}</p>
                                    <h4 className="text-sm font-bold text-nature-600 mt-1">{sensor.label}</h4>
                                    <p className="text-xs text-nature-400 mt-1">{sensor.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-nature-950 p-6 rounded-2xl border border-nature-200 dark:border-nature-800 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-nature-900 dark:text-white">Live Telemetry (Last 20)</h3>
                                <span className="text-xs font-medium text-nature-500 bg-nature-50 dark:bg-nature-900 px-2 py-1 rounded">
                                    {lastPing ? `Last Ping: ${lastPing.toLocaleTimeString()}` : 'Waiting for ping...'}
                                </span>
                            </div>
                            <div className="h-80">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1efe6" />
                                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#6da793', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6da793', fontSize: 12 }} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                                            <Area type="monotone" dataKey="moist" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Moisture %" />
                                            <Area type="monotone" dataKey="temp" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Temp °C" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-nature-400 text-sm">
                                        No recent telemetry collected. Turn on the simulator!
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-nature-950 p-6 rounded-2xl border border-nature-200 dark:border-nature-800 shadow-sm overflow-hidden flex flex-col">
                            <h3 className="text-lg font-bold text-nature-900 dark:text-white mb-4">Device Roster</h3>
                            <div className="flex-1 overflow-y-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-nature-500 uppercase bg-nature-50 dark:bg-nature-900">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg">Device ID</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { id: 'ESP32-NODE-A', type: 'Moisture/Temp', status: latest ? 'Active' : 'Offline' },
                                            { id: 'ESP32-NODE-B', type: 'Water/pH', status: latest ? 'Active' : 'Offline' }
                                        ].map((row, i) => (
                                            <tr key={i} className="border-b border-nature-100 dark:border-nature-700/50 last:border-0 hover:bg-nature-50 dark:bg-nature-900/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-nature-900 dark:text-white">{row.id}</td>
                                                <td className="px-4 py-3 text-nature-600">{row.type}</td>
                                                <td className={`px-4 py-3 font-medium ${row.status === 'Active' ? 'text-green-500' : 'text-gray-400'}`}>
                                                    {row.status}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
