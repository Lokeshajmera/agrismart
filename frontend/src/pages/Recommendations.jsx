import React, { useState, useEffect } from 'react';
import {
    Droplets, Thermometer, Bug, Plane, CloudRain, Wind,
    Sprout, Wheat, IndianRupee, RefreshCw, CheckCircle,
    AlertTriangle, Clock, TrendingDown, Zap, Sun, Leaf
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const WEATHER_API_KEY = 'e5c8c35726d52c53ed66735380eae2e9';
const CITY = 'Pune';

const PRIORITY_STYLE = {
    high:   { label: 'High Priority',   bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
    medium: { label: 'Medium Priority', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
    low:    { label: 'Low Priority',    bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
};

function generateRecommendations(weather, forecast, soilMoisture) {
    const recs = [];
    const temp     = weather?.main?.temp       ?? 28;
    const humidity = weather?.main?.humidity   ?? 60;
    const wind     = weather?.wind?.speed      ?? 5;
    const weatherId = weather?.weather?.[0]?.id ?? 800;

    // Forecast helpers
    const next36h   = forecast?.list?.slice(0, 12) ?? [];
    const rainSoon  = next36h.find(i => i.weather?.[0]?.id >= 300 && i.weather?.[0]?.id <= 531);
    const heatSoon  = next36h.find(i => i.main?.temp >= 35);
    const stormSoon = next36h.find(i => i.weather?.[0]?.id >= 200 && i.weather?.[0]?.id <= 232);
    const isRaining = weatherId >= 300 && weatherId <= 531;
    const isStorm   = weatherId >= 200 && weatherId <= 232;
    const moisture  = soilMoisture ?? 45;

    // ── 1. IRRIGATION ──────────────────────────────────────────────────────
    if (isRaining || isStorm) {
        recs.push({
            id: 'irr_pause',
            category: 'Irrigation',
            icon: Droplets,
            iconColor: 'text-blue-500',
            iconBg: 'bg-blue-50',
            priority: 'high',
            title: 'Pause All Irrigation Immediately',
            reason: `Active ${isStorm ? 'storm' : 'rainfall'} detected. Running irrigation now wastes water and risks waterlogging root zones.`,
            action: 'Pause Irrigation',
            tip: 'Resume once rainfall totals are known and soil absorption is assessed.'
        });
    } else if (rainSoon) {
        const hrs = Math.round((new Date(rainSoon.dt * 1000) - Date.now()) / 3600000);
        recs.push({
            id: 'irr_reduce_rain',
            category: 'Irrigation',
            icon: CloudRain,
            iconColor: 'text-blue-500',
            iconBg: 'bg-blue-50',
            priority: 'high',
            title: `Suspend Irrigation — Rain in ~${hrs}h`,
            reason: `Weather forecast shows rainfall in approximately ${hrs} hours. Irrigating now could cause overwatering and nutrient runoff.`,
            action: 'Suspend for 24h',
            tip: 'Set a reminder to reassess soil moisture after the rain event.'
        });
    } else if (moisture < 25) {
        recs.push({
            id: 'irr_urgent',
            category: 'Irrigation',
            icon: Droplets,
            iconColor: 'text-red-500',
            iconBg: 'bg-red-50',
            priority: 'high',
            title: 'Urgent: Activate Drip Irrigation Now',
            reason: `Soil moisture is critically low at ${moisture}%. Crops are at risk of wilting. Activate drip irrigation for immediate relief.`,
            action: 'Activate Drip Irrigation',
            tip: 'Target 45–60% soil moisture. Check valve pressures before activating.'
        });
    } else if (moisture < 40) {
        recs.push({
            id: 'irr_increase',
            category: 'Irrigation',
            icon: Droplets,
            iconColor: 'text-orange-500',
            iconBg: 'bg-orange-50',
            priority: 'medium',
            title: 'Increase Irrigation Frequency',
            reason: `Soil moisture at ${moisture}% is below optimal range (40–65%). Consider increasing watering cycles by 15–20 minutes.`,
            action: 'Adjust Schedule',
            tip: 'Early morning irrigation (5–7 AM) minimises evaporation losses.'
        });
    } else if (moisture > 75) {
        recs.push({
            id: 'irr_reduce',
            category: 'Irrigation',
            icon: TrendingDown,
            iconColor: 'text-blue-500',
            iconBg: 'bg-blue-50',
            priority: 'medium',
            title: 'Reduce Irrigation — Soil Saturated',
            reason: `Soil moisture is high at ${moisture}%. Over-irrigation promotes root rot and washes away nutrients. Cut watering by 30%.`,
            action: 'Reduce by 30%',
            tip: 'Well-drained soils absorb 10–20mm/hr. Watch for surface pooling.'
        });
    } else {
        recs.push({
            id: 'irr_ok',
            category: 'Irrigation',
            icon: Droplets,
            iconColor: 'text-green-500',
            iconBg: 'bg-green-50',
            priority: 'low',
            title: 'Irrigation Schedule is Optimal',
            reason: `Soil moisture at ${moisture}% is within the ideal range. Maintain current schedule and monitor daily for changes.`,
            action: 'View Schedule',
            tip: 'Continue monitoring soil moisture — adjust if temp exceeds 35°C.'
        });
    }

    // ── 2. HEAT MANAGEMENT ─────────────────────────────────────────────────
    if (temp >= 38) {
        recs.push({
            id: 'heat_extreme',
            category: 'Heat Management',
            icon: Thermometer,
            iconColor: 'text-red-600',
            iconBg: 'bg-red-50',
            priority: 'high',
            title: 'Extreme Heat — Emergency Crop Protection',
            reason: `Temp at ${temp.toFixed(1)}°C is dangerously high. Risk of crop burn, flower/fruit drop, and accelerated water loss.`,
            action: 'Activate Cooling Mode',
            tip: 'Mist-irrigate between 11 AM–3 PM. Avoid any field operations during peak heat.'
        });
    } else if (temp >= 35 || heatSoon) {
        const heatTemp = heatSoon ? heatSoon.main.temp.toFixed(1) : temp.toFixed(1);
        recs.push({
            id: 'heat_warning',
            category: 'Heat Management',
            icon: Thermometer,
            iconColor: 'text-orange-500',
            iconBg: 'bg-orange-50',
            priority: 'medium',
            title: 'Pre-schedule Early Morning Irrigation',
            reason: `Temp ${heatSoon ? 'forecast to reach' : 'at'} ${heatTemp}°C. Shift irrigation to 5–7 AM to maximise plant uptake before heat peaks.`,
            action: 'Reschedule Irrigation',
            tip: 'Apply 20–25% extra water during heat waves to compensate for evapotranspiration.'
        });
    }

    // ── 3. PEST & DISEASE ──────────────────────────────────────────────────
    if (humidity > 80 && temp > 22) {
        recs.push({
            id: 'pest_fungal',
            category: 'Pest & Disease',
            icon: Bug,
            iconColor: 'text-purple-600',
            iconBg: 'bg-purple-50',
            priority: 'high',
            title: 'High Fungal Disease Risk',
            reason: `Humidity at ${humidity}% combined with ${temp.toFixed(1)}°C creates ideal conditions for blight, mildew, and rust in crops.`,
            action: 'Schedule Fungicide Spray',
            tip: 'Apply copper-based fungicide early morning. Drone spray is most effective at low wind speeds.'
        });
    } else if (humidity > 65 && temp > 25) {
        recs.push({
            id: 'pest_scout',
            category: 'Pest & Disease',
            icon: Bug,
            iconColor: 'text-orange-500',
            iconBg: 'bg-orange-50',
            priority: 'medium',
            title: 'Scout Fields for Early Pest Signs',
            reason: `Current conditions (${humidity}% humidity, ${temp.toFixed(1)}°C) are conducive to aphid and whitefly activity. Early detection is key.`,
            action: 'Schedule Drone Scan',
            tip: 'Pay special attention to leaf undersides and new growth tips.'
        });
    }

    if (temp >= 35 && humidity < 40) {
        recs.push({
            id: 'pest_spider',
            category: 'Pest & Disease',
            icon: Bug,
            iconColor: 'text-red-500',
            iconBg: 'bg-red-50',
            priority: 'medium',
            title: 'Spider Mite Activity Likely',
            reason: `Hot (${temp.toFixed(1)}°C) and dry (${humidity}% humidity) conditions accelerate spider mite reproduction. Check crops now.`,
            action: 'Apply Miticide',
            tip: 'Use neem oil spray (0.5%) as an eco-friendly control option.'
        });
    }

    // ── 4. DRONE MISSION ──────────────────────────────────────────────────
    if (isStorm || stormSoon) {
        recs.push({
            id: 'drone_ground',
            category: 'Drone Mission',
            icon: Plane,
            iconColor: 'text-red-500',
            iconBg: 'bg-red-50',
            priority: 'high',
            title: 'Ground All Drone Missions',
            reason: `${isStorm ? 'Active thunderstorm' : 'Thunderstorm forecast'} — flying drones risks equipment damage and data loss. Do not launch.`,
            action: 'Cancel Missions',
            tip: 'Drones can resume 30 mins after storm clears and wind drops below 7 m/s.'
        });
    } else if (wind > 10) {
        recs.push({
            id: 'drone_wind',
            category: 'Drone Mission',
            icon: Wind,
            iconColor: 'text-orange-500',
            iconBg: 'bg-orange-50',
            priority: 'medium',
            title: 'Delay Drone Launch — High Wind',
            reason: `Wind speed at ${wind.toFixed(1)} m/s exceeds safe drone operation threshold. Precision mapping and spraying accuracy will be compromised.`,
            action: 'Reschedule Mission',
            tip: 'Optimal drone conditions: wind < 7 m/s, visibility > 500m, no precipitation.'
        });
    } else if (rainSoon) {
        const hrs = Math.round((new Date(rainSoon.dt * 1000) - Date.now()) / 3600000);
        recs.push({
            id: 'drone_prerain',
            category: 'Drone Mission',
            icon: Plane,
            iconColor: 'text-blue-500',
            iconBg: 'bg-blue-50',
            priority: 'medium',
            title: `Complete Drone Missions Before Rain (~${hrs}h)`,
            reason: `Rain expected in ~${hrs}h. Complete any pending spray or mapping missions now to avoid postponing for 24–48 hours.`,
            action: 'Launch Mission Now',
            tip: 'Field scanning before rain helps identify drainage issues before they become problems.'
        });
    } else {
        recs.push({
            id: 'drone_ok',
            category: 'Drone Mission',
            icon: Plane,
            iconColor: 'text-green-500',
            iconBg: 'bg-green-50',
            priority: 'low',
            title: 'Conditions Ideal for Drone Operations',
            reason: `Wind at ${wind.toFixed(1)} m/s, clear skies. Perfect window for NDVI scanning and precision spraying missions.`,
            action: 'Launch Mission',
            tip: 'Early morning missions (6–9 AM) yield the best NDVI accuracy due to lower solar angle.'
        });
    }

    // ── 5. WATER SAVINGS ──────────────────────────────────────────────────
    if (humidity < 35) {
        recs.push({
            id: 'water_mulch',
            category: 'Water Conservation',
            icon: IndianRupee,
            iconColor: 'text-green-600',
            iconBg: 'bg-green-50',
            priority: 'medium',
            title: 'Apply Mulch — High Evaporation Risk',
            reason: `Low humidity (${humidity}%) causes soil moisture to evaporate 2–3x faster. Mulching can reduce water consumption by up to 40%.`,
            action: 'Log Mulch Activity',
            tip: 'Apply 5–8 cm of dry straw or crop residue around plant bases.'
        });
    } else {
        recs.push({
            id: 'water_drip',
            category: 'Water Conservation',
            icon: IndianRupee,
            iconColor: 'text-green-600',
            iconBg: 'bg-green-50',
            priority: 'low',
            title: 'Switch to Drip Irrigation for 25% Savings',
            reason: 'Drip irrigation delivers water directly to the root zone, reducing waste from evaporation and runoff compared to flood irrigation.',
            action: 'Calculate Savings',
            tip: 'Under PM Krishi Sinchayee Yojana, drip systems are subsidised up to 55% for small farmers.'
        });
    }

    // ── 6. SEASONAL / CROP (Maharashtra context) ──────────────────────────
    const month = new Date().getMonth() + 1; // 1-12
    let season = '';
    if (month >= 6 && month <= 10)       season = 'kharif';
    else if (month >= 11 || month <= 3)  season = 'rabi';
    else                                  season = 'summer';

    const seasonalRec = {
        kharif: {
            title: 'Kharif Season — Apply Top Dressing',
            reason: 'This is critical vegetative growth stage for paddy, cotton, and soybean. Apply nitrogen top-dressing (Urea 26 kg/ha) to support leafy growth.',
            tip: 'Apply fertiliser 1–2 days after irrigation when soil has good moisture for optimal absorption.'
        },
        rabi: {
            title: 'Rabi Season — Monitor for Wheat Rust',
            reason: 'Rabi wheat and chickpea are susceptible to yellow/stem rust during cool humid periods. Inspect flag leaves weekly.',
            tip: 'If rust detected on >5% leaves, apply Propiconazole 25 EC @ 0.1% immediately.'
        },
        summer: {
            title: 'Summer Crops — Increase Watering Intervals',
            reason: 'Summer vegetables (bitter gourd, okra) need shorter, more frequent irrigation cycles to cope with heat and rapid transpiration.',
            tip: 'Apply light irrigation every alternate day. Avoid watering during peak afternoon heat.'
        }
    }[season];

    recs.push({
        id: 'seasonal',
        category: 'Crop Management',
        icon: Wheat,
        iconColor: 'text-yellow-600',
        iconBg: 'bg-yellow-50',
        priority: 'medium',
        ...seasonalRec,
        action: 'Log Activity',
    });

    return recs;
}

const CATEGORY_ORDER = ['Irrigation', 'Heat Management', 'Pest & Disease', 'Drone Mission', 'Water Conservation', 'Crop Management'];

export default function Recommendations() {
    const { user } = useAuth();
    const [recs, setRecs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [dismissed, setDismissed] = useState(new Set());
    const [weather, setWeather] = useState(null);

    const fetchData = async () => {
        try {
            const [wRes, fRes] = await Promise.all([
                fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric`),
                fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric`),
            ]);
            const w = await wRes.json();
            const f = await fRes.json();
            setWeather(w);

            // Fetch soil moisture from Supabase
            let moisture = 45;
            const { data } = await supabase
                .from('sensor_data')
                .select('moisture')
                .eq('farmer_id', 'GLOBAL_AI_SEED')
                .order('created_at', { ascending: false })
                .limit(1);
            if (data && data.length > 0 && data[0].moisture) moisture = data[0].moisture;

            setRecs(generateRecommendations(w, f, moisture));
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Recommendations fetch failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [user]);

    const handleRefresh = async () => {
        setRefreshing(true);
        setDismissed(new Set());
        await fetchData();
        setTimeout(() => setRefreshing(false), 800);
        toast.success('Recommendations updated!');
    };

    const dismiss = (id) => {
        setDismissed(prev => new Set([...prev, id]));
        toast.success('Recommendation dismissed');
    };

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
                    <h1 className="text-2xl font-bold text-nature-900 tracking-tight">AI Recommendations</h1>
                    <p className="text-nature-500 mt-1 text-sm">
                        Actionable insights generated from live weather & soil data for your farm.
                    </p>
                    {lastUpdated && (
                        <p className="text-[11px] text-nature-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Updated: {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            {weather && (
                                <span className="ml-2 text-nature-400">
                                    · {weather.main?.temp?.toFixed(1)}°C, {weather.main?.humidity}% RH, Wind {weather.wind?.speed?.toFixed(1)} m/s
                                </span>
                            )}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-nature-500 font-medium bg-nature-100 px-2 py-1 rounded-full">
                        {visible.length} active recommendation{visible.length !== 1 ? 's' : ''}
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
                    <p className="text-lg font-bold text-nature-700">All Recommendations Cleared</p>
                    <p className="text-sm text-nature-400">Click Refresh to generate new insights from current conditions.</p>
                    <button onClick={handleRefresh} className="mt-2 flex items-center gap-1.5 text-sm font-medium text-earth-600 hover:underline cursor-pointer">
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh now
                    </button>
                </div>
            )}

            {/* Cards */}
            {!loading && sorted.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {sorted.map(rec => {
                        const p = PRIORITY_STYLE[rec.priority];
                        const Icon = rec.icon;
                        return (
                            <div
                                key={rec.id}
                                className="bg-white rounded-2xl border border-nature-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
                            >
                                {/* Top bar */}
                                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-nature-100">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-9 h-9 rounded-xl ${rec.iconBg} flex items-center justify-center`}>
                                            <Icon className={`w-5 h-5 ${rec.iconColor}`} />
                                        </div>
                                        <span className="text-xs font-bold text-nature-500 uppercase tracking-wider">{rec.category}</span>
                                    </div>
                                    <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${p.bg} ${p.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`}></span>
                                        {p.label}
                                    </span>
                                </div>

                                {/* Body */}
                                <div className="flex-1 flex flex-col px-5 py-4 gap-3">
                                    <h3 className="font-bold text-nature-900 text-base leading-snug">{rec.title}</h3>
                                    <p className="text-nature-600 text-sm leading-relaxed">{rec.reason}</p>

                                    {/* Tip */}
                                    <div className="flex items-start gap-2 bg-nature-50 rounded-lg px-3 py-2 border border-nature-100">
                                        <Leaf className="w-3.5 h-3.5 text-earth-500 mt-0.5 shrink-0" />
                                        <p className="text-[11px] text-nature-600 leading-relaxed">{rec.tip}</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-auto pt-1">
                                        <button
                                            onClick={() => toast.success(`Action: ${rec.action}`)}
                                            className="flex-1 bg-earth-600 hover:bg-earth-700 active:scale-95 text-white text-sm font-bold py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                                        >
                                            {rec.action}
                                        </button>
                                        <button
                                            onClick={() => dismiss(rec.id)}
                                            className="px-3 py-2 text-nature-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer text-xs font-medium border border-nature-200 hover:border-red-200"
                                            title="Dismiss"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Source note */}
            {!loading && (
                <p className="text-center text-[11px] text-nature-400 pt-2 border-t border-nature-100">
                    ⚡ Powered by OpenWeatherMap + Supabase sensor data · Pune, Maharashtra
                </p>
            )}
        </div>
    );
}
