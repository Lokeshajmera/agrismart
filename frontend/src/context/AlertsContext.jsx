import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Cloud, CloudRain, Thermometer, Wind, Zap, Droplets, Sun, TrendingDown, Bug, Plane, IndianRupee, Wheat, Leaf } from 'lucide-react';
import { supabase } from '../supabaseClient';

const WEATHER_API_KEY = 'e5c8c35726d52c53ed66735380eae2e9';
const CITY = 'Pune';
const POLL_INTERVAL = 10 * 60 * 1000; // 10 minutes

const AlertsContext = createContext(null);

function generateAlerts(current, forecast) {
    const alerts = [];
    const now = new Date();

    const temp = current?.main?.temp;
    const humidity = current?.main?.humidity;
    const windSpeed = current?.wind?.speed;
    const weatherId = current?.weather?.[0]?.id;
    const weatherDesc = current?.weather?.[0]?.description || '';

    // ── Current condition alerts ───────────────────────────────────────────
    if (temp >= 38) {
        alerts.push({
            id: 'heat_extreme',
            type: 'critical',
            title: 'Extreme Heat Wave Alert',
            msg: `Current temperature is ${temp.toFixed(1)}°C. Severe heat stress risk for crops. Increase irrigation immediately and consider shading.`,
            time: now,
            icon: 'thermometer',
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-200',
        });
    } else if (temp >= 35) {
        alerts.push({
            id: 'heat_high',
            type: 'warning',
            title: 'Heat Wave Warning',
            msg: `Temperature has reached ${temp.toFixed(1)}°C. Monitor crop health closely and ensure adequate irrigation.`,
            time: now,
            icon: 'thermometer',
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            border: 'border-orange-200',
        });
    }

    if (humidity < 25) {
        alerts.push({
            id: 'drought_risk',
            type: 'critical',
            title: 'Drought Risk — Very Low Humidity',
            msg: `Humidity is critically low at ${humidity}%. Soil moisture will deplete rapidly. Activate drip irrigation now.`,
            time: now,
            icon: 'droplets',
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-200',
        });
    } else if (humidity < 40) {
        alerts.push({
            id: 'low_humidity',
            type: 'warning',
            title: 'Low Humidity Warning',
            msg: `Humidity is ${humidity}%. Consider increasing watering frequency to prevent moisture stress.`,
            time: now,
            icon: 'droplets',
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            border: 'border-orange-200',
        });
    }

    if (windSpeed > 15) {
        alerts.push({
            id: 'strong_wind',
            type: 'critical',
            title: 'Strong Wind Alert',
            msg: `Wind speed is ${windSpeed.toFixed(1)} m/s. Risk of crop damage and uneven irrigation. Pause overhead sprinklers.`,
            time: now,
            icon: 'wind',
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-200',
        });
    } else if (windSpeed > 10) {
        alerts.push({
            id: 'moderate_wind',
            type: 'warning',
            title: 'Moderate Wind Warning',
            msg: `Wind speed at ${windSpeed.toFixed(1)} m/s. Sprinkler efficiency may be reduced. Switch to drip irrigation if possible.`,
            time: now,
            icon: 'wind',
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            border: 'border-orange-200',
        });
    }

    if (weatherId >= 200 && weatherId <= 232) {
        alerts.push({
            id: 'thunderstorm',
            type: 'critical',
            title: 'Thunderstorm Warning',
            msg: `${weatherDesc.charAt(0).toUpperCase() + weatherDesc.slice(1)} detected. Ground all drone missions immediately and secure equipment.`,
            time: now,
            icon: 'zap',
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-200',
        });
    } else if (weatherId >= 300 && weatherId <= 321) {
        alerts.push({
            id: 'drizzle',
            type: 'info',
            title: 'Drizzle / Light Rain',
            msg: 'Light drizzle detected. Consider pausing scheduled irrigation to avoid waterlogging.',
            time: now,
            icon: 'rain',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
        });
    } else if (weatherId >= 500 && weatherId <= 531) {
        alerts.push({
            id: 'rain',
            type: 'info',
            title: 'Active Rainfall',
            msg: `${weatherDesc.charAt(0).toUpperCase() + weatherDesc.slice(1)} — Auto-irrigation paused to prevent waterlogging. Drainage check recommended.`,
            time: now,
            icon: 'rain',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
        });
    }

    // ── Forecast-based alerts (next 24–36h) ───────────────────────────────
    if (forecast?.list) {
        const next36h = forecast.list.slice(0, 12); // each step = 3h

        const rainExpected = next36h.find(item =>
            item.weather?.[0]?.id >= 300 && item.weather?.[0]?.id <= 531
        );
        const heatExpected = next36h.find(item => item.main?.temp >= 35);
        const stormExpected = next36h.find(item =>
            item.weather?.[0]?.id >= 200 && item.weather?.[0]?.id <= 232
        );

        if (rainExpected && !(weatherId >= 300 && weatherId <= 531)) {
            const rainTime = new Date(rainExpected.dt * 1000);
            const hoursAway = Math.round((rainTime - now) / 3600000);
            alerts.push({
                id: 'forecast_rain',
                type: 'info',
                title: `Rain Expected in ~${hoursAway}h`,
                msg: `Weather forecast shows ${rainExpected.weather[0].description} around ${rainTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Prepare fields and pause irrigation beforehand.`,
                time: now,
                icon: 'rain',
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                border: 'border-blue-200',
            });
        }

        if (heatExpected && temp < 35) {
            const heatTime = new Date(heatExpected.dt * 1000);
            const hoursAway = Math.round((heatTime - now) / 3600000);
            alerts.push({
                id: 'forecast_heat',
                type: 'warning',
                title: `Heat Wave Forecast in ~${hoursAway}h`,
                msg: `Temperature expected to reach ${heatExpected.main.temp.toFixed(1)}°C around ${heatTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Pre-schedule morning irrigation.`,
                time: now,
                icon: 'thermometer',
                color: 'text-orange-600',
                bg: 'bg-orange-50',
                border: 'border-orange-200',
            });
        }

        if (stormExpected && !(weatherId >= 200 && weatherId <= 232)) {
            const stormTime = new Date(stormExpected.dt * 1000);
            const hoursAway = Math.round((stormTime - now) / 3600000);
            alerts.push({
                id: 'forecast_storm',
                type: 'critical',
                title: `Thunderstorm Forecast in ~${hoursAway}h`,
                msg: `Thunderstorm expected around ${stormTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Schedule drone missions before then, secure equipment.`,
                time: now,
                icon: 'zap',
                color: 'text-red-600',
                bg: 'bg-red-50',
                border: 'border-red-200',
            });
        }
    }

    return alerts;
}

