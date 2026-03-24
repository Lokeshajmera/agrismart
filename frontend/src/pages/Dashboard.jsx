import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CloudSun, Droplets, MapPin, AlertTriangle, Bug, Navigation,
  ChevronDown, Wind, Map as MapIcon, Plane, ThermometerSun, Leaf, Info,
  CheckCircle2, AlertCircle, ArrowRight, ChevronRight, ShieldAlert, CloudRain, Settings,
  Wheat, IndianRupee, Activity
} from 'lucide-react';

import { MapContainer, TileLayer, Polygon, Marker, useMap, Popup, Circle, ImageOverlay } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom || 15, { animate: false });
    }
  }, [center, map, zoom]);
  return null;
}

const CircularProgress = ({ value, label, subLabel, color, size = 120, strokeWidth = 8, bgColor = '#e1efe6' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90 overflow-visible">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={bgColor} strokeWidth={strokeWidth} fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center px-1 w-full">
        <span className="text-xl font-bold text-nature-900 dark:text-white leading-none">{value}%</span>
        {label && <span className="text-[9px] text-nature-500 dark:text-white uppercase tracking-tighter mt-1 leading-tight break-words w-full">{label}</span>}
        {subLabel && <span className="text-[9px] text-nature-400 dark:text-white mt-0.5">{subLabel}</span>}
      </div>
    </div>
  );
};

