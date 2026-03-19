import React, { useState } from 'react';
import { Brain, ShieldAlert, Sprout, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function AICropIntelligence() {
    const [analyzing, setAnalyzing] = useState(false);
    const [insightYield, setInsightYield] = useState(4.2);
    const [confidence, setConfidence] = useState(94);

    const runDiagnostics = () => {
        setAnalyzing(true);
        setTimeout(() => {
            setInsightYield(4.5); // Increase yield prediction after analysis
            setConfidence(97);
            setAnalyzing(false);
        }, 2000);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-nature-900 tracking-tight">AI Crop Intelligence</h1>
                    <p className="text-nature-500 mt-1">Machine Learning insights tailored for your wheat crop.</p>
                </div>
                <div className="bg-earth-100 text-earth-800 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 border border-earth-200">
                    <Brain className="w-4 h-4" /> AI Models Active
                </div>
            </div>

            {/* Main Predictions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-nature-900 to-nature-800 p-6 rounded-2xl shadow-lg relative overflow-hidden text-white col-span-1 lg:col-span-2 shadow-nature-900/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-earth-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="relative z-10 w-full h-full flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-4 text-earth-300">
                            <Sprout className="w-5 h-5" />
                            <span className="font-bold text-sm uppercase tracking-wider">Yield Prediction Model</span>
                        </div>

                        {analyzing ? (
                            <div className="flex-1 flex flex-col items-center justify-center min-h-[160px]">
                                <RefreshCw className="w-10 h-10 text-earth-400 animate-spin mb-4" />
                                <p className="text-sm font-medium text-nature-200 animate-pulse text-center max-w-sm">Running advanced machine learning diagnostics on latest sensor telemetry...</p>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-nature-200">
                                    {insightYield} Tons / Hectare
                                </h2>
                                <p className="text-nature-300 text-sm mb-6 max-w-md leading-relaxed flex-1">
                                    Based on current soil conditions, historical data from North India, and the 14-day weather forecast, your wheat yield is projected to be <strong className="text-white">+{Math.round((insightYield - 3.75) * 10)}% higher</strong> than the regional average.
                                </p>
                            </>
                        )}

                        <div className="grid grid-cols-3 gap-4 border-t border-nature-700/50 pt-6 mt-auto">
                            <div>
                                <p className="text-nature-400 text-xs mb-1">Growth Stage</p>
                                <p className="font-bold">Heading</p>
                            </div>
                            <div>
                                <p className="text-nature-400 text-xs mb-1">Estimated Harvest</p>
                                <p className="font-bold">April 15</p>
                            </div>
                            <div>
                                <p className="text-nature-400 text-xs mb-1">Confidence</p>
                                <p className="font-bold text-earth-400">{analyzing ? '--' : `${confidence}%`}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm shadow-red-500/5 flex flex-col">
                    <div className="flex items-center gap-2 mb-4 text-red-600">
                        <ShieldAlert className="w-5 h-5" />
                        <span className="font-bold text-sm uppercase tracking-wider">Disease Risk</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center mb-4 text-red-500">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-nature-900 mb-1">Medium Risk</h3>
                        <p className="text-red-600 font-semibold mb-2">Wheat Rust</p>
                        <p className="text-sm text-nature-600 mb-6">High humidity tomorrow increases susceptibility. Consider preventative measures.</p>

                        {!analyzing && (
                            <button onClick={runDiagnostics} className="w-full bg-nature-800 text-white font-medium py-2 rounded-lg hover:bg-nature-900 transition-colors flex items-center justify-center gap-2 mt-auto">
                                <Brain className="w-4 h-4" /> Run AI Diagnostics
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-bold text-nature-900 mt-8 mb-4">Insights Feed</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { icon: TrendingUp, title: 'Soil Memory Adjusted', desc: 'The AI has learned that Zone 2 retains moisture 15% longer than Zone 1. Irrigation schedules have been updated automatically.', type: 'positive' },
                    { icon: AlertTriangle, title: 'Heat Stress Warning', desc: 'Temperatures projected to exceed 32°C next Tuesday. Pre-emptive short irrigation bursts scheduled.', type: 'advisory' },
                    { icon: CheckCircle2, title: 'Vegetation Health (NDVI)', desc: 'Satellite imagery analysis confirms uniform crop health across 95% of the acreage. No major anomalies.', type: 'positive' },
                ].map((item, i) => (
                    <div key={i} className="bg-white p-5 rounded-xl border border-nature-200 shadow-sm flex items-start gap-4">
                        <div className={`p-2.5 rounded-lg shrink-0 ${item.type === 'positive' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-nature-900 mb-1">{item.title}</h4>
                            <p className="text-sm text-nature-600 leading-relaxed">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
