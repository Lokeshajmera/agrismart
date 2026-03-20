import React, { useState, useEffect } from 'react';
import {
    Droplets, Thermometer, Bug, Plane, CloudRain, Wind,
    Wheat, IndianRupee, RefreshCw, CheckCircle,
    Clock, TrendingDown, Leaf, Sparkles
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const WEATHER_API_KEY = 'e5c8c35726d52c53ed66735380eae2e9';
const CITY = 'Pune';

const PRIORITY_STYLE = {
    high:   { label: 'High Priority',   bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
    medium: { label: 'Medium Priority', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
    low:    { label: 'Low Priority',    bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
};

function generateRecommendations(weather, forecast, soilMoisture) {
    const recs = [];
    const temp      = weather?.main?.temp       ?? 28;
    const humidity  = weather?.main?.humidity   ?? 60;
    const wind      = weather?.wind?.speed      ?? 5;
    const weatherId = weather?.weather?.[0]?.id ?? 800;

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
            id: 'irr_pause', category: 'Irrigation',
            icon: Droplets, iconColor: 'text-blue-500', iconBg: 'bg-blue-50', priority: 'high',
            title: 'Pause All Irrigation Immediately',
            reason: `Active ${isStorm ? 'thunderstorm' : 'rainfall'} detected. Running irrigation now wastes water and risks waterlogging root zones.`,
            tip: 'Resume once rainfall totals are known and soil absorption is assessed.'
        });
    } else if (rainSoon) {
        const hrs = Math.round((new Date(rainSoon.dt * 1000) - Date.now()) / 3600000);
        recs.push({
            id: 'irr_reduce_rain', category: 'Irrigation',
            icon: CloudRain, iconColor: 'text-blue-500', iconBg: 'bg-blue-50', priority: 'high',
            title: `Suspend Irrigation — Rain Expected in ~${hrs}h`,
            reason: `Forecast shows rainfall in ~${hrs} hours. Irrigating now could cause overwatering and nutrient runoff.`,
            tip: 'Reassess soil moisture after the rain event before resuming your schedule.'
        });
    } else if (moisture < 25) {
        recs.push({
            id: 'irr_urgent', category: 'Irrigation',
            icon: Droplets, iconColor: 'text-red-500', iconBg: 'bg-red-50', priority: 'high',
            title: 'Urgent: Increase Irrigation — Critically Low Moisture',
            reason: `Soil moisture is critically low at ${moisture}%. Crops are at immediate risk of wilting and yield loss.`,
            tip: 'Target 45–60% soil moisture. Irrigate during early morning (5–7 AM) to minimise evaporation.'
        });
    } else if (moisture < 40) {
        recs.push({
            id: 'irr_increase', category: 'Irrigation',
            icon: Droplets, iconColor: 'text-orange-500', iconBg: 'bg-orange-50', priority: 'medium',
            title: 'Increase Irrigation Frequency',
            reason: `Soil moisture at ${moisture}% is below the optimal range (40–65%). Consider increasing watering cycles by 15–20 minutes.`,
            tip: 'Early morning irrigation (5–7 AM) minimises evaporation losses and maximises plant uptake.'
        });
    } else if (moisture > 75) {
        recs.push({
            id: 'irr_reduce', category: 'Irrigation',
            icon: TrendingDown, iconColor: 'text-blue-500', iconBg: 'bg-blue-50', priority: 'medium',
            title: 'Reduce Irrigation — Soil is Saturated',
            reason: `Soil moisture is high at ${moisture}%. Over-irrigation promotes root rot and washes away nutrients. Reduce watering by ~30%.`,
            tip: 'Well-drained soils absorb 10–20mm/hr. Watch for surface pooling as a sign of over-watering.'
        });
    } else {
        recs.push({
            id: 'irr_ok', category: 'Irrigation',
            icon: Droplets, iconColor: 'text-green-500', iconBg: 'bg-green-50', priority: 'low',
            title: 'Irrigation Schedule is Optimal',
            reason: `Soil moisture at ${moisture}% is within the ideal range (40–65%). Maintain your current watering schedule.`,
            tip: 'Continue monitoring daily — adjust if temperature exceeds 35°C or moisture drops below 40%.'
        });
    }

    // ── 2. HEAT MANAGEMENT ─────────────────────────────────────────────────
    if (temp >= 38) {
        recs.push({
            id: 'heat_extreme', category: 'Heat Management',
            icon: Thermometer, iconColor: 'text-red-600', iconBg: 'bg-red-50', priority: 'high',
            title: 'Extreme Heat — Emergency Crop Protection Needed',
            reason: `Temperature is dangerously high at ${temp.toFixed(1)}°C. Risk of crop burn, flower drop, and accelerated water loss from soil.`,
            tip: 'Avoid all field operations between 11 AM–3 PM. Light irrigation at midday can help cool the crop canopy.'
        });
    } else if (temp >= 35 || heatSoon) {
        const heatTemp = heatSoon ? heatSoon.main.temp.toFixed(1) : temp.toFixed(1);
        recs.push({
            id: 'heat_warning', category: 'Heat Management',
            icon: Thermometer, iconColor: 'text-orange-500', iconBg: 'bg-orange-50', priority: 'medium',
            title: 'Schedule Early Morning Irrigation for Heat Wave',
            reason: `Temperature ${heatSoon ? 'forecast to reach' : 'at'} ${heatTemp}°C. Shift irrigation to 5–7 AM to maximise plant uptake before heat peaks.`,
            tip: 'During heat waves, plants need 20–25% more water to compensate for high evapotranspiration rates.'
        });
    }

    // ── 3. PEST & DISEASE ──────────────────────────────────────────────────
    if (humidity > 80 && temp > 22) {
        recs.push({
            id: 'pest_fungal', category: 'Pest & Disease',
            icon: Bug, iconColor: 'text-purple-600', iconBg: 'bg-purple-50', priority: 'high',
            title: 'High Fungal Disease Risk — Act Now',
            reason: `Humidity at ${humidity}% combined with ${temp.toFixed(1)}°C creates ideal conditions for blight, mildew, and rust in crops.`,
            tip: 'Apply copper-based fungicide in early morning hours. Drone spray provides most even coverage at low wind conditions.'
        });
    } else if (humidity > 65 && temp > 25) {
        recs.push({
            id: 'pest_scout', category: 'Pest & Disease',
            icon: Bug, iconColor: 'text-orange-500', iconBg: 'bg-orange-50', priority: 'medium',
            title: 'Scout Fields for Early Pest Activity',
            reason: `Current conditions (${humidity}% humidity, ${temp.toFixed(1)}°C) favour aphid and whitefly activity. Early detection prevents large infestations.`,
            tip: 'Pay special attention to leaf undersides and new growth tips during your field walk.'
        });
    }

    if (temp >= 35 && humidity < 40) {
        recs.push({
            id: 'pest_spider', category: 'Pest & Disease',
            icon: Bug, iconColor: 'text-red-500', iconBg: 'bg-red-50', priority: 'medium',
            title: 'Spider Mite Activity Likely in Dry Heat',
            reason: `Hot (${temp.toFixed(1)}°C) and dry (${humidity}% humidity) conditions accelerate spider mite reproduction. Inspect crops immediately.`,
            tip: 'Neem oil spray (0.5%) is an effective eco-friendly option. Focus on the underside of lower leaves.'
        });
    }

    // ── 4. DRONE MISSION ──────────────────────────────────────────────────
    if (isStorm || stormSoon) {
        recs.push({
            id: 'drone_ground', category: 'Drone Mission',
            icon: Plane, iconColor: 'text-red-500', iconBg: 'bg-red-50', priority: 'high',
            title: 'Ground All Drone Missions — Storm Warning',
            reason: `${isStorm ? 'Active thunderstorm' : 'Thunderstorm forecast soon'} — flying drones risks equipment damage and loss of data.`,
            tip: 'Drones can resume 30 minutes after storm clears and wind drops below 7 m/s.'
        });
    } else if (wind > 10) {
        recs.push({
            id: 'drone_wind', category: 'Drone Mission',
            icon: Wind, iconColor: 'text-orange-500', iconBg: 'bg-orange-50', priority: 'medium',
            title: 'Delay Drone Launch — Wind Speed Too High',
            reason: `Wind at ${wind.toFixed(1)} m/s exceeds safe operation threshold (7 m/s). Mapping accuracy and spray precision will be compromised.`,
            tip: 'Optimal drone conditions: wind < 7 m/s, clean visibility, no precipitation.'
        });
    } else if (rainSoon) {
        const hrs = Math.round((new Date(rainSoon.dt * 1000) - Date.now()) / 3600000);
        recs.push({
            id: 'drone_prerain', category: 'Drone Mission',
            icon: Plane, iconColor: 'text-blue-500', iconBg: 'bg-blue-50', priority: 'medium',
            title: `Complete Drone Missions Before Rain (~${hrs}h away)`,
            reason: `Rain expected in ~${hrs}h. Complete any pending spray or NDVI mapping missions now to avoid a 24–48h delay.`,
            tip: 'Pre-rain field scanning helps identify drainage problem areas before they become issues.'
        });
    } else {
        recs.push({
            id: 'drone_ok', category: 'Drone Mission',
            icon: Plane, iconColor: 'text-green-500', iconBg: 'bg-green-50', priority: 'low',
            title: 'Good Window for Drone Operations',
            reason: `Wind at ${wind.toFixed(1)} m/s and clear conditions provide a good flight window for NDVI scanning and field surveys.`,
            tip: 'Early morning missions (6–9 AM) yield the best NDVI accuracy due to lower solar angle and calmer air.'
        });
    }

    // ── 5. WATER CONSERVATION ─────────────────────────────────────────────
    if (humidity < 35) {
        recs.push({
            id: 'water_mulch', category: 'Water Conservation',
            icon: IndianRupee, iconColor: 'text-green-600', iconBg: 'bg-green-50', priority: 'medium',
            title: 'Apply Mulch to Prevent Moisture Loss',
            reason: `Low humidity at ${humidity}% causes soil moisture to evaporate 2–3× faster than normal. Mulching can cut water needs by up to 40%.`,
            tip: 'Apply 5–8 cm of dry straw or crop residue around plant bases for best effect.'
        });
    } else {
        recs.push({
            id: 'water_save', category: 'Water Conservation',
            icon: IndianRupee, iconColor: 'text-green-600', iconBg: 'bg-green-50', priority: 'low',
            title: 'Optimise Irrigation Timing for Water Savings',
            reason: 'Irrigating during early morning (before 8 AM) instead of afternoon can reduce water evaporation losses by 20–30%.',
            tip: 'Under PM Krishi Sinchayee Yojana, irrigation efficiency equipment is subsidised up to 55% for small farmers.'
        });
    }

    // ── 6. SEASONAL CROP MANAGEMENT (Maharashtra) ─────────────────────────
    const month = new Date().getMonth() + 1;
    let season = month >= 6 && month <= 10 ? 'kharif' : (month >= 11 || month <= 3 ? 'rabi' : 'summer');

    const seasonal = {
        kharif: {
            title: 'Kharif Season — Apply Nitrogen Top Dressing',
            reason: 'This is the critical vegetative growth stage for paddy, cotton, and soybean. A nitrogen top-dressing (Urea ~26 kg/ha) supports leafy growth and yield.',
            tip: 'Apply fertiliser 1–2 days after irrigation when soil has good moisture for optimal absorption.'
        },
        rabi: {
            title: 'Rabi Season — Monitor for Wheat Rust',
            reason: 'Rabi wheat and chickpea are susceptible to yellow and stem rust during cool humid periods. Inspect flag leaves weekly.',
            tip: 'If rust is found on >5% of leaves, apply Propiconazole 25 EC @ 0.1% immediately.'
        },
        summer: {
            title: 'Summer Crops — Increase Watering Frequency',
            reason: 'Summer vegetables (bitter gourd, okra) need shorter, more frequent irrigation cycles to cope with heat and rapid transpiration.',
            tip: 'Light irrigation every alternate day is better than heavy watering every 3–4 days in summer.'
        }
    }[season];

    recs.push({
        id: 'seasonal', category: 'Crop Management',
        icon: Wheat, iconColor: 'text-yellow-600', iconBg: 'bg-yellow-50', priority: 'medium',
        ...seasonal
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
                                            className="text-nature-300 hover:text-nature-500 transition-colors cursor-pointer text-lg leading-none"
                                            title="Dismiss"
                                        >
                                            ×
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
