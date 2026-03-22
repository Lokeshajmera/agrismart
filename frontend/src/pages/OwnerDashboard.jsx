import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Users, AlertCircle, Lightbulb, Bell, LogOut, Sprout, CheckCircle, Trash2, Settings, MapPin, Undo2, Maximize2, Minimize2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import SearchableSelect from '../components/ui/SearchableSelect';
import { INDIA_STATES_DISTRICTS } from '../utils/indiaStatesDistricts';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Polygon, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
 iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
 iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
 shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_URL = `http://${window.location.hostname}:5000/api`;

const MapAutoPan = ({ center }) => {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo(center, 12, { animate: true });
  }, [center, map]);
  return null;
};

const ExpandedMapInvalidator = ({ expanded }) => {
  const map = useMap();
  React.useEffect(() => {
    // Wait for the modal CSS transition to fully complete before recalculating width metrics
    const timer = setTimeout(() => {
       map.invalidateSize();
    }, 350);
    return () => clearTimeout(timer);
  }, [expanded, map]);
  return null;
};

const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

const OwnerDashboard = () => {
  const { t } = useTranslation();

 const navigate = useNavigate();
 const [stats, setStats] = useState({ users: 0, pendingComplaints: 0, suggestions: 0 });
 const [recentMembers, setRecentMembers] = useState([]);
 const [recentComplaints, setRecentComplaints] = useState([]);
 const [recentSuggestions, setRecentSuggestions] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [setupUserId, setSetupUserId] = useState('');
  const [setupFarmName, setSetupFarmName] = useState('');
  const [setupState, setSetupState] = useState('');
  const [setupDistrict, setSetupDistrict] = useState('');
  const [setupTotalSensors, setSetupTotalSensors] = useState(4);
  const [setupArea1Name, setSetupArea1Name] = useState('Zone A');
  const [setupArea1Sensors, setSetupArea1Sensors] = useState(2);
  const [setupArea2Name, setSetupArea2Name] = useState('Zone B');
  const [setupArea2Sensors, setSetupArea2Sensors] = useState(2);
  const [setupDistrictsAvailable, setSetupDistrictsAvailable] = useState([]);
  const [savingSetup, setSavingSetup] = useState(false);
  const [setupCoordinates, setSetupCoordinates] = useState([]);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);

  useEffect(() => {
    const fetchGeocode = async () => {
      if (setupDistrict) {
        try {
          // Attempt specific District lookup
          let res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${setupDistrict},IN&limit=1&appid=e5c8c35726d52c53ed66735380eae2e9`);
          let data = await res.json();
          
          // Fallback to broader State lookup if District fails
          if (!data || data.length === 0) {
             res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${setupState},IN&limit=1&appid=e5c8c35726d52c53ed66735380eae2e9`);
             data = await res.json();
          }

          if (data && data.length > 0) {
            setMapCenter([data[0].lat, data[0].lon]);
          }
        } catch (e) {
          console.error('Geocoding failed', e);
        }
      }
    };
    fetchGeocode();
  }, [setupDistrict, setupState]);

  useEffect(() => {
     const checkExistingConfig = async () => {
         if (!setupUserId) {
            setSetupCoordinates([]);
            return;
         }
         try {
            const { data } = await supabase.from('farm_setup').select('*').eq('user_id', setupUserId).single();
            if (data) {
                setSetupFarmName(data.farm_name || '');
                setSetupTotalSensors(data.total_sensors || 4);
                setSetupArea1Name(data.area1_name || 'Zone A');
                setSetupArea1Sensors(data.area1_sensors || 2);
                setSetupArea2Name(data.area2_name || 'Zone B');
                setSetupArea2Sensors(data.area2_sensors || 2);
                if (data.coordinates && Array.isArray(data.coordinates) && data.coordinates.length > 0) {
                    setSetupCoordinates(data.coordinates);
                } else {
                    setSetupCoordinates([]);
                }
            } else {
                setSetupCoordinates([]);
            }
         } catch (err) {
            console.error("No existing config or error", err);
         }
     };
     checkExistingConfig();
  }, [setupUserId]);

  const handleMapClick = (lat, lng) => {
     if (setupCoordinates.length < setupTotalSensors) {
        setSetupCoordinates([...setupCoordinates, [lat, lng]]);
     } else {
        toast.error(`You can only place ${setupTotalSensors} pins. Increase Total Sensors to add more.`);
     }
  };

  const handleUndoPin = (e) => {
     e.preventDefault();
     setSetupCoordinates(prev => prev.slice(0, -1));
  };

 useEffect(() => {
 fetchData();
 // Mock some system updates for the hackathon demo since there is no updates table
 setUpdates([
 { id: 1, title: 'AI Yield Model Updated', date: new Date().toLocaleDateString(), desc: 'The Indian yield prediction model has been improved by 15%.' },
 { id: 2, title: 'New Sensor Firmware', date: new Date(Date.now() - 86400000).toLocaleDateString(), desc: 'Firmware v2.4 pushed to all active ESP32 nodes.' },
 { id: 3, title: 'Satellite Data Integration', date: new Date(Date.now() - 172800000).toLocaleDateString(), desc: 'NDVI heatmaps are now syncing daily instead of weekly.' }
 ]);
 }, []);

 const fetchData = async () => {
 setLoading(true);
 try {
 // Direct fetch from Supabase. We do NOT use the user(...) join because Supabase
 // throws a 400 error due to missing explicit foreign keys between complaints/users.
 const [
 { data: complData, error: complError },
 { data: suggData, error: suggError },
 { data: userData, error: userError }
 ] = await Promise.all([
 supabase.from('complaints').select('*').order('created_at', { ascending: false }),
 supabase.from('suggestions').select('*').order('created_at', { ascending: false }),
 supabase.from('users').select('*').order('created_at', { ascending: false })
 ]);

 if (complError) console.error('Complaints fetch error:', complError);
 if (suggError) console.error('Suggestions fetch error:', suggError);
 if (userError) console.error('Users fetch error:', userError);

 const fetchedUsers = userData || [];
 const userMap = {};
 fetchedUsers.forEach(u => {
 userMap[u.id] = u;
 });

 // Reconstruct the nested 'users' object so the UI code continues to work
 const fetchedComplaints = (complData || []).map(c => ({
 ...c,
 users: userMap[c.user_id] || null
 }));

 const fetchedSuggestions = (suggData || []).map(s => ({
 ...s,
 users: userMap[s.user_id] || null
 }));

 setRecentComplaints(fetchedComplaints);
 setRecentSuggestions(fetchedSuggestions);
 setRecentMembers(fetchedUsers);

 setStats({
 users: fetchedUsers.length,
 pendingComplaints: fetchedComplaints.filter(c => c.status === 'pending').length,
 suggestions: fetchedSuggestions.length
 });
 } catch (error) {
 console.error(error);
 toast.error('Failed to fetch dashboard data.');
 } finally {
 setLoading(false);
 }
 };

 const handleResolveComplaint = async (id) => {
 try {
 const { error } = await supabase.from('complaints').update({ status: 'resolved' }).eq('id', id);
 if (error) throw error;
 setRecentComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'resolved' } : c));
 setStats(prev => ({ ...prev, pendingComplaints: Math.max(0, prev.pendingComplaints - 1) }));
 toast.success('Complaint marked as resolved');
 } catch (error) {
 toast.error('Failed to resolve complaint');
 }
 };

 const handleDeleteComplaint = async (id) => {
 try {
 const { error } = await supabase.from('complaints').delete().eq('id', id);
 if (error) throw error;
 setRecentComplaints(prev => prev.filter(c => c.id !== id));
 toast.success('Complaint permanently deleted');
 } catch (error) {
 toast.error('Failed to delete complaint');
 }
 };

  const handleDeleteSuggestion = async (id) => {
  try {
  const { error } = await supabase.from('suggestions').delete().eq('id', id);
  if (error) throw error;
  setRecentSuggestions(prev => prev.filter(s => s.id !== id));
  setStats(prev => ({ ...prev, suggestions: Math.max(0, prev.suggestions - 1) }));
  toast.success('Suggestion removed');
  } catch (error) {
  toast.error('Failed to remove suggestion');
  }
  };

  const handleSaveFarmSetup = async (e) => {
    e.preventDefault();
    if (!setupUserId) {
      toast.error(t('Please select a farmer.'));
      return;
    }
    if (setupArea1Sensors + setupArea2Sensors > setupTotalSensors) {
      toast.error(t('Combined Area Sensors cannot exceed Total Sensors!'));
      return;
    }
    if (setupCoordinates.length < setupTotalSensors) {
      toast.error(t(`Please place all ${setupTotalSensors} pins onto the map to define the precise farm boundary.`));
      return;
    }

    setSavingSetup(true);
    try {
      const selectedMem = recentMembers.find(m => m.id === setupUserId);
      const payload = {
         user_id: setupUserId,
         farmer_id: selectedMem ? selectedMem.farmer_id : null,
         farm_name: setupFarmName,
         state: setupState,
         district: setupDistrict,
         coordinates: setupCoordinates, // Writing the JSONB Multi-Pin Polygon array
         total_sensors: setupTotalSensors,
         area1_name: setupArea1Name,
         area1_sensors: setupArea1Sensors,
         area2_name: setupArea2Name,
         area2_sensors: setupArea2Sensors
      };
      
      const { error } = await supabase.from('farm_setup').upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      
      toast.success(t('Farm Configuration saved successfully!'));
      
      // Auto-clear form
      setSetupUserId('');
      setSetupFarmName('');
      setSetupState('');
      setSetupDistrict('');
      setSetupCoordinates([]);
      setSetupTotalSensors(4);
      setSetupArea1Name('Zone A');
      setSetupArea1Sensors(2);
      setSetupArea2Name('Zone B');
      setSetupArea2Sensors(2);
      
    } catch (err) {
      console.error("Supabase Save Error:", err);
      toast.error(err?.message || t('Failed to save Farm Configuration.'));
    } finally {
      setSavingSetup(false);
    }
  };

 const handleLogout = () => {
 toast.success('Logged out successfully');
 navigate('/');
 };

 if (loading) return <div className="p-8 flex justify-center text-nature-600 dark:text-white">{t("Loading Director Dashboard...")}</div>;

  return (
 <div className="min-h-screen bg-nature-50 dark:bg-nature-900">
 {/* Top Navigation */}
 <nav className="bg-white dark:bg-nature-950 border-b border-nature-200 dark:border-nature-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
 <div className="flex items-center gap-2">
 <Sprout className="w-8 h-8 text-earth-600" />
 <span className="text-xl font-bold text-nature-900 dark:text-white">{t("Agri")}<span className="text-earth-600">{t("Smart")}</span> <span className="text-nature-500 dark:text-white font-medium ml-2">{t("Director Portal")}</span></span>
 </div>
 <div className="flex items-center gap-4">
 <span className="text-sm font-medium text-nature-700 dark:text-white bg-nature-100 dark:bg-nature-800 px-3 py-1 rounded-full">{t("xyz@gmail.com")}</span>
 <button onClick={handleLogout} className="flex items-center gap-2 text-nature-600 dark:text-white hover:text-red-600 transition-colors">
 <LogOut className="w-5 h-5" />
 <span className="text-sm font-medium">{t("Exit")}</span>
 </button>
 </div>
 </nav>

 <div className="max-w-7xl mx-auto p-6 space-y-8 mt-4">
 <header>
 <h1 className="text-3xl font-bold text-nature-900 dark:text-white mb-2">{t("Welcome, Director")}</h1>
 <p className="text-nature-600 dark:text-white">{t("Here is the latest overview of the AgriSmart platform.")}</p>
 </header>

 {/* Quick Stats Grid */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-white dark:bg-nature-950 p-6 rounded-2xl shadow-sm border border-nature-200 dark:border-nature-800 flex items-center gap-4">
 <div className="p-4 bg-blue-100 rounded-xl text-blue-600">
 <Users className="w-7 h-7" />
 </div>
 <div>
 <p className="text-sm text-nature-500 dark:text-white font-medium uppercase tracking-wide">{t("Total Members")}</p>
 <p className="text-3xl font-bold text-nature-900 dark:text-white">{stats.users}</p>
 </div>
 </div>
 <div className="bg-white dark:bg-nature-950 p-6 rounded-2xl shadow-sm border border-nature-200 dark:border-nature-800 flex items-center gap-4">
 <div className="p-4 bg-red-100 rounded-xl text-red-600">
 <AlertCircle className="w-7 h-7" />
 </div>
 <div>
 <p className="text-sm text-nature-500 dark:text-white font-medium uppercase tracking-wide">{t("Pending Issues")}</p>
 <p className="text-3xl font-bold text-nature-900 dark:text-white">{stats.pendingComplaints}</p>
 </div>
 </div>
 <div className="bg-white dark:bg-nature-950 p-6 rounded-2xl shadow-sm border border-nature-200 dark:border-nature-800 flex items-center gap-4">
 <div className="p-4 bg-yellow-100 rounded-xl text-yellow-600">
 <Lightbulb className="w-7 h-7" />
 </div>
 <div>
 <p className="text-sm text-nature-500 dark:text-white font-medium uppercase tracking-wide">{t("New Suggestions")}</p>
 <p className="text-3xl font-bold text-nature-900 dark:text-white">{stats.suggestions}</p>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Complaints */}
 <section className="bg-white dark:bg-nature-950 rounded-2xl shadow-sm border border-nature-200 dark:border-nature-800 overflow-hidden flex flex-col h-[500px]">
 <div className="p-5 border-b border-nature-100 dark:border-nature-700/50 bg-nature-50 dark:bg-nature-900 flex justify-between items-center shrink-0">
 <h2 className="text-lg font-bold text-nature-900 dark:text-white flex items-center gap-2">
 <AlertCircle className="w-5 h-5 text-red-500" /> {t("All Complaints")}
 </h2>
 </div>
 <div className="divide-y divide-nature-100 overflow-y-auto grow">
 {recentComplaints.length > 0 ? recentComplaints.map(c => (
 <div key={c.id} className="p-5 hover:bg-nature-50 dark:hover:bg-nature-800 dark:bg-nature-900 transition-colors">
 <div className="flex justify-between items-start mb-2">
 <div className="font-semibold text-nature-900 dark:text-white flex items-center gap-2">
 <span className="font-mono bg-earth-100 text-earth-700 dark:bg-earth-900/30 dark:text-earth-400 px-2 py-0.5 rounded text-xs font-bold tracking-wider">
 CMP{c.id.toString().padStart(3, '0')}
 </span>
 {c.users?.name || 'Unknown User'} <span className="text-nature-400 dark:text-white text-sm font-normal">({c.users?.farmer_id})</span>
 </div>
 <div className="flex items-center gap-3">
 <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
 c.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
 }`}>
 {c.status === 'resolved' ? 'Resolved' : 'Pending'}
 </span>
 
 {c.status === 'resolved' ? (
 <button onClick={() => handleDeleteComplaint(c.id)}
 className="p-1.5 rounded-lg transition-colors border border-transparent text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/40 hover:border-red-200"
 title="Delete permanently"
 >
 <Trash2 className="w-5 h-5" />
 </button>
 ) : (
 <button onClick={() => handleResolveComplaint(c.id)}
 className="p-1.5 rounded-lg transition-colors border border-transparent text-nature-400 dark:text-white hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40 hover:border-green-200"
 title="Mark as Resolved"
 >
 <CheckCircle className="w-5 h-5" />
 </button>
 )}
 </div>
 </div>
 <p className="text-nature-600 dark:text-white text-sm mb-2"><span className="font-semibold capitalize text-nature-800 dark:text-white">{c.category}:</span> {c.message}</p>
 <div className="flex justify-between items-center text-xs text-nature-400 dark:text-white font-medium">
 <span></span>
 <span>{new Date(c.created_at).toLocaleDateString()}</span>
 </div>
 </div>
 )) : <div className="p-8 text-center text-nature-500 dark:text-white">{t("No complaints found.")}</div>}
 </div>
 </section>

 {/* Suggestions */}
 <section className="bg-white dark:bg-nature-950 rounded-2xl shadow-sm border border-nature-200 dark:border-nature-800 overflow-hidden flex flex-col h-[500px]">
 <div className="p-5 border-b border-nature-100 dark:border-nature-700/50 bg-nature-50 dark:bg-nature-900 flex justify-between items-center shrink-0">
 <h2 className="text-lg font-bold text-nature-900 dark:text-white flex items-center gap-2">
 <Lightbulb className="w-5 h-5 text-yellow-500" /> {t("All Suggestions")}
 </h2>
 </div>
 <div className="divide-y divide-nature-100 overflow-y-auto grow">
 {recentSuggestions.length > 0 ? recentSuggestions.map(s => (
 <div key={s.id} className="p-5 hover:bg-nature-50 dark:hover:bg-nature-800 dark:bg-nature-900 transition-colors">
 <div className="flex justify-between items-center mb-2">
 <div className="font-semibold text-nature-900 dark:text-white">{s.users?.name || 'Unknown User'}</div>
 <div className="flex items-center gap-4">
 <span className="text-xs text-nature-400 dark:text-white font-medium">{new Date(s.created_at).toLocaleDateString()}</span>
 <button onClick={() => handleDeleteSuggestion(s.id)}
 className="p-1.5 text-nature-400 dark:text-white hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-colors border border-transparent hover:border-green-200"
 title="Mark as Reviewed & Remove"
 >
 <CheckCircle className="w-5 h-5" />
 </button>
 </div>
 </div>
 <p className="text-nature-600 dark:text-white text-sm">{s.message}</p>
 </div>
 )) : <div className="p-8 text-center text-nature-500 dark:text-white">{t("No suggestions found.")}</div>}
 </div>
 </section>

 {/* Members List */}
 <section className="bg-white dark:bg-nature-950 rounded-2xl shadow-sm border border-nature-200 dark:border-nature-800 overflow-hidden flex flex-col h-[500px]">
 <div className="p-5 border-b border-nature-100 dark:border-nature-700/50 bg-nature-50 dark:bg-nature-900 flex justify-between items-center shrink-0">
 <h2 className="text-lg font-bold text-nature-900 dark:text-white flex items-center gap-2">
 <Users className="w-5 h-5 text-blue-500" /> {t("All Members")}
 </h2>
 </div>
 <div className="divide-y divide-nature-100 overflow-y-auto grow">
 {recentMembers.length > 0 ? recentMembers.map(m => (
 <div key={m.id} className="p-4 flex items-center justify-between hover:bg-nature-50 dark:hover:bg-nature-800 dark:bg-nature-900 transition-colors">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-earth-100 text-earth-700 flex items-center justify-center font-bold text-sm">
 {m.name.charAt(0)}
 </div>
 <div>
 <p className="font-semibold text-nature-900 dark:text-white text-sm">{m.name}</p>
 <p className="text-xs text-nature-500 dark:text-white">{m.email}</p>
 </div>
 </div>
  <div className="text-right flex flex-col items-end gap-2 shrink-0">
   <div>
     <p className="text-sm font-bold text-earth-600 dark:text-earth-400">{m.farmer_id}</p>
     <p className="text-xs text-nature-400 dark:text-white">{new Date(m.created_at).toLocaleDateString()}</p>
   </div>
   <button 
        onClick={() => {
        setSetupUserId(m.id);
        const farmer = recentMembers.find(f => f.id === m.id);
        if (farmer) {
           if (farmer.state) {
               setSetupState(farmer.state);
               setSetupDistrictsAvailable(INDIA_STATES_DISTRICTS[farmer.state] || []);
           }
           if (farmer.district) setSetupDistrict(farmer.district);
        }
        setIsMapExpanded(true);
     }}
     className="flex items-center gap-1.5 text-xs font-bold text-white bg-nature-800 hover:bg-earth-600 transition-colors px-3 py-1.5 rounded-lg shadow-sm"
   >
     <Settings className="w-3.5 h-3.5" /> {t("View Setup")}
   </button>
  </div>
  </div>
  )) : <div className="p-8 text-center text-nature-500 dark:text-white">{t("No members found.")}</div>}
  </div>
  </section>

  {/* Farm Configurator */}
  <section id="farm-configurator" className="bg-white dark:bg-nature-950 rounded-2xl shadow-sm border border-nature-200 dark:border-nature-800 overflow-hidden flex flex-col h-[500px]">
    <div className="p-5 border-b border-nature-100 dark:border-nature-700/50 bg-nature-50 dark:bg-nature-900 flex justify-between items-center shrink-0">
      <h2 className="text-lg font-bold text-nature-900 dark:text-white flex items-center gap-2">
        <Settings className="w-5 h-5 text-purple-500" /> {t("Farm Setup Configurator")}
      </h2>
    </div>
    <div className="p-5 overflow-y-auto grow custom-scrollbar">
      <form onSubmit={handleSaveFarmSetup} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-nature-700 dark:text-white mb-1">{t("Select Farmer")} *</label>
          <select 
            required
            value={setupUserId}
            onChange={(e) => {
               const val = e.target.value;
               setSetupUserId(val);
               const farmer = recentMembers.find(m => m.id === val);
               if (farmer) {
                  if (farmer.state) {
                     setSetupState(farmer.state);
                     setSetupDistrictsAvailable(INDIA_STATES_DISTRICTS[farmer.state] || []);
                  }
                  if (farmer.district) setSetupDistrict(farmer.district);
               }
            }}
            className="w-full text-sm border border-nature-300 dark:border-nature-700 rounded-md p-2 bg-white dark:bg-nature-900 text-nature-900 dark:text-white"
          >
            <option value="">{t("-- Choose Farmer --")}</option>
            {recentMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.farmer_id})</option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-nature-700 dark:text-white mb-1">{t("Farm Name")} *</label>
            <input 
              type="text" required value={setupFarmName} onChange={(e) => setSetupFarmName(e.target.value)}
              placeholder="e.g. Green Valley Farm"
              className="w-full text-sm border border-nature-300 dark:border-nature-700 rounded-md p-2 bg-white dark:bg-nature-900 text-nature-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-nature-700 dark:text-white mb-1">{t("State")} *</label>
            <SearchableSelect
               icon={<MapPin className="h-4 w-4" />}
               options={Object.keys(INDIA_STATES_DISTRICTS)}
               value={setupState}
               placeholder={t("State")}
               onChange={(val) => {
                 setSetupState(val);
                 if (INDIA_STATES_DISTRICTS[val]) {
                     setSetupDistrictsAvailable(INDIA_STATES_DISTRICTS[val]);
                 } else {
                     setSetupDistrictsAvailable([]);
                 }
                 setSetupDistrict('');
               }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-nature-700 dark:text-white mb-1">{t("District")} *</label>
            <SearchableSelect
               icon={<MapPin className="h-4 w-4" />}
               options={setupDistrictsAvailable}
               value={setupDistrict}
               placeholder={t("District")}
               disabled={!setupState}
               onChange={(val) => setSetupDistrict(val)}
            />
          </div>
        </div>

        <div className="border-t border-nature-200 dark:border-nature-700 pt-5 mt-4">
          <label className="block text-xs font-semibold text-nature-700 dark:text-white mb-3">{t("Sensor Distribution")}</label>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-medium w-32">{t("Total Sensors:")}</span>
            <input type="number" min="1" max="100" className="w-20 text-sm border border-nature-300 dark:border-nature-700 rounded-md p-1.5 focus:border-earth-500" value={setupTotalSensors} onChange={(e) => {
               const val = parseInt(e.target.value)||1;
               setSetupTotalSensors(val);
               if (setupCoordinates.length > val) {
                  setSetupCoordinates(setupCoordinates.slice(0, val));
               }
            }} />
          </div>
          <div className="space-y-2 bg-nature-50 dark:bg-nature-900/50 p-3 rounded-xl border border-nature-100 dark:border-nature-800">
             <div className="flex gap-2">
                <input type="text" value={setupArea1Name} onChange={e => setSetupArea1Name(e.target.value)} placeholder="Area 1 Name" className="flex-1 text-sm border border-nature-300 dark:border-nature-700 rounded-md p-1.5" />
                <input type="number" value={setupArea1Sensors} onChange={e => setSetupArea1Sensors(parseInt(e.target.value)||0)} min="0" className="w-16 text-sm border border-nature-300 dark:border-nature-700 rounded-md p-1.5" title="Sensors in Area 1" />
             </div>
             <div className="flex gap-2">
                <input type="text" value={setupArea2Name} onChange={e => setSetupArea2Name(e.target.value)} placeholder="Area 2 Name" className="flex-1 text-sm border border-nature-300 dark:border-nature-700 rounded-md p-1.5" />
                <input type="number" value={setupArea2Sensors} onChange={e => setSetupArea2Sensors(parseInt(e.target.value)||0)} min="0" className="w-16 text-sm border border-nature-300 dark:border-nature-700 rounded-md p-1.5" title="Sensors in Area 2" />
             </div>
          </div>
        </div>

        <div className={`transition-all duration-300 ease-in-out ${isMapExpanded ? 'fixed inset-0 z-[9999] shadow-2xl overflow-hidden bg-white dark:bg-nature-900 border-0 flex flex-col' : 'border border-nature-200 dark:border-nature-700 rounded-lg overflow-hidden flex flex-col h-[400px] relative z-0 mt-5'}`}>
          
          {isMapExpanded && (
             <div className="bg-nature-900 text-white p-3 flex justify-between items-center shadow-md z-10 shrink-0">
                <h3 className="font-bold flex items-center gap-2"><MapPin className="w-5 h-5 text-earth-400" /> {t("Fullscreen Map Editor")}</h3>
                <button type="button" onClick={() => setIsMapExpanded(false)} className="bg-earth-600 hover:bg-earth-500 transition-colors px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md">
                   <Minimize2 className="w-5 h-5" /> {t("Close Map Editor")}
                </button>
             </div>
          )}

          <div className="flex-1 relative z-0">
             <MapContainer center={mapCenter} zoom={6} className="w-full h-full z-0">
               <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
               <MapAutoPan center={mapCenter} />
               <ExpandedMapInvalidator expanded={isMapExpanded} />
               <MapClickHandler onLocationSelect={handleMapClick} />
               
               {setupCoordinates.length > 0 && (
                 <Polygon positions={setupCoordinates} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.3 }} />
               )}

               {setupCoordinates.map((coord, idx) => (
                 <Marker key={idx} position={coord}>
                    <Tooltip permanent direction="top" className="font-bold bg-white text-nature-900 shadow-md border-0 rounded text-xs px-2 py-0.5">
                       {t("Sensor")} {idx + 1}
                    </Tooltip>
                 </Marker>
               ))}
             </MapContainer>
          </div>

          {/* Map Overlays */}
          <div className={`absolute ${isMapExpanded ? 'top-20 left-4' : 'top-2 right-2'} z-[400] flex flex-col gap-2 pointer-events-none`}>
            <div className="bg-white/95 dark:bg-nature-900/95 py-2 px-3 rounded-lg shadow-md border border-nature-200 dark:border-nature-700 text-xs font-semibold text-nature-800 dark:text-white flex flex-col gap-1 pointer-events-auto backdrop-blur-sm">
              <span className="flex items-center justify-between gap-4">
                 {t("Pins Placed:")} <span className="font-black text-earth-600">{setupCoordinates.length} / {setupTotalSensors}</span>
              </span>
              <p className="text-nature-500 font-medium text-[10px] w-32 leading-tight">{t("Click corners of field to outline farm boundaries and drop sensors.")}</p>
            </div>
            
            <div className="flex flex-col gap-2 pointer-events-auto w-32">
               <button 
                  type="button" 
                  onClick={handleUndoPin} 
                  disabled={setupCoordinates.length === 0} 
                  className="flex items-center justify-center gap-1.5 bg-nature-800/90 hover:bg-earth-600 text-white p-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md backdrop-blur-sm"
               >
                  <Undo2 className="w-4 h-4" /> {t("Undo Pin")}
               </button>
               
               {!isMapExpanded && (
                 <button 
                    type="button" 
                    onClick={() => setIsMapExpanded(true)} 
                    className="flex items-center justify-center gap-1.5 bg-nature-800/90 hover:bg-blue-500 text-white p-2 rounded-lg text-xs font-bold transition-all shadow-md backdrop-blur-sm"
                 >
                    <Maximize2 className="w-4 h-4" /> {t("Expand")}
                 </button>
               )}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button type="submit" disabled={savingSetup} className="w-full bg-earth-600 hover:bg-earth-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 shadow-md flex items-center justify-center gap-2 text-lg">
            <CheckCircle className="w-5 h-5" /> {savingSetup ? t("Deploying...") : t("Deploy Farm Setup Layout")}
          </button>
        </div>
      </form>
    </div>
  </section>

  </div>
 </div>
 </div>
 );
};

export default OwnerDashboard;
