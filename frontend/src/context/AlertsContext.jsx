import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Cloud, CloudRain, Thermometer, Wind, Zap, Droplets, Sun } from 'lucide-react';

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

    // ── Good conditions ────────────────────────────────────────────────────
    if (alerts.length === 0) {
        alerts.push({
            id: 'all_clear',
            type: 'success',
            title: 'All Clear — Ideal Conditions',
            msg: `Temperature ${temp?.toFixed(1) ?? '--'}°C, Humidity ${humidity ?? '--'}%, Wind ${windSpeed?.toFixed(1) ?? '--'} m/s. Conditions are optimal for farming operations.`,
            time: now,
            icon: 'sun',
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-200',
        });
    }

    return alerts;
}

export function AlertsProvider({ children }) {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchAndGenerate = useCallback(async () => {
        try {
            const [currentRes, forecastRes] = await Promise.all([
                fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric`),
                fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric`),
            ]);
            const current = await currentRes.json();
            const forecast = await forecastRes.json();

            const generated = generateAlerts(current, forecast);
            setAlerts(generated);
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
        <AlertsContext.Provider value={{ alerts, unreadCount, loading, lastUpdated, markAllRead, refresh: fetchAndGenerate }}>
            {children}
        </AlertsContext.Provider>
    );
}

export function useAlerts() {
    const ctx = useContext(AlertsContext);
    if (!ctx) throw new Error('useAlerts must be used within AlertsProvider');
    return ctx;
}
