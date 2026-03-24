import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Download, FileText, Loader2, FileSpreadsheet, Activity, Leaf, Filter, AlertCircle, AreaChart as ChartIcon, User } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useLiveTranslation } from '../hooks/useLiveTranslation';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsReport({ selectedRange }) {
  const { tLive: t } = useLiveTranslation();
  const { user } = useAuth();
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef(null);

  const activeRange = selectedRange || '1d';

  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      let query = supabase.from('sensor_data').select('*');
      let fromDate = new Date();
      let toDate = new Date();

      const rangeId = activeRange.toLowerCase();
      if (rangeId === '1h') fromDate.setHours(toDate.getHours() - 1);
      else if (rangeId === '1d' || rangeId === 'live') fromDate.setDate(toDate.getDate() - 1);
      else if (rangeId === 'yesterday') {
         fromDate = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() - 1);
         toDate = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
      }
      else if (rangeId === '7d') fromDate.setDate(toDate.getDate() - 7);

      query = query.gte('created_at', fromDate.toISOString()).lte('created_at', toDate.toISOString()).order('created_at', { ascending: true });
      const { data } = await query;
      if (data) setReportData(data);
      setIsLoading(false);
    };
    fetchReportData();
  }, [activeRange, user]);

  const metrics = useMemo(() => {
    if (!reportData || reportData.length === 0) return null;
    
    const groups = {};
    const rangeId = activeRange.toLowerCase();

    reportData.forEach(row => {
      const date = new Date(row.created_at);
      let key;
      if (rangeId === '7d') {
        key = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      } else if (rangeId === '1d' || rangeId === 'yesterday') {
        key = date.getHours().toString().padStart(2, '0') + ":00";
      } else {
        key = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      }
      
      if (!groups[key]) groups[key] = { moisture: [], temperature: [], humidity: [], timestamp: date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) };
      groups[key].moisture.push(Number(row.soil1) || 0);
      groups[key].temperature.push(Number(row.temp1) || 0);
      groups[key].humidity.push(Number(row.hum1) || 0);
    });

    const chartData = Object.keys(groups).map(key => ({
      time: key,
      timestamp: groups[key].timestamp,
      moisture: Math.round(groups[key].moisture.reduce((a, b) => a + b, 0) / (groups[key].moisture.length || 1)),
      temperature: Math.round((groups[key].temperature.reduce((a, b) => a + b, 0) / (groups[key].temperature.length || 1)) * 10) / 10,
      humidity: Math.round(groups[key].humidity.reduce((a, b) => a + b, 0) / (groups[key].humidity.length || 1))
    }));

    const avgMoisture = (chartData.reduce((a, b) => a + b.moisture, 0) / (chartData.length || 1)).toFixed(1);
    const avgTemp = (chartData.reduce((a, b) => a + b.temperature, 0) / (chartData.length || 1)).toFixed(1);
    const avgHum = (chartData.reduce((a, b) => a + b.humidity, 0) / (chartData.length || 1)).toFixed(1);
    
    let irrigationEvents = 0;
    for (let i = 1; i < chartData.length; i++) {
        // Simple spike detection logic
      if (chartData[i].moisture - chartData[i-1].moisture > 15) irrigationEvents++;
    }

    return { avgMoisture, avgTemp, avgHum, chartData, irrigationEvents, insightMsg: avgMoisture < 30 ? "Sustained drought condition detected. Review watering schedule." : "Stable environmental conditions maintained." };
  }, [reportData, activeRange]);

  const downloadCSV = () => {
    if (!reportData || reportData.length === 0) return;
    const headers = "Timestamp (Raw),Zone A Moisture (%),Zone B Moisture (%),Temperature (°C),Humidity (%)\n";
    const rows = reportData.map(d => {
      const date = new Date(d.created_at).toLocaleString('en-IN');
      return `"${date}",${d.soil1 || 0},${d.soil2 || 0},${d.temp1 || 0},${d.hum1 || 0}`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `AgriSmart_RawData_${activeRange}.csv`; a.click();
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 800)); // Wait for charts
    try {
      const canvas = await html2canvas(reportRef.current, { 
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`AgriSmart_Visual_Report_${activeRange}.pdf`);
    } catch (e) { console.error(e); }
    setIsGenerating(false);
  };

  return (
    <div className="bg-white dark:bg-nature-950 p-6 rounded-2xl shadow-sm border border-nature-200 dark:border-nature-800 mt-8 mb-10 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-nature-100 dark:border-nature-800 pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-green-600" /> {t("Export Premium Report")}</h2>
          <p className="text-sm text-nature-500 dark:text-white capitalize">{t("Review document below before download")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <button onClick={downloadCSV} disabled={!metrics} className="flex items-center gap-2 px-6 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-all font-bold disabled:opacity-50">
             <FileSpreadsheet className="w-5 h-5" />
             {t("Download CSV")}
           </button>
           <button onClick={downloadPDF} disabled={!metrics || isGenerating} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transition-all font-bold disabled:opacity-50">
             {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
             {t("Download PDF")}
           </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-nature-100 dark:bg-nature-900/30 p-2 md:p-10 rounded-3xl border border-nature-200 dark:border-nature-800">
        <div ref={reportRef} className="bg-white shadow-2xl mx-auto" style={{ width: '800px', minHeight: '1100px', padding: '40px', fontFamily: "'Outfit', sans-serif" }}>
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-green-600 pb-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Leaf className="w-8 h-8 text-green-600 fill-green-600" />
                <h1 className="text-3xl font-black text-nature-900 tracking-tighter">AgriSmart</h1>
              </div>
              <p className="text-xs font-bold text-nature-400 uppercase tracking-widest leading-none ml-10">Smart Irrigation Platform</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-black text-nature-900 uppercase tracking-tight">{t("Farm Analytics Report")}</h2>
              <p className="text-[10px] font-bold text-nature-400 uppercase">{t("Generated")}: {new Date().toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
            </div>
          </div>

          {!metrics ? (
            <div className="py-20 text-center">
              <Filter className="w-16 h-16 mx-auto mb-4 text-nature-200" />
              <p className="text-nature-400 font-bold uppercase tracking-widest">{t("Preparing High-Fidelity Capture...")}</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-1000">
              
              {/* Account Holder Info */}
              <div className="grid grid-cols-2 gap-4 bg-nature-50/50 p-5 rounded-xl border border-nature-100 mb-4">
                <div>
                  <p className="text-[9px] font-black text-nature-400 uppercase tracking-widest mb-1">{t("Account Holder")}</p>
                  <p className="text-lg font-black text-nature-900">{user?.user_metadata?.full_name || "Registered User"}</p>
                  <p className="text-xs font-bold text-nature-500">{user?.email || "lokeshajmera64@gmail.com"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-nature-400 uppercase tracking-widest mb-1">{t("Assigned Telemetry Array")}</p>
                  <div className="inline-block px-4 py-1.5 border-2 border-nature-200 rounded-md bg-white">
                    <p className="text-sm font-black text-nature-800 tracking-widest">LOKESH001</p>
                  </div>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Avg Moisture", val: `${metrics.avgMoisture}%`, sub: "Increasing", color: "blue" },
                  { label: "Avg Temperature", val: `${metrics.avgTemp}°C`, sub: "Stable", color: "red" },
                  { label: "Avg Humidity", val: `${metrics.avgHum}%`, sub: "Normal", color: "sky" },
                  { label: "Irrigation Events", val: metrics.irrigationEvents, sub: "Detected Spikes", color: "green" }
                ].map((kpi, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border shadow-sm ${kpi.color === 'blue' ? 'bg-blue-50/30 border-blue-100' : kpi.color === 'red' ? 'bg-red-50/30 border-red-100' : kpi.color === 'sky' ? 'bg-sky-50/30 border-sky-100' : 'bg-green-50/30 border-green-100'}`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${kpi.color === 'red' ? 'text-red-500' : kpi.color === 'blue' ? 'text-blue-500' : kpi.color === 'sky' ? 'text-sky-500' : 'text-green-500'}`}>{t(kpi.label)}</p>
                    <p className="text-2xl font-black text-nature-900 mb-1">{kpi.val}</p>
                    <p className="text-[9px] font-bold text-nature-400 flex items-center gap-1 uppercase tracking-tighter italic">{kpi.sub}</p>
                  </div>
                ))}
              </div>

              {/* Algorithmic Insight Row */}
              <div className="bg-green-600 p-4 rounded-xl shadow-lg flex items-center gap-4 text-white">
                 <Activity className="w-6 h-6 opacity-70" />
                 <div>
                   <p className="text-[9px] font-black uppercase tracking-widest opacity-80">{t("Algorithmic Insight")}</p>
                   <p className="text-sm font-bold tracking-tight">{t(metrics.insightMsg)}</p>
                 </div>
              </div>

              {/* Moisture vs Time Chart */}
              <div>
                <h3 className="text-sm font-black text-nature-900 border-b border-nature-100 pb-2 mb-4 uppercase tracking-widest">{t("Moisture vs Time")}</h3>
                <div className="h-48 w-full bg-nature-50/30 rounded-xl p-2 border border-nature-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} dy={5} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Area type="monotone" dataKey="moisture" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.08} strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Temperature vs Time Chart */}
              <div>
                <h3 className="text-sm font-black text-nature-900 border-b border-nature-100 pb-2 mb-4 uppercase tracking-widest">{t("Temperature vs Time")}</h3>
                <div className="h-48 w-full bg-nature-50/30 rounded-xl p-2 border border-nature-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} dy={5} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Area type="monotone" dataKey="temperature" stroke="#dc2626" fill="#ef4444" fillOpacity={0.08} strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Data Table */}
              <div>
                <h3 className="text-sm font-black text-nature-900 border-b border-nature-100 pb-2 mb-4 uppercase tracking-widest">{t("Raw Telemetry Snippet (Latest 5 Rows)")}</h3>
                <div className="rounded-xl border border-nature-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-nature-50 text-nature-400 font-black uppercase text-[10px] tracking-widest border-b border-nature-200">
                      <tr>
                        <th className="px-5 py-4">{t("Timestamp")}</th>
                        <th className="px-5 py-4">{t("Moisture (%)")}</th>
                        <th className="px-5 py-4">{t("Temperature (°C)")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-nature-100">
                      {[...metrics.chartData].reverse().slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-nature-50/50 transition-colors">
                          <td className="px-5 py-3 text-xs font-bold text-nature-900 tracking-tighter">{row.timestamp}</td>
                          <td className="px-5 py-3 text-xs font-black text-blue-600">{row.moisture}%</td>
                          <td className="px-5 py-3 text-xs font-black text-red-600">{row.temperature}°C</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-[9px] text-nature-400 text-center font-bold tracking-widest uppercase italic opacity-60">
                  * {t("Displaying latest 5 rows for PDF stability. Please download CSV to view all")} {reportData.length} {t("records.")}
                </p>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
