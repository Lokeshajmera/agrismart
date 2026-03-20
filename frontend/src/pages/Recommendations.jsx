import React, { useState, useEffect } from 'react';
import {
    Droplets, Thermometer, Bug, Plane, CloudRain, Wind,
    Wheat, IndianRupee, RefreshCw, CheckCircle,
    Clock, TrendingDown, Leaf, Sparkles
} from 'lucide-react';
import { useAlerts } from '../context/AlertsContext';

const CATEGORY_ORDER = ['Irrigation', 'Heat Management', 'Pest & Disease', 'Drone Mission', 'Water Conservation', 'Crop Management'];

export default function Recommendations() {
    const { recs, weatherData: weather, loading, lastUpdated, refresh } = useAlerts();
    const [refreshing, setRefreshing] = useState(false);
    const [dismissed, setDismissed] = useState(new Set());

    const PRIORITY_STYLE = {
        high:   { label: 'High Priority',   bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
        medium: { label: 'Medium Priority', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
        low:    { label: 'Low Priority',    bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        setDismissed(new Set());
        await refresh();
        setTimeout(() => setRefreshing(false), 800);
    };

    const dismiss = (id) => setDismissed(prev => new Set([...prev, id]));

    const visible = recs.filter(r => !dismissed.has(r.id));
    const sorted  = [...visible].sort((a, b) => {
        const p = { high: 0, medium: 1, low: 2 };
        return (p[a.priority] - p[b.priority]) || CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-nature-900 tracking-tight flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-earth-500" /> AI Recommendations
                    </h1>
                    <p className="text-nature-500 mt-1 text-sm">
                        Smart suggestions based on live weather & soil data for your farm.
                    </p>
                    {lastUpdated && (
                        <p className="text-[11px] text-nature-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Updated: {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            {weather && (
                                <span className="ml-2">
                                    · {weather.main?.temp?.toFixed(1)}°C &nbsp;·&nbsp; {weather.main?.humidity}% RH &nbsp;·&nbsp; Wind {weather.wind?.speed?.toFixed(1)} m/s
                                </span>
                            )}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-nature-500 font-medium bg-nature-100 px-2.5 py-1 rounded-full border border-nature-200">
                        {visible.length} suggestion{visible.length !== 1 ? 's' : ''}
                    </span>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all cursor-pointer border ${
                            refreshing
                                ? 'bg-earth-50 text-earth-600 border-earth-300 scale-95'
                                : 'text-nature-600 bg-nature-100 hover:bg-green-100 hover:text-green-700 hover:border-green-300 active:scale-95 border-nature-200'
                        }`}
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Updating...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-nature-400 gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-earth-500" />
                    <p className="text-sm font-medium">Analysing weather & soil data...</p>
                </div>
            )}

            {/* Empty */}
            {!loading && visible.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-nature-400 gap-3">
                    <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-lg font-bold text-nature-700">All Caught Up!</p>
                    <p className="text-sm text-nature-400 text-center max-w-xs">All suggestions dismissed. Click Refresh to generate new insights from current conditions.</p>
                    <button onClick={handleRefresh} className="mt-2 flex items-center gap-1.5 text-sm font-medium text-earth-600 hover:underline cursor-pointer">
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh now
                    </button>
                </div>
            )}

            {/* Suggestion Cards — no action buttons, pure advisory */}
            {!loading && sorted.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {sorted.map(rec => {
                        const p = PRIORITY_STYLE[rec.priority];
                        const Icon = rec.icon;
                        return (
                            <div
                                key={rec.id}
                                className="bg-white rounded-2xl border border-nature-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
                            >
                                {/* Card header */}
                                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-nature-100">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-xl ${rec.iconBg} flex items-center justify-center`}>
                                            <Icon className={`w-4 h-4 ${rec.iconColor}`} />
                                        </div>
                                        <span className="text-[11px] font-bold text-nature-400 uppercase tracking-wider">{rec.category}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${p.bg} ${p.text}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`}></span>
                                            {p.label}
                                        </span>
                                        <button
                                            onClick={() => dismiss(rec.id)}
                                            className="text-[11px] font-semibold text-nature-400 hover:text-nature-600 hover:bg-nature-100 border border-nature-200 hover:border-nature-300 px-2.5 py-1 rounded-full transition-all cursor-pointer"
                                        >
                                            Got it ✓
                                        </button>
                                    </div>
                                </div>

                                {/* Card body */}
                                <div className="flex-1 flex flex-col px-5 py-4 gap-3">
                                    <h3 className="font-bold text-nature-900 text-[15px] leading-snug">{rec.title}</h3>
                                    <p className="text-nature-600 text-sm leading-relaxed">{rec.reason}</p>

                                    {/* Tip */}
                                    <div className="flex items-start gap-2 bg-nature-50 rounded-lg px-3 py-2 border border-nature-100 mt-auto">
                                        <Leaf className="w-3.5 h-3.5 text-earth-500 mt-0.5 shrink-0" />
                                        <p className="text-[11px] text-nature-500 leading-relaxed"><span className="font-semibold text-earth-600">Tip: </span>{rec.tip}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && (
                <p className="text-center text-[11px] text-nature-400 pt-2 border-t border-nature-100">
                    ⚡ Powered by OpenWeatherMap + Supabase sensor data · Pune, Maharashtra
                </p>
            )}
        </div>
    );
}
