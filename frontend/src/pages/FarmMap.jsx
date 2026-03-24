import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Circle, useMap, Tooltip, ImageOverlay } from 'react-leaflet';
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
    center: [18.2324, 73.8567],
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
    center: [28.9814, 77.0175],
    boundary: [[28.9830, 77.0150], [28.9830, 77.0200], [28.9790, 77.0200], [28.9790, 77.0150]],
    sensors: [
      { id: 4, pos: [28.9820, 77.0160], type: 'Moisture', status: 'optimal', val: '42%' },
      { id: 5, pos: [28.9805, 77.0185], type: 'Moisture', status: 'warning', val: '28%' },
      { id: 6, pos: [28.9815, 77.0190], type: 'Temp', status: 'optimal', val: '25°C' }
    ],
    dryZone: [28.9805, 77.0185]
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
  const [satelliteData, setSatelliteData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeSatelliteLayer, setActiveSatelliteLayer] = useState('ndvi');


  // Real-time sensor polling
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

  // Auto-trigger satellite analysis when region changes IF a layer is already active
  useEffect(() => {
    if (region.boundary && activeSatelliteLayer && !isAnalyzing) {
      handleSatelliteAnalyze(activeSatelliteLayer);
    }
  }, [selectedRegionKey]);


  useEffect(() => {
    const fetchUserLocation = async () => {
      setIsMapLocating(true);
      if (user && userProfile?.district) {
        try {
          const { data: setupData } = await supabase.from('farm_setup').select('*').eq('user_id', user.id).single();

          if (setupData && setupData.coordinates && Array.isArray(setupData.coordinates) && setupData.coordinates.length > 0) {
             const coords = setupData.coordinates;
             const centerLat = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
             const centerLng = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
             
             const customRegion = {
                name: setupData.farm_name || "Assigned Farm Layout",
                center: [centerLat, centerLng],
                boundary: coords,
                sensors: coords.slice(0, 4).map((pos, i) => ({ id: i+1, pos, type: 'IoT Sensor', status: 'optimal', val: '45%' })),
                dryZone: null
             };

             setRegions(prev => ({ 'my_farm': customRegion, ...prev }));
             setSelectedRegionKey('my_farm');
          } else {
             const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${userProfile.district},IN&limit=1&appid=${WEATHER_API_KEY}`);
             const data = await res.json();
             if (data && data.length > 0) {
               const { lat, lon, name } = data[0];
               const myRegion = {
                 name: `Your Regional Farm (${name})`,
                 center: [lat, lon],
                 boundary: [[lat+0.005, lon-0.005], [lat+0.005, lon+0.005], [lat-0.005, lon+0.005], [lat-0.005, lon-0.005]],
                 sensors: [{ id: 99, pos: [lat, lon], type: 'Regional', status: 'optimal', val: '45%' }],
                 dryZone: null
               };
               setRegions(prev => ({ 'my_farm': myRegion, ...prev }));
               setSelectedRegionKey('my_farm');
             }
          }
        } catch (e) {} finally { setIsMapLocating(false); }
      } else { setIsMapLocating(false); }
    };
    fetchUserLocation();
  }, [userProfile, user]);

  const handleSatelliteAnalyze = async (type) => {
    if (!region.boundary || region.boundary.length < 3) return;
    setIsAnalyzing(true);
    setMapType('satellite'); // Force satellite imagery for analysis
    const SATELLITE_API = import.meta.env.VITE_SATELLITE_API_URL || 'http://localhost:5001';
    try {
      const response = await fetch(`${SATELLITE_API}/api/satellite/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates: region.boundary, type })
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
          <div className="flex bg-nature-100 dark:bg-nature-800 rounded-lg p-1 border border-nature-200 dark:border-nature-700">
            <button 
              onClick={() => { setMapType('street'); setActiveSatelliteLayer(null); }}
              className={`px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all ${mapType === 'street' ? 'bg-white dark:bg-nature-700 text-nature-900 dark:text-white shadow-sm' : 'text-nature-500 hover:bg-white/50 dark:hover:bg-nature-700/50'}`}
            >
              🗺️ {t("Map View")}
            </button>
            <button 
              onClick={() => { setMapType('satellite'); setActiveSatelliteLayer(null); }}
              className={`px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all ${mapType === 'satellite' && !activeSatelliteLayer ? 'bg-earth-600 text-white shadow-sm' : 'text-nature-500 hover:bg-earth-600/20'}`}
            >
              🛰️ {t("Satellite View")}
            </button>
          </div>

          <div className="flex bg-nature-950/20 rounded-lg p-1 border border-nature-200 dark:border-nature-800">
            <button 
              onClick={() => activeSatelliteLayer === 'ndvi' ? setActiveSatelliteLayer(null) : handleSatelliteAnalyze('ndvi')}
              disabled={isAnalyzing}
              className={`px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-bold transition-all ${activeSatelliteLayer === 'ndvi' ? 'bg-green-600 text-white shadow-lg' : 'text-nature-500'}`}
            >
              {isAnalyzing && activeSatelliteLayer === 'ndvi' ? '...' : '🌱 NDVI (Health)'}
            </button>
            <button 
              onClick={() => activeSatelliteLayer === 'ndwi' ? setActiveSatelliteLayer(null) : handleSatelliteAnalyze('ndwi')}
              disabled={isAnalyzing}
              className={`px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-bold transition-all ${activeSatelliteLayer === 'ndwi' ? 'bg-blue-600 text-white shadow-lg' : 'text-nature-500'}`}
            >
              {isAnalyzing && activeSatelliteLayer === 'ndwi' ? '...' : '💧 NDWI (Water)'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-nature-900 p-3 rounded-xl shadow-md flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500/40 border-2 border-green-500 rounded"></div><span className="text-xs font-bold text-white">{t("Farm Boundary")}</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500/40 border-2 border-red-500 rounded-full"></div><span className="text-xs font-bold text-white">{t("Irrigation ON")}</span></div>
      </div>

      <div className="bg-white dark:bg-nature-950 p-2 rounded-2xl border border-nature-200 dark:border-nature-800 shadow-sm flex-1 min-h-[500px] relative z-0">
        <MapContainer center={region.center} zoom={15} className="h-full w-full rounded-xl z-0">
          <MapController center={region.center} />
          <MapInvalidator />
          <TileLayer
            key={mapType}
            attribution={mapType === 'satellite' ? "Tiles &copy; Esri" : '&copy; OpenStreetMap'}
            url={mapType === 'satellite' ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
          />

          {satelliteData && activeSatelliteLayer && (
            <ImageOverlay 
              url={satelliteData.image}
              bounds={[[satelliteData.bbox[0], satelliteData.bbox[1]], [satelliteData.bbox[2], satelliteData.bbox[3]]]}
              opacity={0.8}
              zIndex={100}
            />
          )}

          {!activeSatelliteLayer && (
            <>
              <Polygon positions={region.boundary} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1, weight: 2, dashArray: '6' }} />

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
                const getZoneColor = (m, irr) => irr ? '#ef4444' : m >= 35 ? '#22c55e' : '#f59e0b';
                
                return (
                  <>
                    <Polygon positions={zoneARect} pathOptions={{ color: getZoneColor(sd?.avg1, sd?.irr1), fillColor: getZoneColor(sd?.avg1, sd?.irr1), fillOpacity: 0.3, weight: 2 }}>
                      <Popup><div className="p-2"><h4 className="font-bold text-xs uppercase">{t('Zone A')}</h4><p className="text-xs">Moisture: {(sd?.avg1 ?? 0).toFixed(1)}%</p></div></Popup>
                    </Polygon>
                    <Polygon positions={zoneBRect} pathOptions={{ color: getZoneColor(sd?.avg2, sd?.irr2), fillColor: getZoneColor(sd?.avg2, sd?.irr2), fillOpacity: 0.3, weight: 2 }}>
                      <Popup><div className="p-2"><h4 className="font-bold text-xs uppercase">{t('Zone B')}</h4><p className="text-xs">Moisture: {(sd?.avg2 ?? 0).toFixed(1)}%</p></div></Popup>
                    </Polygon>
                  </>
                );
              })()}
            </>
          )}


          {region.sensors.map((sensor) => (
            <Marker key={sensor.id} position={sensor.pos}>
              <Tooltip permanent direction="top" className="font-bold text-[10px] px-1 py-0 shadow-none border-none">#{sensor.id}</Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