function generateRecommendations(weather, forecast, soilMoisture) {
    const recs = [];
    const temp = weather?.main?.temp ?? 28;
    const humidity = weather?.main?.humidity ?? 60;
    const wind = weather?.wind?.speed ?? 5;
    const weatherId = weather?.weather?.[0]?.id ?? 800;

    const next36h = forecast?.list?.slice(0, 12) ?? [];
    const rainSoon = next36h.find(i => i.weather?.[0]?.id >= 300 && i.weather?.[0]?.id <= 531);
    const heatSoon = next36h.find(i => i.main?.temp >= 35);
    const stormSoon = next36h.find(i => i.weather?.[0]?.id >= 200 && i.weather?.[0]?.id <= 232);
    const isRaining = weatherId >= 300 && weatherId <= 531;
    const isStorm = weatherId >= 200 && weatherId <= 232;
    const moisture = soilMoisture ?? 45;

    // ── 0. GENERAL FARMING CONDITIONS ──────────────────────────────────────
    if (!isStorm && temp < 35 && temp > 15 && wind < 10) {
        recs.push({
            id: 'general_optimal', category: 'General',
            icon: Leaf, iconColor: 'text-green-600', iconBg: 'bg-green-50', priority: 'low',
            title: 'Suitable Farming Conditions',
            reason: `Current weather (${temp.toFixed(1)}°C) and environment are highly suitable for all general farming operations.`,
            tip: 'Excellent time for sowing, manual harvesting, or field walk.'
        });
    }

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

export function AlertsProvider({ children }) {
    const [alerts, setAlerts] = useState([]);
    const [recs, setRecs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [weatherData, setWeatherData] = useState(null);

    const fetchAndGenerate = useCallback(async () => {
        try {
            const [currentRes, forecastRes] = await Promise.all([
                fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric`),
                fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric`),
            ]);
            const current = await currentRes.json();
            const forecast = await forecastRes.json();
            setWeatherData(current);

            // Fetch soil moisture
            let moisture = 45;
            const { data } = await supabase
                .from('sensor_data')
                .select('soil1, soil2, soil3, soil4')
                .eq('farmer_id', 'GLOBAL_AI_SEED')
                .order('created_at', { ascending: false })
                .limit(1);

            if (data && data.length > 0) {
                const s = data[0];
                let mSum = 0, mCount = 0;
                [s.soil1, s.soil2, s.soil3, s.soil4].forEach(v => {
                    if (v != null) { mSum += v; mCount++; }
                });
                if (mCount > 0) moisture = Math.round(mSum / mCount);
            }

            setAlerts(generateAlerts(current, forecast));
            setRecs(generateRecommendations(current, forecast, moisture));
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Alerts fetch failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAndGenerate();
        const interval = setInterval(fetchAndGenerate, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchAndGenerate]);

    const markAllRead = useCallback(() => {
        setAlerts([]);
    }, []);

    const unreadCount = alerts.length;

    return (
        <AlertsContext.Provider value={{ alerts, recs, weatherData, unreadCount, loading, lastUpdated, markAllRead, refresh: fetchAndGenerate }}>
            {children}
        </AlertsContext.Provider>
    );
}

export function useAlerts() {
    const ctx = useContext(AlertsContext);
    if (!ctx) throw new Error('useAlerts must be used within AlertsProvider');
    return ctx;
}