import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import { useOfflineStore } from '../store/useOfflineStore';
import { useAlerts } from '../context/AlertsContext';
import { Sprout } from 'lucide-react'; // needed for fallback UX

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState({ name: 'Farmer', farmer_id: '---', district: 'Pune', state: 'Maharashtra' });
  const [farmSetup, setFarmSetup] = useState(null);
  const [setupLoading, setSetupLoading] = useState(true);
  const [showSoilInfo, setShowSoilInfo] = useState(false);
  const { isOnline } = useOfflineStore();
  const { alerts, recs = [] } = useAlerts();

  useEffect(() => {
    const fetchBaseData = async () => {
      if (user) {
        setSetupLoading(true);
        try {
          const [profileRes, setupRes] = await Promise.all([
            supabase.from('users').select('name, farmer_id, district, state').eq('id', user.id).single(),
            supabase.from('farm_setup').select('*').eq('user_id', user.id).single()
          ]);

          if (!profileRes.error && profileRes.data) setProfile(profileRes.data);
          if (!setupRes.error && setupRes.data) setFarmSetup(setupRes.data);
        } catch (err) {
          console.error(err);
        } finally {
          setSetupLoading(false);
        }
      }
    };
    fetchBaseData();
  }, [user]);

  const [liveData, setLiveData] = useState({
    temp: 26.0,
    moisture: 31,
    irrigationUsage: 78,
    humidity: 68,
    wind: 11.1,
    soilTemp: 23,
    ph: 6.2,
    area1Moisture: 31,
    area2Moisture: 31
  });

  const [satelliteData, setSatelliteData] = useState(null);
  const [activeSatelliteLayer, setActiveSatelliteLayer] = useState('ndvi');
  const [isAnalyzing, setIsAnalyzing] = useState(false);



  const calculateAreaAverages = (latest, setup) => {
    const soilVals = [latest.soil1, latest.soil2, latest.soil3, latest.soil4];

    let a1Sum = 0, a1Count = 0;
    for (let i = 0; i < setup.area1_sensors; i++) {
      if (soilVals[i] != null) { a1Sum += soilVals[i]; a1Count++; }
    }
    const a1Moisture = a1Count > 0 ? Math.round(a1Sum / a1Count) : 0;

    let a2Sum = 0, a2Count = 0;
    const startIdx = setup.area1_sensors;
    for (let i = 0; i < setup.area2_sensors; i++) {
      if (soilVals[startIdx + i] != null) { a2Sum += soilVals[startIdx + i]; a2Count++; }
    }
    const a2Moisture = a2Count > 0 ? Math.round(a2Sum / a2Count) : 0;

    return { a1Moisture, a2Moisture };
  };

  // 1. Fetch Real Weather Data (Temp, Humidity, Wind)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const API_KEY = "e5c8c35726d52c53ed66735380eae2e9";
        const queryLoc = farmSetup?.district || profile.district || 'Pune';
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${queryLoc}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.main) {
          let aqi = 50; // Default Good
          if (data.coord) {
            try {
              const aqiRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${data.coord.lat}&lon=${data.coord.lon}&appid=${API_KEY}`);
              const aqiData = await aqiRes.json();

              if (aqiData?.list?.[0]?.components?.pm2_5 !== undefined) {
                const pm25 = aqiData.list[0].components.pm2_5;
                // standard US EPA PM2.5 to AQI conversion
                if (pm25 <= 12.0) aqi = Math.round((50 / 12.0) * pm25);
                else if (pm25 <= 35.4) aqi = Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
                else if (pm25 <= 55.4) aqi = Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
                else if (pm25 <= 150.4) aqi = Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
                else if (pm25 <= 250.4) aqi = Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
                else if (pm25 <= 350.4) aqi = Math.round(((400 - 301) / (350.4 - 250.5)) * (pm25 - 250.5) + 301);
                else aqi = Math.round(((500 - 401) / (500.4 - 350.5)) * (pm25 - 350.5) + 401);
              } else if (aqiData?.list?.[0]?.main?.aqi) {
                // fallback to euro scale mult
                aqi = aqiData.list[0].main.aqi * 20;
              }
            } catch (e) { }
          }

          setLiveData(prev => ({
            ...prev,
            temp: Math.round(data.main.temp),
            humidity: data.main.humidity,
            wind: data.wind.speed,
            soilTemp: Math.round(data.main.temp - 2), // Approximate soil temp
            lat: data.coord?.lat,
            lon: data.coord?.lon,
            aqi: aqi
          }));
        }
      } catch (err) {
        console.error("Weather sync failed:", err);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 300000); // Poll every 5 mins
    return () => clearInterval(interval);
  }, [profile.district, farmSetup?.district]);

  // 2. Fetch Real Sensor Data — rolling daily avg moisture + latest live values
  useEffect(() => {
    const fetchTelemetry = async () => {
      if (!user) return;

      // Get last 7 days of data for rolling average
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: allRows } = await supabase
        .from('sensor_data')
        .select('soil1, soil2, soil3, soil4, hum1, hum2, irrigation1, irrigation2, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (!allRows || allRows.length === 0) return;

      // Latest row for real-time zone status & individual sensor values
      const latest = allRows[0];
      const sHumidity = (latest.hum1 != null || latest.hum2 != null)
        ? Math.round(([latest.hum1, latest.hum2].filter(v => v != null).reduce((a, b) => a + b, 0)) / [latest.hum1, latest.hum2].filter(v => v != null).length)
        : null;

      // ── Group readings by calendar day ──
      const dayMap = {};
      allRows.forEach(row => {
        const dayKey = row.created_at.slice(0, 10); // "YYYY-MM-DD"
        if (!dayMap[dayKey]) dayMap[dayKey] = [];
        dayMap[dayKey].push(row);
      });

      // ── Compute per-day average across all 4 soil sensors ──
      const dailyAvgs = [];
      const dailyA1Avgs = [];
      const dailyA2Avgs = [];
      const dailyHumidityAvgs = [];

      Object.keys(dayMap).forEach(day => {
        const rows = dayMap[day];
        let totalSum = 0, totalCount = 0;
        let a1Sum = 0, a1Count = 0;
        let a2Sum = 0, a2Count = 0;
        let hSum = 0, hCount = 0;

        rows.forEach(r => {
          [r.soil1, r.soil2, r.soil3, r.soil4].forEach(v => {
            if (v != null) { totalSum += v; totalCount++; }
          });
          // Area 1 = soil1 + soil2, Area 2 = soil3 + soil4
          [r.soil1, r.soil2].forEach(v => { if (v != null) { a1Sum += v; a1Count++; } });
          [r.soil3, r.soil4].forEach(v => { if (v != null) { a2Sum += v; a2Count++; } });
          [r.hum1, r.hum2].forEach(v => { if (v != null) { hSum += v; hCount++; } });
        });

        if (totalCount > 0) dailyAvgs.push(totalSum / totalCount);
        if (a1Count > 0) dailyA1Avgs.push(a1Sum / a1Count);
        if (a2Count > 0) dailyA2Avgs.push(a2Sum / a2Count);
        if (hCount > 0) dailyHumidityAvgs.push(hSum / hCount);
      });

      // ── Rolling average = average of all daily averages ──
      const rollingMoisture = dailyAvgs.length > 0
        ? Math.round(dailyAvgs.reduce((s, v) => s + v, 0) / dailyAvgs.length)
        : 0;
      const rollingA1 = dailyA1Avgs.length > 0
        ? Math.round(dailyA1Avgs.reduce((s, v) => s + v, 0) / dailyA1Avgs.length)
        : 0;
      const rollingA2 = dailyA2Avgs.length > 0
        ? Math.round(dailyA2Avgs.reduce((s, v) => s + v, 0) / dailyA2Avgs.length)
        : 0;
      const rollingHumidity = dailyHumidityAvgs.length > 0
        ? Math.round(dailyHumidityAvgs.reduce((s, v) => s + v, 0) / dailyHumidityAvgs.length)
        : null;

      setLiveData(prev => ({
        ...prev,
        moisture: rollingMoisture,
        ph: 6.5,
        sensorHumidity: rollingHumidity || sHumidity || prev.sensorHumidity,
        area1Moisture: rollingA1,
        area2Moisture: rollingA2,
        avg1: rollingA1,
        avg2: rollingA2,
        s1: latest.soil1,
        s2: latest.soil2,
        s3: latest.soil3,
        s4: latest.soil4,
        dispIrr1: latest.irrigation1 || false,
        dispIrr2: latest.irrigation2 || false,
        totalReadings: allRows.length,
        daysOfData: Object.keys(dayMap).length
      }));
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [user, farmSetup]);

  // Auto-trigger satellite analysis on load
  useEffect(() => {
    if (farmSetup && activeSatelliteLayer) {
      handleSatelliteAnalyze(activeSatelliteLayer);
    }
  }, [farmSetup]);


  const handleSatelliteAnalyze = async (type) => {
    if (!farmSetup?.coordinates || farmSetup.coordinates.length < 3) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch('http://localhost:5001/api/satellite/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates: farmSetup.coordinates, type })
      });
      const data = await response.json();
      setSatelliteData(data);
      setActiveSatelliteLayer(type);
    } catch (e) {
      console.error("Satellite analysis failed", e);
    } finally {
      setIsAnalyzing(false);
    }
  };


  const getZoneStatus = (moisture, isIrrOn) => {
    if (isIrrOn) return { color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', text: 'text-red-600', status: 'Irrigation ON' };
    if (moisture > 80) return { color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', text: 'text-blue-600', status: 'Saturated' };
    if (moisture >= 35) return { color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', text: 'text-green-600', status: 'Optimal' };
    if (moisture >= 20) return { color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800', text: 'text-yellow-600', status: 'Warning' };
    return { color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', text: 'text-red-600', status: 'Critical' };
  };

  if (setupLoading) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 rounded-full border-4 border-earth-200 border-t-earth-600 animate-spin"></div>
      </div>
    );
  }

  // Default map settings
  let mapCenter = [18.2324, 73.8567];
  let mapBoundary = [
    [18.2350, 73.8500], [18.2350, 73.8650], [18.2250, 73.8650], [18.2250, 73.8500]
  ];
  let mapSensors = [];
  let mapZoom = 14;

  if (farmSetup && farmSetup.coordinates && Array.isArray(farmSetup.coordinates) && farmSetup.coordinates.length > 0) {
    const coords = farmSetup.coordinates;
    const validCoords = coords.filter(c => Array.isArray(c) && c.length === 2 && !isNaN(c[0]) && !isNaN(c[1]));

    if (validCoords.length > 0) {
      const centerLat = validCoords.reduce((sum, c) => sum + c[0], 0) / validCoords.length;
      const centerLng = validCoords.reduce((sum, c) => sum + c[1], 0) / validCoords.length;
      mapCenter = [centerLat, centerLng];
      mapBoundary = validCoords;
      mapZoom = 17; // little zoomed in as requested

      // Auto generate sensors
      validCoords.forEach((pos, i) => {
        mapSensors.push({ id: i + 1, pos });
      });
    }
  } else if (profile.district) {
    // if we have weather coord fallback
    if (liveData.lat && liveData.lon && !isNaN(liveData.lat) && !isNaN(liveData.lon)) {
      mapCenter = [liveData.lat, liveData.lon];
      mapBoundary = [
        [liveData.lat + 0.005, liveData.lon - 0.005],
        [liveData.lat + 0.005, liveData.lon + 0.005],
        [liveData.lat - 0.005, liveData.lon + 0.005],
        [liveData.lat - 0.005, liveData.lon - 0.005]
      ];
      mapZoom = 15;
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-nature-700 dark:text-white font-sans p-2">

      {/* Top Toolbar */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 mb-4 sm:mb-6 bg-white dark:bg-nature-950/60 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-nature-200 dark:border-nature-800 shadow-sm w-full overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 xl:gap-6 w-full xl:w-auto">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0">
              <CloudSun className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 shrink-0" />
              <span className="text-nature-700 dark:text-white font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{t('Welcome Farmer')}</span>
            </div>
            <span className="text-earth-600 font-bold text-xs sm:text-sm bg-earth-50 dark:bg-earth-900/30 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded border border-earth-100 dark:border-earth-800/50 whitespace-nowrap shrink-0">{profile.farmer_id}</span>
            <div className="hidden sm:block w-px h-5 bg-nature-300 dark:bg-nature-700 mx-1 shrink-0"></div>
            <span className="text-nature-900 dark:text-white font-bold text-base sm:text-lg transition-all whitespace-nowrap shrink-0">{liveData.temp}°C</span>
          </div>
          <div className="flex justify-between sm:justify-start items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <div className="flex items-center gap-2 whitespace-nowrap shrink-0 bg-nature-50 dark:bg-nature-900/50 px-3 py-1.5 sm:bg-transparent sm:px-0 sm:py-0 rounded-lg">
              <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
              <span className="text-nature-700 dark:text-white transition-all font-medium sm:font-normal text-xs sm:text-sm">{liveData.humidity}% <span className="sm:hidden ml-1">{t('Humidity')}</span></span>
            </div>
            {/* Map Pin duplicated for easy tap target on lower row */}
            <Link to="/app/map" className="sm:hidden p-1.5 bg-white dark:bg-nature-950 rounded-lg border border-nature-200 dark:border-nature-800 hover:bg-nature-50 dark:hover:bg-nature-800 dark:bg-nature-900 cursor-pointer transition shadow-sm shrink-0">
              <MapPin className="w-4 h-4 text-nature-500 dark:text-white hover:text-earth-500 shrink-0" />
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-between sm:justify-start xl:justify-end relative z-[100] mt-1 sm:mt-0 border-t sm:border-t-0 border-nature-100 dark:border-nature-800 pt-3 sm:pt-0">

          {/* Online / Offline Status Indicator (Moved to Right) */}
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-white dark:bg-nature-950 rounded-lg border border-nature-200 dark:border-nature-800 shadow-sm transition shrink-0 flex-1 sm:flex-none justify-center">
            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 ${isOnline ? 'bg-green-500 animate-[pulse_2s_ease-in-out_infinite]' : 'bg-red-500'}`}></span>
            <span className={`text-[10px] sm:text-xs font-bold ${isOnline ? 'text-green-700 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
              {isOnline ? t('Online') : t('Offline')}
            </span>
          </div>

          <Link to="/app/insights" className="flex items-center justify-center gap-1.5 sm:gap-2 bg-white dark:bg-nature-950 px-2.5 sm:px-3 py-1.5 rounded-lg border border-nature-200 dark:border-nature-800 hover:bg-nature-50 dark:hover:bg-nature-800 dark:bg-nature-900 cursor-pointer transition shadow-sm shrink-0 flex-[2] sm:flex-none">
            <Plane className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-nature-500 dark:text-white shrink-0" />
            <span className="text-[10px] sm:text-xs text-nature-600 dark:text-white font-medium whitespace-nowrap">{t('Drone Status: Online')}</span>
          </Link>
          {/* Map Pin Hidden on Mobile because it moved left */}
          <Link to="/app/map" className="hidden sm:block p-1.5 sm:p-2 bg-white dark:bg-nature-950 rounded-lg border border-nature-200 dark:border-nature-800 hover:bg-nature-50 dark:hover:bg-nature-800 dark:bg-nature-900 cursor-pointer transition shadow-sm shrink-0">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-nature-500 dark:text-white hover:text-earth-500 shrink-0" />
          </Link>

        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Link to="/app/map" className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 p-4 shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border border-blue-100 dark:border-blue-800/50 group-hover:bg-blue-100 transition">
            <MapIcon className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-sm font-bold text-nature-800 dark:text-white text-center">{t('Farm Overview')}</span>
        </Link>
        <Link to="/app/irrigation" className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 p-4 shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center border border-cyan-100 dark:border-cyan-800/50 group-hover:bg-cyan-100 transition">
            <Droplets className="w-5 h-5 text-cyan-500" />
          </div>
          <span className="text-sm font-bold text-nature-800 dark:text-white text-center">{t('Irrigation Control')}</span>
        </Link>
        <Link to="/app/insights" className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 p-4 shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center border border-purple-100 dark:border-purple-800/50 group-hover:bg-purple-100 transition">
            <Plane className="w-5 h-5 text-purple-500" />
          </div>
          <span className="text-sm font-bold text-nature-800 dark:text-white text-center">{t('Drone Missions')}</span>
        </Link>
        <Link to="/app/alerts" className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 p-4 shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center border border-red-100 dark:border-red-800/50 group-hover:bg-red-100 transition">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <span className="text-sm font-bold text-nature-800 dark:text-white text-center">{t('Alerts')}</span>
        </Link>

      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

        {/* COLUMN 1 (Left) */}
        <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Farm Info Header */}
          <div className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl p-5 border border-nature-200 dark:border-nature-800 shadow-md transition relative overflow-hidden group mb-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-earth-100 dark:bg-earth-900/30 rounded-bl-full blur-2xl opacity-50 dark:opacity-20 pointer-events-none"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2 text-xl font-bold text-nature-900 dark:text-white">
                  <Wheat className="w-5 h-5 text-earth-600" /> {farmSetup?.farm_name || profile.name + "'s Farm"}
                </div>
                <p className="text-xs font-semibold text-nature-500 dark:text-nature-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {farmSetup?.district ? `${farmSetup.district}, ${farmSetup.state}` : (profile.district ? `${profile.district}, ${profile.state}` : 'Maharashtra, India')}
                </p>
              </div>
              <div className="bg-nature-50 dark:bg-nature-900 p-2 rounded-lg border border-nature-100 dark:border-nature-700/50 flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-orange-400" />
                <span className="text-nature-900 dark:text-white font-bold transition-all">{liveData.temp}°C</span>
              </div>
            </div>
          </div>

          {/* Zones Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { name: farmSetup?.area1_name || 'Zone A', moisture: liveData.area1Moisture, active: farmSetup?.area1_sensors > 0 },
              { name: farmSetup?.area2_name || 'Zone B', moisture: liveData.area2Moisture, active: farmSetup?.area2_sensors > 0 }
            ].filter(z => z.active).map((zone, i) => {
              const isIrrOn = i === 0 ? liveData.dispIrr1 : liveData.dispIrr2;
              const stat = getZoneStatus(zone.moisture || 0, isIrrOn);
              return (
                <div key={i} className={`bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl p-4 border shadow-sm ${stat.color} transition-all`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-nature-900 dark:text-white text-sm flex items-center gap-1.5"><MapIcon className="w-3.5 h-3.5 text-nature-500" /> {zone.name}</h4>
                    <span className="text-xl font-black text-nature-900 dark:text-white">{zone.moisture || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-nature-200/50 dark:border-nature-800/50 text-xs font-semibold">
                    <span className="text-nature-500">{t("Status")}:</span>
                    <span className={`${stat.text} flex items-center gap-1`}>
                      {stat.status === 'Optimal' ? <CheckCircle2 className="w-3.5 h-3.5" /> : (stat.status === 'Warning' ? <AlertTriangle className="w-3.5 h-3.5" /> : <Droplets className="w-3.5 h-3.5" />)}
                      {t(stat.status)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Soil Condition */}
          <div className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl p-5 border border-nature-200 dark:border-nature-800 shadow-sm relative flex flex-col items-center">
            <div className="flex justify-between items-center mb-6 w-full">
              <h3 className="text-base font-bold text-nature-900 dark:text-white flex items-center gap-2 flex-wrap">
                {t('Soil Condition')}
              </h3>
              <div className="relative">
                <button onClick={() => setShowSoilInfo(!showSoilInfo)} className="text-nature-400 dark:text-white hover:text-nature-600 dark:text-white dark:hover:text-nature-200 cursor-pointer p-1 transition-colors">
                  <Info className="w-4 h-4" />
                </button>
                {showSoilInfo && <div className="fixed inset-0 z-[50]" onClick={() => setShowSoilInfo(false)}></div>}
                <div className={`absolute right-0 top-full mt-2 w-[260px] sm:w-[300px] p-4 bg-white dark:bg-nature-900 border border-nature-200 dark:border-nature-800 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-2xl z-[60] text-sm transition-all duration-300 origin-top-right ${showSoilInfo ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                  <div className="font-bold text-nature-900 dark:text-white mb-1.5 flex items-center gap-1.5 border-b border-nature-100 dark:border-nature-700/50 dark:border-nature-800 pb-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    <span>{t('Soil Health Indicator')}</span>
                  </div>
                  <div className="text-nature-600 dark:text-white text-xs sm:text-sm leading-relaxed mt-2 pt-1">
                    {t('Soil moisture indicates water availability in soil. Optimal range is')} <span className="font-semibold text-green-600 dark:text-green-400">35%–60%</span> {t('for healthy crop growth.')}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-around items-center w-full gap-2">
              <CircularProgress value={liveData.moisture} label={t('Soil Moisture')} subLabel={t(liveData.moisture > 80 ? 'Saturated' : liveData.moisture >= 35 ? 'Optimal' : liveData.moisture >= 20 ? 'Warning' : 'Critical')} color="#3b82f6" bgColor="#e1efe6" size={96} strokeWidth={6} />

              <CircularProgress value={liveData.sensorHumidity || 45} label={t('Humidity')} subLabel={t('Normal')} color="#0ea5e9" bgColor="#e1efe6" size={96} strokeWidth={6} />
              <div className="flex flex-col items-center justify-center relative" style={{ width: 96, height: 96 }}>
                <svg width="96" height="96" className="transform -rotate-90 overflow-visible">
                  <circle cx="48" cy="48" r="45" stroke="#e1efe6" strokeWidth="6" fill="none" />
                  <circle
                    cx="48" cy="48" r="45"
                    stroke={Math.round((liveData.wind || 0) * 3.6) <= 15 ? '#22c55e' : Math.round((liveData.wind || 0) * 3.6) <= 30 ? '#eab308' : '#ef4444'}
                    strokeWidth="6" fill="none" strokeDasharray="282.7"
                    strokeDashoffset={282.7 - (Math.min(Math.round((liveData.wind || 0) * 3.6), 100) / 100) * 282.7}
                    strokeLinecap="round" className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center px-1 w-full">
                  <span className="text-[22px] font-black tracking-tighter text-nature-900 dark:text-white transition-all leading-none mt-1 flex items-baseline gap-0.5">
                    {Math.round((liveData.wind || 0) * 3.6)} <span className="text-[10px] font-bold text-nature-400">km/h</span>
                  </span>
                  <span className="text-[9px] text-nature-500 dark:text-white uppercase font-bold tracking-tighter mt-1 leading-tight break-words w-full">{t('Wind Speed')}</span>
                  <span className={`text-[8.5px] font-bold mt-0.5 ${Math.round((liveData.wind || 0) * 3.6) <= 15 ? 'text-green-600' : Math.round((liveData.wind || 0) * 3.6) <= 30 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {Math.round((liveData.wind || 0) * 3.6) <= 5 ? 'Calm' : Math.round((liveData.wind || 0) * 3.6) <= 15 ? 'Light Breeze' : Math.round((liveData.wind || 0) * 3.6) <= 30 ? 'Windy' : 'Stormy'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts Widget */}
          <Link to="/app/alerts" className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 shadow-md hover:shadow-lg transition flex flex-col group cursor-pointer overflow-hidden max-h-[260px]">
            <div className="px-5 py-4 border-b border-nature-100 dark:border-nature-700/50 flex justify-between items-center group-hover:bg-nature-50 dark:hover:bg-nature-800 dark:bg-nature-900/50 rounded-t-2xl transition">
              <h3 className="text-base font-bold text-nature-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" /> {t('Alerts')}
              </h3>
              <ChevronRight className="w-4 h-4 text-nature-400 dark:text-white group-hover:text-nature-700 dark:text-white group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="p-3 space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
              {alerts.length === 0 ? (
                <div className="flex items-center justify-center py-6 text-nature-400 dark:text-white text-sm">No active alerts — all clear ✅</div>
              ) : alerts.slice(0, 3).map(alert => (
                <div key={alert.id} className={`${alert.bg} border ${alert.border} rounded-xl p-3 flex gap-3 hover:opacity-90 transition`}>
                  <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full ${alert.bg} flex items-center justify-center border ${alert.border}`}>
                    <AlertTriangle className={`w-4 h-4 ${alert.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-semibold text-nature-900 dark:text-white">{alert.title}</h4>
                    </div>
                    <p className="text-[11px] text-nature-600 dark:text-white leading-tight mt-1 line-clamp-2">{alert.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </Link>

        </div>

        {/* COLUMN 2 (Center) */}
        <div className="md:col-span-12 lg:col-span-5 flex flex-col gap-4">

          {/* Dynamic Farm Map Card (Behaves like loosely static map) */}
          <Link to="/app/map" className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 p-4 relative flex flex-col group shadow-md hover:shadow-lg transition cursor-pointer">
            <div className="flex justify-between items-center mb-3 border-b pb-2 border-nature-100 dark:border-nature-800">
              <h3 className="text-lg font-bold text-nature-900 dark:text-white group-hover:text-earth-600 transition-colors">{t('Live Farm Map')}</h3>
              <div className="flex items-center gap-2">
                <div className="text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded-full border border-green-200 z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> {t('Real-Time')}
                </div>
              </div>
            </div>

            <div className="w-full h-[220px] rounded-xl overflow-hidden relative border border-nature-200 dark:border-nature-800 bg-nature-100 dark:bg-nature-900 shadow-inner">
              <div className="absolute inset-0 z-10 block pointer-events-none">
                {mapBoundary && mapCenter && (
                  <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    className="h-full w-full pointer-events-none"
                    zoomControl={false}
                    dragging={false}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                    touchZoom={false}
                  >
                    <MapController center={mapCenter} zoom={mapZoom} />
                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                    <Polygon positions={mapBoundary} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.3 }} />
                    {mapSensors.map((s) => (
                      <Marker key={`sensor-${s.id}`} position={s.pos}></Marker>
                    ))}
                  </MapContainer>
                )}
              </div>

              {/* Overlay Gradient to give it a Card feel */}
              <div className="absolute inset-0 bg-gradient-to-t from-nature-900/60 via-transparent to-transparent z-20 pointer-events-none"></div>

              <div className="absolute bottom-3 left-3 z-30 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-bold pointer-events-none group-hover:bg-earth-600 transition-colors shadow-lg border border-white/10">
                <MapIcon className="w-4 h-4" /> {t('Expand Map')}
              </div>
            </div>
          </Link>

          {/* Automated Drone Mission */}
          <Link to="/app/insights" className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 p-4 flex items-center justify-between group cursor-pointer hover:bg-nature-50 dark:hover:bg-nature-800 dark:bg-nature-900 hover:shadow-md transition shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-earth-50 dark:bg-earth-900/30 border border-earth-100 dark:border-earth-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plane className="w-5 h-5 text-earth-500 group-hover:text-earth-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-nature-900 dark:text-white group-hover:text-earth-600 transition-colors">{t('Automated Drone Mission 09')}</h4>
                <p className="text-xs text-nature-500 dark:text-white">{t('Today at')} 11:45 AM</p>
              </div>
            </div>
            <div className="bg-nature-50 dark:bg-nature-900 rounded-lg py-1.5 px-3 border border-nature-200 dark:border-nature-800 flex items-center gap-2 group-hover:bg-white dark:bg-nature-950 transition-colors">
              <Plane className="w-3 h-3 text-nature-400 dark:text-white group-hover:text-earth-500" />
              <span className="text-xs font-bold text-nature-700 dark:text-white group-hover:text-earth-600">18m 20s</span>
            </div>
          </Link>

      <div className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 p-3 sm:p-4 shadow-sm flex-1 flex flex-col min-h-[300px]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[13px] sm:text-[15px] font-bold text-nature-900 dark:text-white flex items-center gap-2">
            <Sprout className="w-4 h-4 text-green-500" /> {t('NDVI Vegetation Analysis')}
          </h3>

              <div className="flex bg-nature-100 dark:bg-nature-800 rounded-lg p-1 border border-nature-200 dark:border-nature-700">
                <button 
                  onClick={() => activeSatelliteLayer === 'ndvi' ? setActiveSatelliteLayer(null) : handleSatelliteAnalyze('ndvi')}
                  disabled={isAnalyzing}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${activeSatelliteLayer === 'ndvi' ? 'bg-green-600 text-white shadow-md' : 'text-nature-500 hover:bg-nature-200'}`}
                >
                  {isAnalyzing && activeSatelliteLayer === 'ndvi' ? '...' : '🌱 NDVI'}
                </button>
                <div className="w-px h-4 bg-nature-300 mx-1 self-center"></div>
                <button 
                  onClick={() => activeSatelliteLayer === 'ndwi' ? setActiveSatelliteLayer(null) : handleSatelliteAnalyze('ndwi')}
                  disabled={isAnalyzing}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${activeSatelliteLayer === 'ndwi' ? 'bg-blue-600 text-white shadow-md' : 'text-nature-500 hover:bg-nature-200'}`}
                >
                  {isAnalyzing && activeSatelliteLayer === 'ndwi' ? '...' : '💧 NDWI'}
                </button>
              </div>
            </div>


            {!mapCenter || !mapBoundary || mapBoundary.length < 2 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-nature-500 font-medium bg-nature-50 dark:bg-nature-900/40 rounded-xl">
                {t('Configure your farm boundary first')}
              </div>
            ) : (() => {
              // Compute bounding box from actual boundary coordinates
              const minLat = mapBoundary.reduce((mn, c) => Math.min(mn, c[0]), Infinity);
              const maxLat = mapBoundary.reduce((mx, c) => Math.max(mx, c[0]), -Infinity);
              const minLon = mapBoundary.reduce((mn, c) => Math.min(mn, c[1]), Infinity);
              const maxLon = mapBoundary.reduce((mx, c) => Math.max(mx, c[1]), -Infinity);
              const midLat = (minLat + maxLat) / 2;
              const gap = (maxLat - minLat) * 0.02; // tiny visual gap between zones
              const pad = (maxLat - minLat) * 0.03; // small inset padding

              // Zone A = top half rectangle, Zone B = bottom half rectangle
              const zoneARect = [
                [maxLat - pad, minLon + pad], [maxLat - pad, maxLon - pad],
                [midLat + gap, maxLon - pad], [midLat + gap, minLon + pad]
              ];
              const zoneBRect = [
                [midLat - gap, minLon + pad], [midLat - gap, maxLon - pad],
                [minLat + pad, maxLon - pad], [minLat + pad, minLon + pad]
              ];

              const sensorPts = mapBoundary.slice(0, 4).map((v, i) => ({
                n: i + 1,
                v,
                val: i === 0 ? liveData.s1 : i === 1 ? liveData.s2 : i === 2 ? liveData.s3 : liveData.s4,
                zone: i < 2 ? 'Area 1' : 'Area 2'
              })).filter(s => s.v && !isNaN(s.v[0]));


              const getZoneColor = (moisture, isIrrOn) => {
                if (isIrrOn) return '#ef4444';
                if (moisture > 80) return '#3b82f6';
                if (moisture >= 35) return '#22c55e';
                if (moisture >= 20) return '#eab308';
                return '#ef4444';
              };
              const getPopupBadge = (moisture, isIrrOn) => {
                if (isIrrOn) return { cls: 'bg-red-100 text-red-600 border-red-200', lbl: '🔴 PUMP ON' };
                if (moisture > 80) return { cls: 'bg-blue-100 text-blue-600 border-blue-200', lbl: '🔵 SATURATED' };
                if (moisture >= 35) return { cls: 'bg-green-100 text-green-700 border-green-200', lbl: '🟢 OPTIMAL' };
                if (moisture >= 20) return { cls: 'bg-orange-100 text-orange-600 border-orange-200', lbl: '🟡 DRY/WARNING' };
                return { cls: 'bg-red-100 text-red-600 border-red-200', lbl: '🔴 CRITICAL' };
              };

              const zoneAColor = getZoneColor(liveData.avg1 ?? 0, liveData.dispIrr1);
              const zoneBColor = getZoneColor(liveData.avg2 ?? 0, liveData.dispIrr2);
              const badgeA = getPopupBadge(liveData.avg1 ?? 0, liveData.dispIrr1);
              const badgeB = getPopupBadge(liveData.avg2 ?? 0, liveData.dispIrr2);

              return (
                <div className="w-full flex-1 rounded-xl overflow-hidden border border-nature-200 dark:border-nature-800 relative shadow-inner">
                  <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full z-0" zoomControl={false} scrollWheelZoom={false} doubleClickZoom={false}>
                    <MapController center={mapCenter} zoom={mapZoom} />
                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={20} attribution="Tiles &copy; Esri" />
                    
                    {satelliteData && activeSatelliteLayer && (
                      <ImageOverlay 
                        url={satelliteData.image}
                        bounds={[[satelliteData.bbox[0], satelliteData.bbox[1]], [satelliteData.bbox[2], satelliteData.bbox[3]]]}
                        opacity={0.8}
                        zIndex={100}
                      />
                    )}

                    {/* Only show boundaries and zone rectangles if NO satellite layer is active */}
                    {!activeSatelliteLayer && (
                      <>
                        <Polygon positions={mapBoundary} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.08, weight: 2, dashArray: '5' }} />
                        <Polygon positions={zoneARect} pathOptions={{ color: zoneAColor, fillColor: zoneAColor, fillOpacity: 0.35, weight: 2 }}>
                          <Popup><div className="p-1.5 min-w-[140px]"><h4 className="font-black text-[11px] border-b pb-1 mb-2 uppercase">{t('Zone A (Area 1)')}</h4><p className="text-xs mb-1">{t('Moisture:')} <b>{(liveData.avg1 ?? 0).toFixed(1)}%</b></p><p className="text-xs mb-2">{t('Temp:')} <b>{liveData.temp}°C</b></p><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeA.cls}`}>{badgeA.lbl}</span></div></Popup>
                        </Polygon>
                        <Polygon positions={zoneBRect} pathOptions={{ color: zoneBColor, fillColor: zoneBColor, fillOpacity: 0.35, weight: 2 }}>
                          <Popup><div className="p-1.5 min-w-[140px]"><h4 className="font-black text-[11px] border-b pb-1 mb-2 uppercase">{t('Zone B (Area 2)')}</h4><p className="text-xs mb-1">{t('Moisture:')} <b>{(liveData.avg2 ?? 0).toFixed(1)}%</b></p><p className="text-xs mb-2">{t('Temp:')} <b>{liveData.temp}°C</b></p><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeB.cls}`}>{badgeB.lbl}</span></div></Popup>
                        </Polygon>
                      </>
                    )}

                    {/* Sensor markers on actual boundary vertices */}
                    {sensorPts.map(s => (
                      <Marker key={s.n} position={s.v}>
                        <Popup><span className="text-[10px] uppercase font-bold block mb-1">Sensor {s.n} ({s.zone})</span>{t('Moisture:')} <span className={`font-black ${((s.val ?? 0) < 35) ? 'text-orange-500' : 'text-green-600'}`}>{s.val ?? 0}%</span></Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                  <Link to="/app/map" onClick={e => e.stopPropagation()} className="absolute bottom-3 right-3 z-[400] flex items-center gap-1.5 bg-black/70 hover:bg-earth-600 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-[11px] font-bold transition-colors shadow-lg border border-white/10">
                    <MapIcon className="w-3.5 h-3.5" /> {t('Expand Map')}
                  </Link>
                </div>
              );
            })()}
          </div>

        </div>

        {/* COLUMN 3 (Right) */}
        <div className="md:col-span-12 lg:col-span-3 flex flex-col gap-4">

          {/* Irrigation Control Widget */}
          <Link to="/app/irrigation" className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 p-4 sm:p-5 shadow-md hover:shadow-lg transition relative flex flex-col group cursor-pointer w-full mb-4">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg font-bold text-nature-900 dark:text-white group-hover:text-earth-600 transition-colors">{t('Irrigation Control')}</h3>
              <button className="text-nature-400 dark:text-white hover:text-earth-500 p-1"><Settings className="w-4 h-4" /></button>
            </div>

            <div className="flex justify-center mb-4 sm:mb-6 relative items-center py-4">
              {/* Outer decorative ring */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[140px] h-[140px] rounded-full border border-nature-100 dark:border-nature-700/50"></div>
              </div>
              <CircularProgress value={liveData.moisture} color="#c38d4e" bgColor="#e1efe6" size={120} strokeWidth={8} />

              <div className="absolute right-0 sm:right-0 top-0 bg-white dark:bg-nature-950/95 backdrop-blur-md border border-nature-200 dark:border-nature-800 shadow-md p-2 rounded-xl text-right z-10 hidden sm:block">
                <span className="text-[10px] text-nature-500 dark:text-white uppercase tracking-wider block">{t('Next Irrigation')}</span>
                <span className="text-xs font-bold text-nature-900 dark:text-white flex items-center gap-1 justify-end"><Droplets className="w-3 h-3 text-blue-500" /> 3 {t('Hours')}</span>
              </div>
              <div className="absolute right-0 sm:right-0 bottom-0 bg-white dark:bg-nature-950/95 backdrop-blur-md border border-nature-200 dark:border-nature-800 shadow-md p-2 rounded-xl text-right z-10 hidden sm:block">
                <span className="text-[10px] text-nature-500 dark:text-white uppercase tracking-wider block">{t('Pump Status')}</span>
                <span className="text-xs font-bold text-nature-900 dark:text-white flex items-center gap-1 justify-end text-green-600"><Activity className="w-3 h-3" /> {t('Active')}</span>
              </div>
            </div>

            <div className="space-y-2 mt-auto">
              <div className="flex justify-between items-center text-sm border-b border-nature-100 dark:border-nature-700/50 pb-2">
                <span className="text-nature-500 dark:text-white">{t('Soil Moisture')}</span>
                <span className="text-nature-900 dark:text-white font-semibold flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-green-500" /> 108 %
                  <div className="w-16 h-2 bg-nature-100 dark:bg-nature-800 rounded-full overflow-hidden ml-2">
                    <div className="bg-earth-500 h-full w-[31%]"></div>
                  </div>
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-nature-500 dark:text-white">{t('Valve Status')}</span>
                <span className="text-nature-900 dark:text-white font-bold text-green-600">{t('Optimal Flow')}</span>
              </div>
            </div>

            <div className="w-full mt-auto bg-earth-500 group-hover:bg-earth-600 text-white font-bold py-3 rounded-xl shadow-[0_4px_10px_rgba(195,141,78,0.3)] transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2 relative z-30 pointer-events-none">
              {t('CONTROL PANEL')}
            </div>
          </Link>

          {/* Recommendations (Moved here to rebalance layout) */}
          <Link to="/app/recommendations" className="bg-white dark:bg-nature-950/80 backdrop-blur-md rounded-2xl border border-nature-200 dark:border-nature-800 shadow-md hover:shadow-lg transition flex flex-col cursor-pointer group w-full">
            <div className="px-5 py-3 border-b border-nature-100 dark:border-nature-700/50 flex justify-between items-center group-hover:bg-nature-50 dark:hover:bg-nature-800 dark:bg-nature-900/50 rounded-t-2xl transition">
              <h3 className="text-base font-bold text-nature-900 dark:text-white flex items-center gap-2 group-hover:text-earth-600 transition-colors">
                {t('Recommendations')}
              </h3>
              <ChevronRight className="w-4 h-4 text-nature-400 dark:text-white group-hover:text-nature-700 dark:text-white group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="p-3 space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
              {recs.length === 0 ? (
                <div className="flex items-center justify-center py-6 text-nature-400 dark:text-white text-sm">No recommendations available.</div>
              ) : recs.slice(0, 3).map(rec => {
                const Icon = rec.icon;
                return (
                  <div key={rec.id} className={`${rec.iconBg} border border-nature-100 dark:border-nature-700/50 rounded-xl p-3 flex gap-3 hover:opacity-90 transition cursor-pointer group`}>
                    <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full ${rec.iconBg} border border-nature-200 dark:border-nature-800/50 flex items-center justify-center ${rec.iconColor} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-nature-900 dark:text-white leading-tight">{rec.title}</h4>
                      <p className="text-[11px] text-nature-600 dark:text-white leading-tight mt-1 line-clamp-2">{rec.reason}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Link>

        </div>

      </div>
    </div >
  );
}
