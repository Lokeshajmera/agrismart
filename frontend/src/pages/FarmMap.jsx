import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Circle, useMap, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { MapPin, Sprout, Droplets } from 'lucide-react';

// Fix for default Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
 iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
 iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
 shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const defaultRegions = {
 'mh': {
 name: 'Maharashtra (Pune Farms)',
 center: [18.2324, 73.8567], // Pune rural district
 boundary: [[18.2350, 73.8500], [18.2350, 73.8650], [18.2250, 73.8650], [18.2250, 73.8500]],
 sensors: [
 { id: 1, pos: [18.2300, 73.8550], type: 'Moisture', status: 'optimal', val: '46%' },
 { id: 2, pos: [18.2280, 73.8600], type: 'Moisture', status: 'warning', val: '31%' },
 { id: 3, pos: [18.2330, 73.8620], type: 'Temp', status: 'optimal', val: '31°C' }
 ],
 dryZone: [18.2280, 73.8600]
 },
 'delhi': {
 name: 'Haryana (Sonipat Farms)',
 center: [28.9814, 77.0175], // Rural area outside Sonipat
 boundary: [[28.9830, 77.0150], [28.9830, 77.0200], [28.9790, 77.0200], [28.9790, 77.0150]],
 sensors: [
 { id: 4, pos: [28.9820, 77.0160], type: 'Moisture', status: 'optimal', val: '42%' },
 { id: 5, pos: [28.9805, 77.0185], type: 'Moisture', status: 'warning', val: '28%' },
 { id: 6, pos: [28.9815, 77.0190], type: 'Temp', status: 'optimal', val: '25°C' }
 ],
 dryZone: [28.9805, 77.0185]
 },
 'punjab': {
 name: 'Punjab (Sangrur Fields)',
 center: [30.2500, 75.8300], // Rural agricultural land in Sangrur district
 boundary: [[30.2520, 75.8270], [30.2520, 75.8330], [30.2480, 75.8330], [30.2480, 75.8270]],
 sensors: [
 { id: 7, pos: [30.2510, 75.8285], type: 'Moisture', status: 'optimal', val: '45%' },
 { id: 8, pos: [30.2490, 75.8315], type: 'Moisture', status: 'optimal', val: '41%' }
 ],
 dryZone: null
 },
 'mp': {
 name: 'Madhya Pradesh (Sehore)',
 center: [23.2000, 77.0800], // Rural fields near Sehore
 boundary: [[23.2020, 77.0770], [23.2020, 77.0830], [23.1980, 77.0830], [23.1980, 77.0770]],
 sensors: [
 { id: 9, pos: [23.2010, 77.0785], type: 'Moisture', status: 'critical', val: '18%' },
 { id: 10, pos: [23.1990, 77.0815], type: 'Temp', status: 'warning', val: '36°C' }
 ],
 dryZone: [23.2010, 77.0785]
  }
};

const WEATHER_API_KEY = 'e5c8c35726d52c53ed66735380eae2e9';

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15, { animate: false });
  }, [center, map]);
  return null;
}

