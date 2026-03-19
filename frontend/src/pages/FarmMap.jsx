import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const regions = {
    'delhi': {
        name: 'Haryana (Sonipat Farms)',
        center: [28.9814, 77.0175], // Rural area outside Sonipat
        boundary: [[28.9830, 77.0150], [28.9830, 77.0200], [28.9790, 77.0200], [28.9790, 77.0150]],
        sensors: [
            { id: 1, pos: [28.9820, 77.0160], type: 'Moisture', status: 'optimal', val: '42%' },
            { id: 2, pos: [28.9805, 77.0185], type: 'Moisture', status: 'warning', val: '28%' },
            { id: 3, pos: [28.9815, 77.0190], type: 'Temp', status: 'optimal', val: '25°C' }
        ],
        dryZone: [28.9805, 77.0185]
    },
    'punjab': {
        name: 'Punjab (Sangrur Fields)',
        center: [30.2500, 75.8300], // Rural agricultural land in Sangrur district
        boundary: [[30.2520, 75.8270], [30.2520, 75.8330], [30.2480, 75.8330], [30.2480, 75.8270]],
        sensors: [
            { id: 4, pos: [30.2510, 75.8285], type: 'Moisture', status: 'optimal', val: '45%' },
            { id: 5, pos: [30.2490, 75.8315], type: 'Moisture', status: 'optimal', val: '41%' }
        ],
        dryZone: null
    },
    'mp': {
        name: 'Madhya Pradesh (Sehore)',
        center: [23.2000, 77.0800], // Rural wheat fields near Sehore
        boundary: [[23.2020, 77.0770], [23.2020, 77.0830], [23.1980, 77.0830], [23.1980, 77.0770]],
        sensors: [
            { id: 6, pos: [23.2010, 77.0785], type: 'Moisture', status: 'critical', val: '18%' },
            { id: 7, pos: [23.1990, 77.0815], type: 'Temp', status: 'warning', val: '36°C' }
        ],
        dryZone: [23.2010, 77.0785]
    }
};

function MapController({ center }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 15, { animate: true, duration: 1.5 });
    }, [center, map]);
    return null;
}

export default function FarmMap() {
    const [selectedRegionKey, setSelectedRegionKey] = useState('delhi');
    const region = regions[selectedRegionKey];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-nature-900 tracking-tight">Interactive Farm Map</h1>
                    <p className="text-nature-500 mt-1">Real-time geospatial data, NDVI layers, and sensor locations.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-nature-200 shadow-sm">
                    <select
                        className="bg-nature-50 border border-nature-200 text-nature-800 text-sm rounded-lg focus:ring-earth-500 focus:border-earth-500 block px-3 py-2 font-medium cursor-pointer"
                        value={selectedRegionKey}
                        onChange={(e) => setSelectedRegionKey(e.target.value)}
                    >
                        {Object.entries(regions).map(([key, data]) => (
                            <option key={key} value={key}>{data.name}</option>
                        ))}
                    </select>
                    <div className="hidden sm:block w-px h-6 bg-nature-200 mx-1"></div>
                    <button className="bg-earth-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-earth-600 transition-colors shadow-sm whitespace-nowrap cursor-pointer">
                        NDVI Layer
                    </button>
                </div>
            </div>

            {/* Map Legend (Moved to Top) */}
            <div className="bg-nature-900 p-3 rounded-xl shadow-md flex flex-wrap gap-4 md:gap-8 justify-center">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500/40 border-2 border-green-500 rounded"></div>
                    <span className="text-sm font-bold text-white tracking-wide">Farm Boundary</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-orange-500/40 border-2 border-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                    <span className="text-sm font-bold text-white tracking-wide">Dry Zone Detected</span>
                </div>
                <div className="flex items-center gap-3">
                    <img src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png" className="h-5 filter brightness-110 drop-shadow-md" alt="marker" />
                    <span className="text-sm font-bold text-white tracking-wide">Live IoT Sensor</span>
                </div>
            </div>

            <div className="bg-white p-2 rounded-2xl border border-nature-200 shadow-sm flex-1 min-h-[500px] relative z-0">
                <MapContainer center={region.center} zoom={15} className="h-full w-full rounded-xl z-0">
                    <MapController center={region.center} />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
                            <Popup className="rounded-xl overflow-hidden shadow-lg border-none">
                                <div className="p-1">
                                    <h4 className="font-bold text-nature-900 border-b pb-1 mb-2">Sensor #{sensor.id}</h4>
                                    <p className="text-sm">Type: <span className="font-medium">{sensor.type}</span></p>
                                    <p className="text-sm">Value: <span className={`font-bold ${sensor.status === 'warning' ? 'text-orange-500' : sensor.status === 'critical' ? 'text-red-600' : 'text-green-600'}`}>{sensor.val}</span></p>
                                    <p className="text-xs text-nature-400 mt-2">Last updated: Just now</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}
