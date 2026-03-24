import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Droplets, Leaf, Activity, Filter, AlertCircle, Info, Database } from 'lucide-react';
import { supabase } from '../supabaseClient';
import AnalyticsReport from '../components/AnalyticsReport';

export default function Analytics() {
  const { t } = useTranslation();
  const [liveData, setLiveData] = useState([]);
  const [timeRange, setTimeRange] = useState('live'); // 'live', '1D', 'yesterday', '7D'
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLiveData = async () => {
      setIsLoading(true);
      let query = supabase.from('sensor_data').select('*');
      
      const now = new Date();
      if (timeRange === 'live') {
        query = query.order('created_at', { ascending: false }).limit(60);
      } else if (timeRange === '1D') {
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        query = query.gte('created_at', dayAgo.toISOString()).order('created_at', { ascending: true });
      } else if (timeRange === 'yesterday') {
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query = query.gte('created_at', startOfYesterday.toISOString())
                     .lt('created_at', endOfYesterday.toISOString())
                     .order('created_at', { ascending: true });
      } else if (timeRange === '7D') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte('created_at', weekAgo.toISOString()).order('created_at', { ascending: true });
      }

      const { data } = await query;
      if (data) {
        setLiveData(timeRange === 'live' ? [...data].reverse() : data);
      } else {
        setLiveData([]);
      }
      setIsLoading(false);
    };
    fetchLiveData();
    if (timeRange === 'live') {
      const interval = setInterval(fetchLiveData, 15000);
      return () => clearInterval(interval);
    }
  }, [timeRange]);

  const chartData = useMemo(() => {
    if (liveData.length === 0) return [];
    
    if (timeRange === 'live') {
      const grouped = [];
      for (let i = 0; i < liveData.length; i += 6) {
        const chunk = liveData.slice(i, i + 6);
        const sum = chunk.reduce((acc, curr) => ({
          moisture: acc.moisture + (Number(curr.soil1) || 0),
          moisture_b: acc.moisture_b + (Number(curr.soil2) || 0),
          temperature: acc.temperature + (Number(curr.temp1) || 0),
          humidity: acc.humidity + (Number(curr.hum1) || 0)
        }), { moisture: 0, moisture_b: 0, temperature: 0, humidity: 0 });
        const time = new Date(chunk[0].created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        grouped.push({
          time,
          moisture: Math.round(sum.moisture / chunk.length),
          moisture_b: Math.round(sum.moisture_b / chunk.length),
          temperature: Math.round((sum.temperature / chunk.length) * 10) / 10,
          humidity: Math.round(sum.humidity / chunk.length)
        });
      }
      return grouped;
    }

    const groups = {};
    liveData.forEach(row => {
      const date = new Date(row.created_at);
      let key;
      if (timeRange === '7D') {
        key = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      } else {
        key = date.getHours().toString().padStart(2, '0') + ":00";
      }
      
      if (!groups[key]) groups[key] = { moisture: [], moisture_b: [], temperature: [], humidity: [] };
      groups[key].moisture.push(Number(row.soil1) || 0);
      groups[key].moisture_b.push(Number(row.soil2) || 0);
      groups[key].temperature.push(Number(row.temp1) || 0);
      groups[key].humidity.push(Number(row.hum1) || 0);
    });

    return Object.keys(groups).map(key => ({
      time: key,
      moisture: Math.round(groups[key].moisture.reduce((a, b) => a + b, 0) / (groups[key].moisture.length || 1)),
      moisture_b: Math.round(groups[key].moisture_b.reduce((a, b) => a + b, 0) / (groups[key].moisture_b.length || 1)),
      temperature: Math.round((groups[key].temperature.reduce((a, b) => a + b, 0) / (groups[key].temperature.length || 1)) * 10) / 10,
      humidity: Math.round(groups[key].humidity.reduce((a, b) => a + b, 0) / (groups[key].humidity.length || 1))
    }));
  }, [liveData, timeRange]);

  const avgMoisture = useMemo(() => {
    if (chartData.length === 0) return null;
    return Math.round(chartData.reduce((acc, curr) => acc + curr.moisture, 0) / chartData.length);
  }, [chartData]);

  const EmptyState = ({ message, desc, type }) => (
    <div className="h-full flex flex-col items-center justify-center text-nature-400 dark:text-white/50 py-10 border-2 border-dashed border-nature-200 dark:border-nature-800 rounded-2xl bg-nature-50 dark:bg-nature-900/30 w-full animate-in fade-in duration-700">
      {type === 'observation' ? <Database className="w-12 h-12 mb-4 text-green-500" /> : <Filter className="w-12 h-12 mb-4 opacity-20" />}
      <p className="text-lg font-bold text-nature-900 dark:text-white">{message || t("No Data Found")}</p>
      <p className="text-sm text-center px-6">{desc || t("There is no telemetry for the selected range.")}</p>
    </div>
  );

  const ObservationCard = ({ data, title }) => (
    <div className="flex flex-col items-center justify-center p-8 bg-nature-50 dark:bg-nature-900/40 rounded-2xl border border-nature-200 dark:border-nature-800 animate-in zoom-in duration-500 w-full h-full">
      <div className="flex items-center gap-3 mb-6 bg-white dark:bg-nature-950 px-4 py-2 rounded-full border border-nature-200 dark:border-nature-800 shadow-sm">
        <Database className="w-4 h-4 text-green-500" />
        <span className="text-xs font-black text-nature-900 dark:text-white uppercase tracking-wider">{t("Single Observation Found")} ({data.time})</span>
      </div>
      <div className="grid grid-cols-2 gap-8 w-full max-w-sm">
        <div className="text-center">
          <p className="text-xs text-nature-500 font-bold uppercase mb-1">{t("Zone A / B")}</p>
          <p className="text-3xl font-black text-blue-600">{data.moisture}% / {data.moisture_b}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-nature-500 font-bold uppercase mb-1">{t("Temperature")}</p>
          <p className="text-3xl font-black text-red-600">{data.temperature}°C</p>
        </div>
      </div>
      <p className="mt-8 text-xs text-nature-400 dark:text-white/40 italic">{t("* A chart requires at least 2 points to show trends.")}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto p-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-nature-950 p-6 rounded-3xl border border-nature-200 dark:border-nature-800 shadow-sm">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-nature-900 dark:text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-earth-500 animate-pulse" /> {t("Farm Intelligence")}
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <p className="text-nature-500 dark:text-white text-sm">{t("Detailed analysis and historical trends.")}</p>
             <div className="group relative">
               <Info className="w-4 h-4 text-nature-300 hover:text-earth-500 cursor-help transition-colors" />
               <div className="absolute left-0 top-6 w-64 p-3 bg-nature-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl border border-nature-700">
                 <p className="font-bold mb-1 border-b border-nature-700 pb-1">Data Mappings (ESP32):</p>
                 <ul className="space-y-1">
                   <li>• Zone A Moisture: `soil1` input</li>
                   <li>• Zone B Moisture: `soil2` input</li>
                   <li>• Ambient Humidity: `hum1` sensor</li>
                   <li>• Ambient Temp: `temp1` sensor</li>
                 </ul>
               </div>
             </div>
          </div>
        </div>
        <div className="flex bg-nature-100 dark:bg-nature-800 rounded-xl p-1 border border-nature-200 dark:border-nature-700">
          {[
            { id: 'live', label: 'Live' },
            { id: '1D', label: '1 Day' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7D', label: '7 Days' }
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setTimeRange(r.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timeRange === r.id ? 'bg-white dark:bg-nature-950 shadow-sm text-nature-900 dark:text-white' : 'text-nature-500 hover:text-nature-700'}`}
            >
              {t(r.label)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-white p-6 rounded-2xl shadow-lg border relative overflow-hidden group transition-colors duration-500 bg-nature-900 border-nature-800">
          <div className="flex items-center gap-2 text-white/80 mb-2">
            <Droplets className="w-5 h-5" />
            <h3 className="font-bold">{t("Avg Soil Moisture")}</h3>
          </div>
          <p className="text-4xl font-extrabold mb-1 relative z-10">{avgMoisture !== null ? `${avgMoisture}%` : '---'}</p>
          <p className="text-sm text-white/90 flex items-center gap-1 relative z-10">
            <Activity className="w-4 h-4" /> {timeRange === 'live' ? t("Moving average (60s)") : t("Range average")}
          </p>
        </div>

        <div className="bg-white dark:bg-nature-950 p-6 rounded-2xl shadow-sm border border-nature-200 dark:border-nature-800">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <Leaf className="w-5 h-5" />
            <h3 className="font-bold text-nature-900 dark:text-white">{t("Crop Health Index")}</h3>
          </div>
          <p className="text-4xl font-extrabold text-nature-900 dark:text-white mb-1">{avgMoisture !== null ? t("Optimal") : '---'}</p>
          <p className="text-sm text-nature-500 dark:text-white flex items-center gap-1">{t("Correlated with telemetry")}</p>
        </div>

        <div className="bg-white dark:bg-nature-950 p-6 rounded-2xl shadow-sm border border-nature-200 dark:border-nature-800">
          <h3 className="font-bold text-nature-900 dark:text-white mb-2">{t("Telemetry Status")}</h3>
          <p className="text-4xl font-extrabold text-nature-900 dark:text-white flex items-center gap-2 mb-1">
            {isLoading ? t("Loading...") : chartData.length > 0 ? t("Active") : t("Waiting")}
            <span className="relative flex h-3 w-3">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${chartData.length > 0 ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${chartData.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            </span>
          </p>
          <p className="text-sm text-nature-500 dark:text-white">{t("Listening to live ESP32")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-nature-950 p-6 rounded-2xl shadow-sm border border-nature-200 dark:border-nature-800 lg:col-span-2 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-nature-900 dark:text-white">{t("Soil Moisture Dynamics")}</h3>
            {chartData.length > 1 && chartData.length < 5 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold rounded-full border border-yellow-200 dark:border-yellow-800 ring-2 ring-yellow-50 dark:ring-nature-900">
                <AlertCircle className="w-3 h-3" /> {t("Limited trend data")}
              </div>
            )}
          </div>
          <div className="h-80 w-full">
            {chartData.length === 0 ? <EmptyState /> : chartData.length === 1 ? <ObservationCard data={chartData[0]} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1efe6" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#3b82f6', fontSize: 10 }} />
                  <Tooltip />
                  <Legend iconType="circle" />
                  <Area type="monotone" name="Area 1 Moisture (%)" dataKey="moisture" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMoisture)" />
                  <Area type="monotone" name="Area 2 Moisture (%)" dataKey="moisture_b" stroke="#10b981" strokeWidth={3} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-nature-950 p-6 rounded-2xl shadow-sm border border-nature-200 dark:border-nature-800 lg:col-span-2 min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-nature-900 dark:text-white">{t("Environmental Dynamics (Temp & Hum)")}</h3>
             {chartData.length > 1 && chartData.length < 5 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold rounded-full border border-yellow-200 dark:border-yellow-800">
                  <AlertCircle className="w-3 h-3" /> {t("Sparse Telemetry")}
                </div>
             )}
          </div>
          <div className="h-64 w-full">
            {chartData.length === 0 ? <EmptyState /> : chartData.length === 1 ? <ObservationCard data={chartData[0]} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1efe6" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#8b5cf6', fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#ef4444', fontSize: 10 }} />
                  <Tooltip />
                  <Legend iconType="circle" />
                  <Area yAxisId="left" type="monotone" name="Air Humidity (%)" dataKey="humidity" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorHumidity)" />
                  <Area yAxisId="right" type="monotone" name="Air Temp (°C)" dataKey="temperature" stroke="#ef4444" strokeWidth={3} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      <AnalyticsReport selectedRange={timeRange} />
    </div>
  );
}