function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function FarmMap() {
  const { t } = useTranslation();
  const { userProfile, user } = useAuth();
  
  const [regions, setRegions] = useState(defaultRegions);
  const [selectedRegionKey, setSelectedRegionKey] = useState('mh');
  const [isMapLocating, setIsMapLocating] = useState(true);
  const [mapType, setMapType] = useState('satellite');
  const [sensorData, setSensorData] = useState(null);

  // Real-time sensor polling from Supabase
  useEffect(() => {
    if (!user) return;
    const fetchSensors = async () => {
      try {
        const { data } = await supabase
          .from('sensor_data')
          .select('soil1, soil2, soil3, soil4, irrigation1, irrigation2, temp1, created_at')
          .order('created_at', { ascending: false })
          .limit(1);
        if (data && data.length > 0) {
          const d = data[0];
          const avg1 = [d.soil1, d.soil2].filter(v => v != null);
          const avg2 = [d.soil3, d.soil4].filter(v => v != null);
          setSensorData({
            s1: d.soil1, s2: d.soil2, s3: d.soil3, s4: d.soil4,
            avg1: avg1.length > 0 ? avg1.reduce((a, b) => a + b, 0) / avg1.length : 0,
            avg2: avg2.length > 0 ? avg2.reduce((a, b) => a + b, 0) / avg2.length : 0,
            irr1: d.irrigation1 || false,
            irr2: d.irrigation2 || false,
            temp: d.temp1 || 28,
            updatedAt: d.created_at
          });
        }
      } catch (e) {}
    };
    fetchSensors();
    const iv = setInterval(fetchSensors, 10000);
    return () => clearInterval(iv);
  }, [user]);

  useEffect(() => {
    const fetchUserLocation = async () => {
      setIsMapLocating(true);
      if (user && userProfile?.district) {
        try {
          // Check explicit farm_setup configured by Owner First
          const { data: setupData, error: setupErr } = await supabase.from('farm_setup').select('*').eq('user_id', user.id).single();

          if (setupData && setupData.coordinates && Array.isArray(setupData.coordinates) && setupData.coordinates.length > 0) {
             const coords = setupData.coordinates;
             
             // Extract geographical center by averaging all coordinates to fly the camera
             const centerLat = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
             const centerLng = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
             
             // Build sensor payload natively mapping the explicit Owner plot points
             const generatedSensors = [];
             
             for (let i = 0; i < coords.length; i++) {
                generatedSensors.push({
                   id: i + 1,
                   pos: coords[i],
                   type: i % 2 === 0 ? 'Moisture' : 'Temp',
                   status: 'optimal',
                   val: i % 2 === 0 ? '45%' : '26°C'
                });
             }
             
             const customRegion = {
                name: setupData.farm_name || "Assigned Farm Layout",
                center: [centerLat, centerLng],
                boundary: coords, // Tracing the explicit Polygon!
                sensors: generatedSensors,
                dryZone: null
             };
             
             setRegions(prev => ({ 'my_farm': customRegion, ...prev }));
             setSelectedRegionKey('my_farm');
          } else {
             // Fallback to legacy OpenWeatherMap Geographic district resolution
             const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${userProfile.district},IN&limit=1&appid=${WEATHER_API_KEY}`);
             const data = await res.json();
             if (data && data.length > 0) {
               const { lat, lon, name } = data[0];
               const myRegion = {
                 name: `Your Regional Farm (${name})`,
                 center: [lat, lon],
                 boundary: [
                   [lat + 0.005, lon - 0.005],
                   [lat + 0.005, lon + 0.005],
                   [lat - 0.005, lon + 0.005],
                   [lat - 0.005, lon - 0.005]
                 ],
                 sensors: [
                   { id: 99, pos: [lat + 0.001, lon - 0.001], type: 'Moisture', status: 'optimal', val: '45%' },
                   { id: 100, pos: [lat - 0.002, lon + 0.001], type: 'Temp', status: 'warning', val: '34°C' }
                 ],
                 dryZone: [lat - 0.002, lon + 0.001]
               };
               setRegions(prev => ({ 'my_farm': myRegion, ...prev }));
               setSelectedRegionKey('my_farm');
             }
          }
        } catch (e) {
          console.error("Failed to fetch user regional coordinates for map", e);
        } finally {
          setIsMapLocating(false);
        }
      } else {
         setIsMapLocating(false);
      }
    };
    fetchUserLocation();
  }, [userProfile, user]);

 const region = regions[selectedRegionKey] || defaultRegions['mh'];
 
 if (isMapLocating) {
    return (
       <div className="flex flex-col items-center justify-center p-12 text-center h-[70vh]">
         <div className="w-8 h-8 rounded-full border-4 border-earth-200 border-t-earth-600 animate-spin"></div>
         <p className="text-nature-500 mt-4 font-bold">{t("Generating Spatial Mapping Arrays...")}</p>
       </div>
    );
 }

 return (
 <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
 <div className="flex justify-between items-center">
 <div>
 <h1 className="text-2xl font-bold text-nature-900 dark:text-white tracking-tight">{t("Interactive Farm Map")}</h1>
 <p className="text-nature-500 dark:text-white mt-1">{t("Real-time geospatial data, NDVI layers, and sensor locations.")}</p>
 </div>
 <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-nature-950 p-2 rounded-xl border border-nature-200 dark:border-nature-800 shadow-sm">
 <div className="flex items-center gap-2 bg-nature-100 dark:bg-nature-800 border border-nature-200 dark:border-nature-700 text-nature-800 dark:text-white text-sm rounded-lg px-3 py-2 font-bold pointer-events-none">
   <MapPin className="w-4 h-4 text-earth-600" />
   {region.name}
 </div>
 <div className="hidden sm:block w-px h-6 bg-nature-200 dark:bg-nature-700 mx-1"></div>
 <div className="flex bg-nature-100 dark:bg-nature-800 rounded-lg p-1 border border-nature-200 dark:border-nature-700">
   <button 
     onClick={() => setMapType('street')}
     className={`px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all ${mapType === 'street' ? 'bg-white dark:bg-nature-700 text-nature-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]' : 'text-nature-500 hover:text-nature-700 dark:hover:text-nature-300'}`}
   >
     🗺️ {t("Map View")}
   </button>
   <button 
     onClick={() => setMapType('satellite')}
     className={`px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all ${mapType === 'satellite' ? 'bg-earth-600 text-white shadow-[0_2px_10px_rgba(217,119,6,0.3)]' : 'text-nature-500 hover:text-nature-700 dark:hover:text-nature-300'}`}
   >
     🛰️ {t("Satellite View")}
   </button>
 </div>
 </div>
 </div>

 {/* Map Legend (Moved to Top) */}
 <div className="bg-nature-900 p-3 rounded-xl shadow-md flex flex-wrap gap-4 md:gap-8 justify-center">
 <div className="flex items-center gap-3">
 <div className="w-4 h-4 bg-green-500/40 border-2 border-green-500 rounded"></div>
 <span className="text-sm font-bold text-white tracking-wide">{t("Farm Boundary")}</span>
 </div>
 <div className="flex items-center gap-3">
 <div className="w-4 h-4 bg-yellow-500/40 border-2 border-yellow-500 rounded"></div>
 <span className="text-sm font-bold text-white tracking-wide">{t("Zone A (Area 1)")}</span>
 </div>
 <div className="flex items-center gap-3">
 <div className="w-4 h-4 bg-blue-500/40 border-2 border-blue-500 rounded"></div>
 <span className="text-sm font-bold text-white tracking-wide">{t("Zone B (Area 2)")}</span>
 </div>
 <div className="flex items-center gap-3">
 <div className="w-4 h-4 bg-red-500/40 border-2 border-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
 <span className="text-sm font-bold text-white tracking-wide">{t("Irrigation ON")}</span>
 </div>
 <div className="flex items-center gap-3">
 <img src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png" className="h-5 filter brightness-110 drop-shadow-md" alt="marker" />
 <span className="text-sm font-bold text-white tracking-wide">{t("Live IoT Sensor")}</span>
 </div>
 </div>

 <div className="bg-white dark:bg-nature-950 p-2 rounded-2xl border border-nature-200 dark:border-nature-800 shadow-sm flex-1 min-h-[500px] relative z-0">
 <MapContainer center={region.center} zoom={15} className="h-full w-full rounded-xl z-0">
 <MapController center={region.center} />
 <MapInvalidator />
 <TileLayer
 key={mapType}
 attribution={mapType === 'satellite' ? "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics" : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
 url={mapType === 'satellite' ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
 maxZoom={19}
 />

 <Polygon positions={region.boundary} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.15, weight: 2, dashArray: '6' }} />

 {/* Irrigation Zone Rectangles */}
 {(() => {
   const b = region.boundary;
   if (!b || b.length < 3) return null;
   const minLat = b.reduce((mn, c) => Math.min(mn, c[0]), Infinity);
   const maxLat = b.reduce((mx, c) => Math.max(mx, c[0]), -Infinity);
   const minLon = b.reduce((mn, c) => Math.min(mn, c[1]), Infinity);
   const maxLon = b.reduce((mx, c) => Math.max(mx, c[1]), -Infinity);
   const midLat = (minLat + maxLat) / 2;
   const gap = (maxLat - minLat) * 0.02;
   const pad = (maxLat - minLat) * 0.03;
   const zoneARect = [[maxLat - pad, minLon + pad], [maxLat - pad, maxLon - pad], [midLat + gap, maxLon - pad], [midLat + gap, minLon + pad]];
   const zoneBRect = [[midLat - gap, minLon + pad], [midLat - gap, maxLon - pad], [minLat + pad, maxLon - pad], [minLat + pad, minLon + pad]];

   const sd = sensorData;
   const getZoneColor = (m, irr) => irr ? '#ef4444' : m > 80 ? '#3b82f6' : m >= 35 ? '#22c55e' : m >= 20 ? '#eab308' : '#ef4444';
   const getBadge = (m, irr) => {
     if (irr) return { cls: 'bg-red-100 text-red-600 border-red-200', lbl: '🔴 PUMP ON' };
     if (m > 80) return { cls: 'bg-blue-100 text-blue-600 border-blue-200', lbl: '🔵 SATURATED' };
     if (m >= 35) return { cls: 'bg-green-100 text-green-700 border-green-200', lbl: '🟢 OPTIMAL' };
     if (m >= 20) return { cls: 'bg-orange-100 text-orange-600 border-orange-200', lbl: '🟡 DRY/WARNING' };
     return { cls: 'bg-red-100 text-red-600 border-red-200', lbl: '🔴 CRITICAL' };
   };
   const zoneAColor = getZoneColor(sd?.avg1 ?? 0, sd?.irr1);
   const zoneBColor = getZoneColor(sd?.avg2 ?? 0, sd?.irr2);
   const badgeA = getBadge(sd?.avg1 ?? 0, sd?.irr1);
   const badgeB = getBadge(sd?.avg2 ?? 0, sd?.irr2);

   return (
     <>
       <Polygon positions={zoneARect} pathOptions={{ color: zoneAColor, fillColor: zoneAColor, fillOpacity: 0.35, weight: 2 }}>
         <Popup><div className="p-2 min-w-[160px]"><h4 className="font-black text-xs border-b pb-1 mb-2 uppercase">{t('Zone A (Area 1)')}</h4><p className="text-xs mb-1">{t('Avg Moisture:')} <b>{(sd?.avg1 ?? 0).toFixed(1)}%</b></p><p className="text-xs mb-1">{t('Temp:')} <b>{sd?.temp ?? 28}°C</b></p><p className="text-xs mb-2">{t('Soil 1:')} <b>{sd?.s1 ?? '--'}%</b> &bull; {t('Soil 2:')} <b>{sd?.s2 ?? '--'}%</b></p><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeA.cls}`}>{badgeA.lbl}</span>{sd?.updatedAt && <p className="text-[9px] text-gray-400 mt-2">{t('Updated:')} {new Date(sd.updatedAt).toLocaleTimeString()}</p>}</div></Popup>
       </Polygon>
       <Polygon positions={zoneBRect} pathOptions={{ color: zoneBColor, fillColor: zoneBColor, fillOpacity: 0.35, weight: 2 }}>
         <Popup><div className="p-2 min-w-[160px]"><h4 className="font-black text-xs border-b pb-1 mb-2 uppercase">{t('Zone B (Area 2)')}</h4><p className="text-xs mb-1">{t('Avg Moisture:')} <b>{(sd?.avg2 ?? 0).toFixed(1)}%</b></p><p className="text-xs mb-1">{t('Temp:')} <b>{sd?.temp ?? 28}°C</b></p><p className="text-xs mb-2">{t('Soil 3:')} <b>{sd?.s3 ?? '--'}%</b> &bull; {t('Soil 4:')} <b>{sd?.s4 ?? '--'}%</b></p><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeB.cls}`}>{badgeB.lbl}</span>{sd?.updatedAt && <p className="text-[9px] text-gray-400 mt-2">{t('Updated:')} {new Date(sd.updatedAt).toLocaleTimeString()}</p>}</div></Popup>
       </Polygon>
     </>
   );
 })()}

 {/* Sensor markers with live data */}
 {region.sensors.map((sensor, idx) => {
   const liveVal = sensorData ? [sensorData.s1, sensorData.s2, sensorData.s3, sensorData.s4][idx] : null;
   const displayVal = liveVal != null ? `${liveVal}%` : sensor.val;
   const isLow = liveVal != null && liveVal < 35;
   return (
   <Marker key={sensor.id} position={sensor.pos}>
   <Tooltip permanent direction="top" className="font-bold bg-white text-nature-900 shadow-md border-0 rounded text-xs px-2 py-0.5">
   {t("Sensor")} {sensor.id}
   </Tooltip>
   <Popup className="rounded-xl overflow-hidden shadow-lg border-none">
   <div className="p-1">
    <h4 className="font-bold text-nature-900 border-b pb-1 mb-2">{t("Sensor")} #{sensor.id}</h4>
   <p className="text-sm">{t("Type:")} <span className="font-medium">{sensor.type}</span></p>
   <p className="text-sm">{t("Value:")} <span className={`font-bold ${isLow ? 'text-orange-500' : 'text-green-600'}`}>{displayVal}</span></p>
   {sensorData?.updatedAt && <p className="text-xs text-nature-400 mt-2">{t('Updated:')} {new Date(sensorData.updatedAt).toLocaleTimeString()}</p>}
   </div>
   </Popup>
   </Marker>
   );
 })}

 {/* Highlight dry zone */}
 {region.dryZone && (
 <Circle
 center={region.dryZone}
 radius={50}
 pathOptions={{
 color: region.sensors.some(s => s.status === 'critical') ? '#ef4444' : '#f59e0b',
 fillColor: region.sensors.some(s => s.status === 'critical') ? '#ef4444' : '#f59e0b',
 fillOpacity: 0.4
 }}
 />
 )}
 </MapContainer>
 </div>
 </div>
 );
}
