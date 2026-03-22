import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { User, Phone, Mail, Hash, Loader2, MapPin, Compass } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { INDIA_STATES_DISTRICTS } from '../utils/indiaStatesDistricts';
import SearchableSelect from '../components/ui/SearchableSelect';

export default function Profile() {
  const { t } = useTranslation();

  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // Form fields
 const [name, setName] = useState('');
 const [phone, setPhone] = useState('+91');
 const [state, setState] = useState('');
 const [district, setDistrict] = useState('');
 const [detectingLocation, setDetectingLocation] = useState(false);
  const [districtsAvailable, setDistrictsAvailable] = useState([]);
 const [errors, setErrors] = useState({});

 useEffect(() => {
 if (user) {
 fetchProfile();
 }
 }, [user]);

 const fetchProfile = async () => {
 try {
 const { data, error } = await supabase
 .from('users')
 .select('*')
 .eq('id', user.id)
 .single();
 if (error && error.code !== 'PGRST116') {
 throw error;
 }
 if (data) {
 setProfile(data);
 setName(data.name || user?.user_metadata?.name || '');
 setPhone(data.phone || user?.user_metadata?.phone || '');
      setState(data.state || '');
      setDistrict(data.district || '');
      if (data.state && INDIA_STATES_DISTRICTS[data.state]) {
         setDistrictsAvailable(INDIA_STATES_DISTRICTS[data.state]);
      }
    } else {
 setName(user?.user_metadata?.name || '');
 setPhone(user?.user_metadata?.phone || '');
 }
 } catch (error) {
 console.error('Error fetching profile:', error);
 toast.error('Failed to load profile');
 } finally {
 setLoading(false);
 }
 };

 const generateFarmerId = async (firstName) => {
 const prefix = firstName.split(' ')[0].toUpperCase();
 const { count, error } = await supabase
 .from('users')
 .select('*', { count: 'exact', head: true })
 .ilike('name', `${prefix}%`);
 if (error) throw error;
 return `${prefix}${String((count || 0) + 1).padStart(3, '0')}`;
 };

 const detectLocation = () => {
 setDetectingLocation(true);
 if (!navigator.geolocation) {
 toast.error(t('Geolocation is not supported by your browser'));
 setDetectingLocation(false);
 return;
 }
 
 navigator.geolocation.getCurrentPosition(async (position) => {
 try {
 const { latitude, longitude } = position.coords;
 const API_KEY = 'e5c8c35726d52c53ed66735380eae2e9';
 const res = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`);
 const data = await res.json();
        if (data && data.length > 0) {
          const location = data[0];
          const detectedDistrict = location.name || '';
          let detectedState = location.state || '';
          
          if (detectedState === "Maharashtra") detectedState = "Maharashtra"; // Basic mapping check

          setDistrict(detectedDistrict);
          setState(detectedState);
          if (INDIA_STATES_DISTRICTS[detectedState]) {
             setDistrictsAvailable(INDIA_STATES_DISTRICTS[detectedState]);
          }
          toast.success(t('Location detected successfully!'));
 } else {
 toast.error(t('Could not resolve location details'));
 }
 } catch (error) {
 console.error('Geocoding error:', error);
 toast.error(t('Failed to detect location'));
 } finally {
 setDetectingLocation(false);
 }
 }, (error) => {
 console.error('Geolocation error:', error);
 toast.error(t('Permission to access location was denied'));
 setDetectingLocation(false);
 });
 };

 const handleSave = async (e) => {
 e.preventDefault();
 const newErrors = {};
 if (!name || !name.trim()) newErrors.name = 'Full Name is required';
 if (!phone || phone.trim() === '+91' || phone.replace(/\D/g,'').length < 10) newErrors.phone = 'Please enter a valid 10-digit mobile number';
 if (!state || !state.trim()) newErrors.state = 'State is required';
 if (!district || !district.trim()) newErrors.district = 'District is required';

 if (Object.keys(newErrors).length > 0) {
 setErrors(newErrors);
 return;
 }
 setErrors({});
 setSaving(true);
 try {
 let currentFarmerId = profile?.farmer_id;
 if (!currentFarmerId) {
 currentFarmerId = await generateFarmerId(name);
 }

 const updates = {
 id: user.id,
 email: user.email,
 name,
 phone,
 farmer_id: currentFarmerId,
 state,
 district
 };

 const { error } = await supabase
 .from('users')
 .upsert(updates);

 if (error) throw error;

 toast.success('Profile saved successfully');
 setIsEditing(false);
 fetchProfile();
 } catch (error) {
 console.error('Error saving profile:', error);
 toast.error(error.message || 'Failed to save profile');
 } finally {
 setSaving(false);
 }
 };

 if (loading) {
 return (
 <div className="flex justify-center items-center h-full">
 <Loader2 className="w-8 h-8 animate-spin text-earth-500" />
 </div>
 );
 }

 const isProfileComplete = profile && profile.name && profile.farmer_id && profile.state && profile.district;

 return (
 <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
 <div className="bg-white dark:bg-nature-950 shadow rounded-lg">
  <div className="px-4 py-5 sm:px-6 bg-nature-50 dark:bg-nature-900 border-b border-nature-200 dark:border-nature-800 flex justify-between items-center rounded-t-lg">
  <div>
  <h3 className="text-lg leading-6 font-medium text-nature-900 dark:text-white">
  {isProfileComplete ? 'Farmer Profile' : 'Complete Your Profile'}
  </h3>
  <p className="mt-1 max-w-2xl text-sm text-nature-500 dark:text-white">
  {t("Personal details and system identifiers.")}
  </p>
  </div>
  <div className="flex items-center gap-3">
  {isProfileComplete && profile.farmer_id && (
  <div className="bg-earth-100 px-3 py-1 rounded-full text-earth-800 text-sm font-semibold flex items-center gap-1">
  <Hash className="w-4 h-4" />
  {profile.farmer_id}
  </div>
  )}
  {isProfileComplete && (
  <button
    type="button"
    onClick={() => {
      if (isEditing) {
         setName(profile?.name || user?.user_metadata?.name || '');
         setPhone(profile?.phone || user?.user_metadata?.phone || '');
         setState(profile?.state || '');
         setDistrict(profile?.district || '');
         setErrors({});
      }
      setIsEditing(!isEditing);
    }}
    className="text-sm font-medium text-earth-600 hover:text-earth-700 dark:text-earth-400 bg-white dark:bg-nature-950 px-3 py-1.5 rounded-md border border-nature-200 dark:border-nature-800 shadow-sm transition-colors"
  >
    {isEditing ? t("Cancel") : t("Edit Details")}
  </button>
  )}
  </div>
  </div>
 <div className="px-4 py-5 sm:p-6">
 {!isProfileComplete && (
 <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
 <div className="flex">
 <div className="ml-3">
 <p className="text-sm text-yellow-700">
 {t("Your profile is incomplete. Please provide your Name and Mobile Number to generate your unique Farmer ID and access all features.")}
 </p>
 </div>
 </div>
 </div>
 )}

 <form onSubmit={handleSave} className="space-y-6">
 <div>
 <label className="block text-sm font-medium text-nature-700 dark:text-white ">{t("Email (from secure login)")}</label>
 <div className="mt-1 flex rounded-md shadow-sm">
 <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-nature-300 bg-nature-50 dark:bg-nature-900 text-nature-500 dark:text-white sm:text-sm">
 <Mail className="h-4 w-4" />
 </span>
 <input
 type="email"
 disabled
 value={user.email || 'N/A (Phone Login)'}
 className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-nature-300 bg-nature-50 dark:bg-nature-900 text-gray-500 sm:text-sm"
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-nature-700 dark:text-white ">{t("Full Name")} <span className="text-red-500">*</span></label>
 <div className="mt-1 flex rounded-md shadow-sm">
 <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-nature-300 bg-nature-50 dark:bg-nature-900 text-nature-500 dark:text-white sm:text-sm">
 <User className="h-4 w-4" />
 </span>
  <input
  type="text"
  required
  value={name}
  disabled={isProfileComplete && !isEditing}
  onChange={(e) => { setName(e.target.value); setErrors({...errors, name: ''}); }}
  className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border focus:ring-earth-500 sm:text-sm ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-nature-300 focus:border-earth-500'} ${isProfileComplete && !isEditing ? 'bg-nature-50 dark:bg-nature-900 text-nature-500 cursor-not-allowed' : ''}`}
  placeholder="Rahul Kumar"
  />
 </div>
 {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>}
 </div>

 <div>
 <label className="block text-sm font-medium text-nature-700 dark:text-white ">{t("Mobile Number")} <span className="text-red-500">*</span></label>
 <div className="mt-1 flex rounded-md shadow-sm">
 <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-nature-300 bg-nature-50 dark:bg-nature-900 text-nature-500 dark:text-white sm:text-sm gap-2">
 <Phone className="h-4 w-4" />
 +91
 </span>
  <input
  type="tel"
  required
  disabled={isProfileComplete && !isEditing}
  value={phone?.startsWith('+91') ? phone.slice(3) : (phone || '')}
  onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 10);
  setPhone('+91' + val); setErrors({...errors, phone: ''}); }}
  className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border focus:ring-earth-500 sm:text-sm ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-nature-300 focus:border-earth-500'} ${isProfileComplete && !isEditing ? 'bg-nature-50 dark:bg-nature-900 text-nature-500 cursor-not-allowed' : ''}`}
  placeholder="9876543210"
  maxLength={10}
  />
 </div>
 {errors.phone && <p className="text-red-500 text-xs mt-1.5">{errors.phone}</p>}
 </div>

 <div>
 <div className="flex justify-between items-center mb-1">
 <label className="block text-sm font-medium text-nature-700 dark:text-white ">{t("Location Details")} <span className="text-red-500">*</span></label>
  <button
  type="button"
  onClick={detectLocation}
  disabled={detectingLocation || (isProfileComplete && !isEditing)}
  className="text-xs font-semibold text-earth-600 hover:text-earth-700 dark:text-earth-400 flex items-center gap-1 disabled:opacity-50"
  >
  {detectingLocation ? <Loader2 className="w-3 h-3 animate-spin"/> : <Compass className="w-3 h-3" />}
  {t(detectingLocation ? "Detecting..." : "Detect Location")}
  </button>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
            <div className="mt-1 relative w-full">
               <SearchableSelect
                icon={<MapPin className="h-4 w-4" />}
                options={Object.keys(INDIA_STATES_DISTRICTS)}
                value={state}
                placeholder={t("State (e.g. Maharashtra)")}
                error={errors.state}
                disabled={isProfileComplete && !isEditing}
                onChange={(val) => {
                  setState(val);
                  setErrors({...errors, state: ''});
                  if (INDIA_STATES_DISTRICTS[val]) {
                      setDistrictsAvailable(INDIA_STATES_DISTRICTS[val]);
                  } else {
                      setDistrictsAvailable([]);
                  }
                  setDistrict(''); // Clear district when state changes
                }}
              />
            </div>
            {errors.state && <p className="text-red-500 text-xs mt-1.5">{errors.state}</p>}
          </div>
          <div>
            <div className="mt-1 relative w-full">
               <SearchableSelect
                icon={<MapPin className="h-4 w-4" />}
                options={districtsAvailable}
                value={district}
                placeholder={t("District (e.g. Nashik)")}
                error={errors.district}
                disabled={!state || (isProfileComplete && !isEditing)}
                onChange={(val) => {
                  setDistrict(val);
                  setErrors({...errors, district: ''});
                }}
              />
            </div>
            {errors.district && <p className="text-red-500 text-xs mt-1.5">{errors.district}</p>}
          </div>
        </div>
      </div>

  <div className="pt-4 flex justify-end">
  {(!isProfileComplete || isEditing) && (
    <button
    type="submit"
    disabled={saving}
    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-earth-600 hover:bg-earth-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-earth-500 disabled:opacity-50"
    >
    {saving ? 'Saving...' : (isProfileComplete ? 'Save Changes' : 'Complete Setup')}
    </button>
  )}
  </div>
 </form>
 </div>
 </div>
 </div>
 );
}
