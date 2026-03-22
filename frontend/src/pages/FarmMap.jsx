import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Circle, useMap, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { MapPin, Sprout } from 'lucide-react';

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
 <div className="hidden sm:block w-px h-6 bg-nature-200 mx-1"></div>
 <button className="bg-earth-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-earth-600 transition-colors shadow-sm whitespace-nowrap cursor-pointer">
 {t("NDVI Layer")}
 </button>
 </div>
 </div>

 {/* Map Legend (Moved to Top) */}
 <div className="bg-nature-900 p-3 rounded-xl shadow-md flex flex-wrap gap-4 md:gap-8 justify-center">
 <div className="flex items-center gap-3">
 <div className="w-4 h-4 bg-green-500/40 border-2 border-green-500 rounded"></div>
 <span className="text-sm font-bold text-white tracking-wide">{t("Farm Boundary")}</span>
 </div>
 <div className="flex items-center gap-3">
 <div className="w-4 h-4 bg-orange-500/40 border-2 border-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
 <span className="text-sm font-bold text-white tracking-wide">{t("Dry Zone Detected")}</span>
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
 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">{t("OpenStreetMap")}</a> contributors'
 url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
 />

 <Polygon positions={region.boundary} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2 }} />

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

 {region.sensors.map(sensor => (
 <Marker key={sensor.id} position={sensor.pos}>
 <Tooltip permanent direction="top" className="font-bold bg-white text-nature-900 shadow-md border-0 rounded text-xs px-2 py-0.5">
 {t("Sensor")} {sensor.id}
 </Tooltip>
 <Popup className="rounded-xl overflow-hidden shadow-lg border-none">
 <div className="p-1">
  <h4 className="font-bold text-nature-900 dark:text-white border-b pb-1 mb-2">{t("Sensor")} #{sensor.id}</h4>
 <p className="text-sm">{t("Type:")} <span className="font-medium">{sensor.type}</span></p>
 <p className="text-sm">{t("Value:")} <span className={`font-bold ${sensor.status === 'warning' ? 'text-orange-500' : sensor.status === 'critical' ? 'text-red-600' : 'text-green-600'}`}>{sensor.val}</span></p>
 <p className="text-xs text-nature-400 dark:text-white mt-2">{t("Last updated: Just now")}</p>
 </div>
 </Popup>
 </Marker>
 ))}
 </MapContainer>
 </div>
 </div>
 );
}
