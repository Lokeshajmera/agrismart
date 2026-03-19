import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { TrendingDown, Droplets, Leaf } from 'lucide-react';

const yearlyData = [
    { month: 'Jan', water: 400, yield: 0 },
    { month: 'Feb', water: 300, yield: 0 },
    { month: 'Mar', water: 600, yield: 20 },
    { month: 'Apr', water: 800, yield: 80 },
    { month: 'May', water: 900, yield: 100 },
    { month: 'Jun', water: 500, yield: 0 },
];

export default function Analytics() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-nature-900 tracking-tight">Farm Analytics</h1>
                    <p className="text-nature-500 mt-1">Long-term tracking of water savings and crop productivity.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-nature-900 text-white p-6 rounded-2xl shadow-lg border border-nature-800">
                    <div className="flex items-center gap-2 text-earth-400 mb-2">
                        <Droplets className="w-5 h-5" />
                        <h3 className="font-bold">Water Saved (YTD)</h3>
                    </div>
                    <p className="text-4xl font-extrabold mb-1">1.2M <span className="text-lg font-medium text-nature-400">Liters</span></p>
                    <p className="text-sm text-green-400 flex items-center gap-1"><TrendingDown className="w-4 h-4" /> 42% less than last year</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-nature-200">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                        <Leaf className="w-5 h-5" />
                        <h3 className="font-bold text-nature-900">Crop Productivity</h3>
                    </div>
                    <p className="text-4xl font-extrabold text-nature-900 mb-1">+24%</p>
                    <p className="text-sm text-nature-500 flex items-center gap-1">Estimated yield improvement</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-nature-200">
                    <h3 className="font-bold text-nature-900 mb-2">System Uptime</h3>
                    <p className="text-4xl font-extrabold text-nature-900 mb-1">99.9%</p>
                    <p className="text-sm text-nature-500">Sensors & Automation Network</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-nature-200">
                <h3 className="text-lg font-bold text-nature-900 mb-6">Water Usage vs Estimated Yield</h3>
                <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={yearlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1efe6" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6da793' }} dy={10} />
                            <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="#10b981" axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: '#f2f8f5' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar yAxisId="left" name="Avg Water Usage (kL)" dataKey="water" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="right" name="Yield Index" dataKey="yield" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
