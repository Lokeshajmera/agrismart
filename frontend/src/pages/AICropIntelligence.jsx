import React, { useState } from 'react';
import { useLiveTranslation } from '../hooks/useLiveTranslation';
import { motion } from 'framer-motion';
import { 
  Brain, ShieldAlert, Sprout, TrendingUp, AlertTriangle, 
  CheckCircle2, RefreshCw, Activity, Droplets, Thermometer, 
  Layers, Waves, Zap, Leaf 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AICropIntelligence() {
  const { tLive: t } = useLiveTranslation();

  const [analyzing, setAnalyzing] = useState(false);
  const [healthIndex, setHealthIndex] = useState(0.82);
  const [confidence, setConfidence] = useState(94);

  const runDiagnostics = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setHealthIndex(0.88);
      setConfidence(97);
      setAnalyzing(false);
    }, 2500);
  };

  const monitoringFactors = [
    { icon: Layers, label: 'NDVI Vegetation Index', desc: 'Chlorophyll & health mapping', val: '0.82', status: 'Healthy', color: 'text-green-500' },
    { icon: Waves, label: 'NDWI Water Index', desc: 'Plant leaf water content', val: '0.64', status: 'Optimal', color: 'text-blue-500' },
    { icon: Zap, label: 'Canopy Density', desc: 'Crop coverage & uniformity', val: '92%', status: 'Vibrant', color: 'text-earth-500' },
    { icon: Droplets, label: 'Soil Moisture Estimation', desc: 'Imaging-based dry zone detection', val: '43%', status: 'Normal', color: 'text-cyan-500' },
    { icon: Thermometer, label: 'Temperature Mapping', desc: 'Thermal stress localization', val: '28°C', status: 'Cool', color: 'text-orange-500' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-nature-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-earth-100 dark:bg-earth-900/30 rounded-xl">
              <Brain className="w-6 h-6 text-earth-600" />
            </div>
            {t("AI Crop Intelligence")}
          </h1>
          <p className="text-nature-500 dark:text-white/70 mt-1 max-w-xl">{t("Precision agricultural analytics powered by multispectral drone telemetry.")}</p>
        </div>
        <div className="flex items-center gap-3">
           {!analyzing && (
            <button onClick={runDiagnostics} className="bg-nature-800 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-nature-900 transition-all flex items-center gap-2 shadow-lg shadow-nature-900/10 active:scale-95">
              <RefreshCw className="w-4 h-4" /> {t("Rescan Field")}
            </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Main Analysis Card */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 1: Drone-Based Crop Health Monitoring HERO */}
          <div className="bg-white dark:bg-nature-950 rounded-3xl border border-nature-200 dark:border-nature-800 shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 dark:bg-green-500/10 rounded-full blur-[100px] -mr-24 -mt-24"></div>
            
            <div className="p-8 relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-black text-nature-900 dark:text-white flex items-center gap-2">
                    🚁 {t("Drone-Based Crop Health Monitoring")}
                  </h2>
                  <p className="text-nature-500 dark:text-white/60 font-medium">{t("AI-assisted multispectral aerial analysis for precision farming")}</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-green-200 dark:border-green-800 animate-pulse">
                  {t("Analysis Live")}
                </div>
              </div>

              {analyzing ? (
                <div className="py-16 flex flex-col items-center justify-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                    <RefreshCw className="w-16 h-16 text-earth-500 opacity-40" />
                  </motion.div>
                  <p className="mt-6 text-nature-500 dark:text-white animate-pulse font-bold tracking-tight">{t("DECODING MULTISPECTRAL DATA PACKETS...")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                    <div className="relative inline-block">
                      <h3 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-nature-900 to-green-600 dark:from-white dark:to-green-400">
                        {healthIndex}
                      </h3>
                      <div className="absolute -right-12 top-2 bg-nature-100 dark:bg-nature-800 px-2 py-0.5 rounded text-[10px] font-bold text-nature-500">{t("NDVI AVG")}</div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-bold text-lg text-nature-800 dark:text-white flex items-center gap-2">
                         <Leaf className="w-5 h-5 text-green-500" /> {t("🌱 Crop Health Analysis")}
                      </h4>
                      <p className="text-nature-600 dark:text-white/80 leading-relaxed">
                        {t("Our latest drone mission has captured ultra-high-resolution multispectral imagery. By analyzing the")} <span className="text-green-600 dark:text-green-400 font-bold">{t("infrared reflectance")}</span> {t("of your crops, we have identified peak chlorophyll activity and cellular structural stability across 92% of the farm.")}
                      </p>
                    </div>

                    {/* NDVI LEGEND */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black tracking-widest text-nature-400 uppercase">
                        <span>{t("Stressed")}</span>
                        <span>{t("Moderate")}</span>
                        <span>{t("Healthy")}</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 relative shadow-inner">
                         <motion.div 
                          initial={{ left: "0%" }}
                          animate={{ left: `${(healthIndex / 1) * 100}%` }}
                          transition={{ duration: 1, type: "spring" }}
                          className="absolute top-1/2 -translate-y-1/2 -ml-2 w-4 h-6 bg-white dark:bg-nature-900 border-2 border-nature-900 dark:border-white rounded shadow-md z-20"
                         ></motion.div>
                      </div>
                    </div>
                  </div>

                  {/* HEATMAP PREVIEW GRAPHIC */}
                  <div className="bg-nature-50 dark:bg-nature-900/50 rounded-2xl border border-nature-200 dark:border-nature-800 p-4 aspect-square flex flex-col relative overflow-hidden group/map">
                    <div className="grid grid-cols-4 grid-rows-4 h-full w-full gap-1 rounded-lg overflow-hidden relative">
                       {[...Array(16)].map((_, i) => {
                         const colors = ['bg-green-500', 'bg-green-400', 'bg-green-600', 'bg-yellow-400', 'bg-green-500'];
                         const randomColor = colors[Math.floor(Math.random() * colors.length)];
                         return <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className={`${randomColor} opacity-70 rounded-sm`}></motion.div>
                       })}
                       <Link to="/app/map?layer=ndvi" className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-[2px] opacity-0 group-hover/map:opacity-100 transition-opacity z-20">
                         <span className="bg-white dark:bg-nature-950 px-3 py-1.5 rounded-lg text-xs font-bold text-nature-900 dark:text-white shadow-lg">{t("View Field Map")}</span>
                       </Link>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] font-black text-nature-400 uppercase tracking-tighter">{t("Field Heatmap (Zone A/B)")}</span>
                      <span className="text-[10px] items-center gap-1 flex text-green-500 font-bold"><RefreshCw className="w-2.5 h-2.5" /> {t("Pushed 2m ago")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: 📊 Key Monitoring Factors */}
          <div className="bg-nature-100 dark:bg-nature-900/30 p-8 rounded-3xl border border-nature-200 dark:border-nature-800">
            <h3 className="text-xl font-black text-nature-900 dark:text-white mb-6 flex items-center gap-2">
              📊 {t("Key Monitoring Factors")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monitoringFactors.map((factor, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-nature-950 p-5 rounded-2xl border border-nature-200 dark:border-nature-800 shadow-sm flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-xl bg-nature-50 dark:bg-nature-800 ${factor.color}`}>
                      <factor.icon className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-nature-900 dark:text-white block">{factor.val}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${factor.color}`}>{t(factor.status)}</span>
                    </div>
                  </div>
                  <h4 className="font-bold text-sm text-nature-800 dark:text-white mb-1">{t(factor.label)}</h4>
                  <p className="text-[11px] text-nature-500 dark:text-white/60 leading-tight">{t(factor.desc)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Problem Detection & Recommendations */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Section 3: ⚠ Problem Detection */}
          <div className="bg-white dark:bg-nature-950 p-6 rounded-3xl border border-red-100 dark:border-red-900/30 shadow-lg shadow-red-500/5">
            <h3 className="text-base font-black text-nature-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
              <ShieldAlert className="w-5 h-5 text-red-500" /> {t("Problem Detection")}
            </h3>
            
            <div className="space-y-4">
               {[
                 { label: 'Unhealthy Zones', stat: 'None Detected', color: 'text-green-500', icon: CheckCircle2 },
                 { label: 'Water Stress', stat: 'Near Zone B', color: 'text-orange-500', icon: AlertTriangle },
                 { label: 'Growth Anomaly', stat: 'Uniform', color: 'text-green-500', icon: CheckCircle2 },
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-nature-50/50 dark:bg-nature-900/40 rounded-xl border border-nature-100 dark:border-nature-800">
                   <div className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <span className="text-xs font-bold text-nature-700 dark:text-white/80">{t(item.label)}</span>
                   </div>
                   <span className={`text-xs font-black ${item.color}`}>{t(item.stat)}</span>
                 </div>
               ))}
            </div>

            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800">
               <h4 className="text-xs font-black text-red-700 dark:text-red-400 uppercase mb-2 flex items-center gap-1.5">
                 <Zap className="w-3 h-3" /> {t("Priority Alert")}
               </h4>
               <p className="text-xs text-red-600 dark:text-red-300 leading-relaxed font-medium">
                 {t("Slight chlorophyll decline in Sector 7 detected. Drone imaging suggests uneven fertilizer distribution. Adjusting nutrients is advised.")}
               </p>
            </div>
          </div>

          {/* Section 4: 🧠 Smart Recommendations */}
          <div className="bg-nature-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-earth-500 opacity-20 rounded-full blur-3xl -mb-10 -mr-10 transition-transform group-hover:scale-150 duration-700"></div>
            
            <h3 className="text-base font-black mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Brain className="w-5 h-5 text-earth-400" /> {t("Smart Recommendations")}
            </h3>

            <div className="space-y-4 relative z-10">
              {[
                { tip: "Increase irrigation in Zone A", context: "Humidity dropping", icon: Droplets, color: 'text-blue-400' },
                { tip: "Possible crop stress detected", context: "Sector 7 specific", icon: Activity, color: 'text-orange-400' },
                { tip: "Healthy growth in Zone B", context: "Optimal conditions", icon: Sprout, color: 'text-green-400' }
              ].map((rec, i) => (
                <Link key={i} to="/app/recommendations" className="block p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all cursor-pointer">
                   <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-white/5 ${rec.color}`}>
                        <rec.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">{t(rec.tip)}</p>
                        <p className="text-[10px] text-white/50 uppercase font-black tracking-wider mt-1">{t(rec.context)}</p>
                      </div>
                   </div>
                </Link>
              ))}
            </div>

            <Link to="/app/recommendations" className="mt-6 w-full py-3 bg-earth-600 hover:bg-earth-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
               {t("View Action Plan")} <TrendingUp className="w-3 h-3" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
