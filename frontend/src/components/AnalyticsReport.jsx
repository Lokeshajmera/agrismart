import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Download, FileText, Calendar, Filter, Loader2, TrendingUp, TrendingDown, FileSpreadsheet, Activity, Leaf } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function AnalyticsReport() {
    const { user } = useAuth();
    const [farmerId, setFarmerId] = useState(null);
    const [timeRange, setTimeRange] = useState('1d');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportData, setReportData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const reportRef = useRef(null);

    // Fetch Farmer ID
    useEffect(() => {
        const fetchFarmerId = async () => {
            if (!user) return;
            try {
                const { data } = await supabase.from('users').select('farmer_id').eq('id', user.id).single();
                if (data?.farmer_id) setFarmerId(data.farmer_id);
            } catch (err) {
                console.error("Error fetching farmer_id:", err);
            }
        };
        fetchFarmerId();
    }, [user]);

    // Fetch Report Data
    useEffect(() => {
        const fetchReportData = async () => {
            setIsLoading(true);
            let query = supabase.from('sensor_data').select('*');
            
            if (farmerId) {
                query = query.eq('farmer_id', farmerId);
            }

            let fromDate = new Date();
            let toDate = new Date();

            if (timeRange === '1h') fromDate.setHours(toDate.getHours() - 1);
            else if (timeRange === '1d') fromDate.setDate(toDate.getDate() - 1);
            else if (timeRange === '7d') fromDate.setDate(toDate.getDate() - 7);
            else if (timeRange === 'custom' && startDate && endDate) {
                fromDate = new Date(startDate);
                toDate = new Date(endDate);
                toDate.setHours(23, 59, 59, 999);
            }

            query = query.gte('created_at', fromDate.toISOString())
                         .lte('created_at', toDate.toISOString())
                         .order('created_at', { ascending: true }); // Ascending for left-to-right graphs

            const { data, error } = await query;
            if (data) setReportData(data);
            setIsLoading(false);
        };

        fetchReportData();
    }, [timeRange, startDate, endDate, farmerId]);

    // Data Computation
    const metrics = useMemo(() => {
        if (!reportData || reportData.length === 0) return null;
        
        let totalMoisture = 0, totalTemp = 0, totalWater = 0;
        let count = reportData.length;
        
        const chartData = reportData.map(d => {
            const m = Number(d.soil1) || 0;
            const t = Number(d.temp1) || 0;
            const w = d.water_level !== undefined ? Number(d.water_level) : 50;
            
            totalMoisture += m;
            totalTemp += t;
            totalWater += w;
            
            return {
                timestamp: new Date(d.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
                time: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                moisture: m,
                temperature: t,
                water_level: w
            };
        });

        const avgMoisture = (totalMoisture / count).toFixed(1);
        const avgTemp = (totalTemp / count).toFixed(1);
        const avgWater = (totalWater / count).toFixed(1);

        const half = Math.floor(count / 2);
        const firstHalf = chartData.slice(0, half);
        const secondHalf = chartData.slice(half);
        
        const avgM1 = firstHalf.reduce((s, d) => s + d.moisture, 0) / (firstHalf.length || 1);
        const avgM2 = secondHalf.reduce((s, d) => s + d.moisture, 0) / (secondHalf.length || 1);
        const moistureTrend = avgM2 > avgM1 ? 'Increasing ↗' : 'Decreasing ↘';
        
        let irrigationEvents = 0;
        for (let i = 1; i < chartData.length; i++) {
            if (chartData[i].moisture - chartData[i-1].moisture > 15) {
                irrigationEvents++;
            }
        }

        let insightMsg = "Stable conditions observed.";
        if (irrigationEvents > 2) insightMsg = "Irrigation was required frequently in this period.";
        else if (avgMoisture < 30) insightMsg = "Sustained drought condition detected. Review watering schedule.";
        
        return { avgMoisture, avgTemp, avgWater, chartData, irrigationEvents, moistureTrend, insightMsg };
    }, [reportData]);

    const downloadCSV = () => {
        if (!metrics) return;
        const headers = "Timestamp,Moisture (%),Temperature (°C),Water Level (%)\n";
        const rows = metrics.chartData.map(d => `"${d.timestamp}",${d.moisture},${d.temperature},${d.water_level}`).join("\n");
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Farm_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const downloadPDF = async () => {
        if (!reportRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Farm_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("PDF Gen Error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-white dark:bg-nature-950 p-6 rounded-2xl shadow-sm border border-nature-200 dark:border-nature-800 mt-8 mb-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-nature-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-green-600" />
                        Downloadable Analytics Report
                    </h2>
                    <p className="text-sm text-nature-500">Generate professional insights across selected telemetry windows.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-nature-50 dark:bg-nature-900 rounded-lg p-1 border border-nature-200 dark:border-nature-800">
                        {['1h', '1d', '7d', 'custom'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${timeRange === range ? 'bg-white dark:bg-nature-950 shadow text-green-700' : 'text-nature-600 hover:text-green-600'}`}
                            >
                                {range === '1h' ? 'Last 1 Hour' : range === '1d' ? 'Last 1 Day' : range === '7d' ? 'Last 7 Days' : 'Custom'}
                            </button>
                        ))}
                    </div>

                    {timeRange === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm border border-nature-200 dark:border-nature-800 rounded-md px-2 py-1.5 focus:outline-none focus:border-green-500" />
                            <span className="text-nature-400">-</span>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm border border-nature-200 dark:border-nature-800 rounded-md px-2 py-1.5 focus:outline-none focus:border-green-500" />
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button onClick={downloadCSV} disabled={!metrics || isGenerating} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50 cursor-pointer">
                            <FileSpreadsheet className="w-4 h-4" /> CSV
                        </button>
                        <button onClick={downloadPDF} disabled={!metrics || isGenerating} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer">
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {isGenerating ? 'Generating...' : 'Download PDF'}
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-nature-200 dark:border-nature-800 rounded-xl">
                    <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-2" />
                    <p className="text-nature-500 font-medium">Querying selected range...</p>
                </div>
            ) : !metrics ? (
                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-nature-200 dark:border-nature-800 rounded-xl bg-nature-50 dark:bg-nature-900/50">
                    <Filter className="w-8 h-8 text-nature-400 mb-2" />
                    <p className="text-nature-900 dark:text-white font-bold">No data available for selected range</p>
                    <p className="text-nature-500 text-sm">Try widening your time window or selecting a different date.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-nature-950 border-2 border-nature-200 dark:border-nature-800 rounded-xl overflow-hidden relative">
                    <div ref={reportRef} className="p-8 bg-white dark:bg-nature-950" style={{ minWidth: '800px' }}>
                        
                        <div className="border-b-2 border-green-600 pb-4 mb-6 flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black text-green-700 mb-1 flex items-center gap-2">
                                    <Leaf className="w-8 h-8" /> AgriSmart
                                </h1>
                                <p className="text-nature-500 font-medium">Smart Irrigation Platform</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-bold text-nature-900 dark:text-white">Farm Analytics Report</h2>
                                <p className="text-nature-500 text-sm">Generated: {new Date().toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="bg-nature-50 dark:bg-nature-900 p-4 rounded-lg border border-nature-200 dark:border-nature-800 mb-6 flex justify-between">
                            <div>
                                <p className="text-xs text-nature-500 uppercase font-bold tracking-wider mb-1">Account Holder</p>
                                <p className="font-bold text-nature-900 dark:text-white">{user?.user_metadata?.name || 'Registered User'}</p>
                                <p className="text-sm text-nature-600">{user?.email}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-nature-500 uppercase font-bold tracking-wider mb-1">Assigned Telemetry Array</p>
                                <p className="font-mono bg-white dark:bg-nature-950 px-2 py-1 rounded text-sm border font-bold text-nature-700 dark:text-nature-200">{farmerId || 'GLOBAL'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-8">
                            <div className="border border-blue-200 bg-blue-50/50 p-4 rounded-lg">
                                <p className="text-xs text-blue-600 uppercase font-bold mb-1">Avg Moisture</p>
                                <p className="text-2xl font-black text-nature-900 dark:text-white">{metrics.avgMoisture}%</p>
                                <p className="text-xs text-blue-600 font-medium mt-1">{metrics.moistureTrend}</p>
                            </div>
                            <div className="border border-red-200 bg-red-50/50 p-4 rounded-lg">
                                <p className="text-xs text-red-600 uppercase font-bold mb-1">Avg Temperature</p>
                                <p className="text-2xl font-black text-nature-900 dark:text-white">{metrics.avgTemp}°C</p>
                            </div>
                            <div className="border border-cyan-200 bg-cyan-50/50 p-4 rounded-lg">
                                <p className="text-xs text-cyan-600 uppercase font-bold mb-1">Avg Tank Level</p>
                                <p className="text-2xl font-black text-nature-900 dark:text-white">{metrics.avgWater}%</p>
                            </div>
                            <div className="border border-green-200 bg-green-50/50 p-4 rounded-lg">
                                <p className="text-xs text-green-600 uppercase font-bold mb-1">Irrigation Events</p>
                                <p className="text-2xl font-black text-nature-900 dark:text-white">{metrics.irrigationEvents}</p>
                                <p className="text-xs text-green-600 font-medium mt-1">Detected Spikes</p>
                            </div>
                        </div>

                        <div className="bg-green-600 text-white p-4 rounded-lg mb-8 flex items-center gap-3 shadow-sm">
                            <Activity className="w-5 h-5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-green-100 uppercase font-bold tracking-wider mb-0.5">Algorithmic Insight</p>
                                <p className="font-medium">{metrics.insightMsg}</p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="font-bold text-nature-900 dark:text-white border-b pb-2 mb-4">Moisture vs Time</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={metrics.chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                                        <Area type="monotone" dataKey="moisture" stroke="#3b82f6" strokeWidth={2} fillOpacity={0.1} fill="#3b82f6" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="font-bold text-nature-900 dark:text-white border-b pb-2 mb-4">Temperature vs Time</h3>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={metrics.chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="time" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                                        <Area type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} fillOpacity={0.1} fill="#ef4444" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-nature-900 dark:text-white border-b pb-2 mb-4">Raw Telemetry Snippet (Latest 5 Rows)</h3>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-nature-50 dark:bg-nature-900 text-nature-500 uppercase text-xs font-bold">
                                    <tr>
                                        <th className="px-4 py-2 rounded-tl-lg">Timestamp</th>
                                        <th className="px-4 py-2">Moisture (%)</th>
                                        <th className="px-4 py-2">Temperature (°C)</th>
                                        <th className="px-4 py-2 rounded-tr-lg">Water Level (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...metrics.chartData].reverse().slice(0, 5).map((row, idx) => (
                                        <tr key={idx} className="border-b border-nature-100 dark:border-nature-700/50 last:border-0 hover:bg-nature-50 dark:bg-nature-900/50">
                                            <td className="px-4 py-3 font-medium text-nature-900 dark:text-white">{row.timestamp}</td>
                                            <td className="px-4 py-3 text-blue-600 font-bold">{row.moisture}</td>
                                            <td className="px-4 py-3 text-red-600 font-bold">{row.temperature}</td>
                                            <td className="px-4 py-3 text-cyan-600 font-bold">{row.water_level}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className="text-xs text-nature-400 mt-2 text-center italic">* Download CSV to view complete dataset block logs.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
