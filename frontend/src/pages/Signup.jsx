import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, Mail, Lock, ArrowLeft, MapPin, Compass, Loader2 } from 'lucide-react';
import SearchableSelect from '../components/ui/SearchableSelect';
import { INDIA_STATES_DISTRICTS } from '../utils/indiaStatesDistricts';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';

export default function Signup() {
  const { t } = useTranslation();

 const navigate = useNavigate();
 const { user, signup } = useAuth();
 const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [districtsAvailable, setDistrictsAvailable] = useState([]);
 const [loading, setLoading] = useState(false);
 const [errors, setErrors] = useState({});
 const [success, setSuccess] = useState(false);

 // Auto-redirect if authenticated in another tab
 useEffect(() => {
 if (user) {
 navigate('/app/profile');
 }
 }, [user, navigate]);

 // Cross-device Magic Link Poller
 useEffect(() => {
 let interval;
 if (success) {
 interval = setInterval(async () => {
 const { data } = await supabase.auth.signInWithPassword({
 email,
 password
 });
 if (data?.session) {
 clearInterval(interval);
 toast.success("Verification detected! Loading dashboard...");
 navigate('/app/profile');
 }
 }, 10000); // Check every 10 seconds to avoid rate limits
 }
 return () => clearInterval(interval);
  }, [success, email, password, navigate]);

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
          
          if (detectedState === "Maharashtra") detectedState = "Maharashtra";

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

  const handleSignup = async (e) => {
  e.preventDefault();
  const newErrors = {};
  if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
  if (!state) newErrors.state = 'State is required.';
  if (!district) newErrors.district = 'District is required.';

 if (Object.keys(newErrors).length > 0) {
 setErrors(newErrors);
 return;
 }
 setErrors({});

 setLoading(true);

 try {
 // 1. Explicitly check if the email already exists in our table to prevent duplicates
 const { data: existingUser } = await supabase
 .from('users')
 .select('id')
 .eq('email', email)
 .maybeSingle();

 if (existingUser) {
 toast.error('This email is already registered. Please sign in instead.');
 setLoading(false);
 return;
 }

  // 2. Proceed with Supabase Auth Signup
  const { error, data } = await signup(email, password, {
    data: { state, district },
    emailRedirectTo: `${window.location.origin}/app/profile`
  });
 if (error) throw error;
 setSuccess(true);
 toast.success('Registration successful! Please check your email to verify.');
 } catch (error) {
 toast.error(error.message || 'Signup failed');
 } finally {
 setLoading(false);
 }
 };

 if (success) {
 return (
 <div className="min-h-screen bg-nature-50 dark:bg-nature-900 flex flex-col justify-center sm:px-6 lg:px-8">
 <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
 <div className="flex justify-center mb-6">
 <Sprout className="w-16 h-16 text-earth-500" />
 </div>
 <h2 className="text-3xl font-extrabold text-nature-900 dark:text-white mb-4">{t("Check your email")}</h2>
 <p className="text-nature-600 dark:text-white">
 {t("We've sent a verification link to")} <strong>{email}</strong>{t(". Please click the link to verify your account.")}
 </p>
 <div className="mt-8">
 <Link to="/login" className="text-earth-600 font-medium hover:text-earth-500">
 {t("Return to login")}
 </Link>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-nature-50 dark:bg-nature-900 flex flex-col justify-center sm:px-6 lg:px-8 py-12 relative">
 <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-nature-500 dark:text-white hover:text-earth-600 font-medium transition-colors">
 <ArrowLeft className="w-4 h-4" /> {t("Back to Home")}
 </Link>

 <div className="sm:mx-auto sm:w-full sm:max-w-md">
 <div className="flex justify-center mb-6">
 <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-nature-900 dark:text-white">
 <Sprout className="w-8 h-8 text-earth-500" />
 <span>{t("Agri")}<span className="text-earth-500">{t("Smart")}</span></span>
 </Link>
 </div>
 <h2 className="text-center text-3xl font-extrabold text-nature-900 dark:text-white">{t("Create a new account")}</h2>
 </div>

 <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
 <div className="bg-white dark:bg-nature-950 py-8 px-4 shadow-sm border border-nature-200 dark:border-nature-800 sm:rounded-xl sm:px-10">
 <form className="space-y-6" onSubmit={handleSignup}>
 <div>
 <label className="block text-sm font-medium text-nature-700 dark:text-white ">{t("Email address")} <span className="text-red-500">*</span></label>
 <div className="mt-1 relative">
 <Mail className="absolute left-3 top-2.5 h-4 w-4 text-nature-400 dark:text-white" />
 <input required type="email" value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="appearance-none block w-full pl-10 pr-3 py-2 border border-nature-300 rounded-md shadow-sm placeholder-nature-400 focus:outline-none focus:ring-earth-500 focus:border-earth-500 sm:text-sm" />
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-nature-700 dark:text-white ">{t("Password")} <span className="text-red-500">*</span></label>
 <div className="mt-1 relative">
 <Lock className="absolute left-3 top-2.5 h-4 w-4 text-nature-400 dark:text-white" />
 <input required type="password" value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="appearance-none block w-full pl-10 pr-3 py-2 border border-nature-300 rounded-md shadow-sm placeholder-nature-400 focus:outline-none focus:ring-earth-500 focus:border-earth-500 sm:text-sm" />
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-nature-700 dark:text-white ">{t("Confirm Password")} <span className="text-red-500">*</span></label>
 <div className="mt-1 relative">
 <Lock className="absolute left-3 top-2.5 h-4 w-4 text-nature-400 dark:text-white" />
 <input required type="password" value={confirmPassword}
 onChange={(e) => { setConfirmPassword(e.target.value); setErrors({...errors, confirmPassword: ''}); }}
 className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-nature-400 focus:outline-none focus:ring-earth-500 sm:text-sm ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-nature-300 focus:border-earth-500'}`} />
 </div>
 {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword}</p>}
 </div>

 <div>
   <div className="flex justify-between items-center mb-1">
     <label className="block text-sm font-medium text-nature-700 dark:text-white ">{t("Location")}</label>
     <button
       type="button"
       onClick={detectLocation}
       disabled={detectingLocation}
       className="text-xs font-semibold text-earth-600 hover:text-earth-700 dark:text-earth-400 flex items-center gap-1 disabled:opacity-50"
     >
       {detectingLocation ? <Loader2 className="w-3 h-3 animate-spin"/> : <Compass className="w-3 h-3" />}
       {t(detectingLocation ? "Detecting..." : "Auto-Detect")}
     </button>
   </div>
   
   <div className="space-y-3">
     <div>
       <div className="mt-1 relative w-full">
         <SearchableSelect
           icon={<MapPin className="h-4 w-4" />}
           options={Object.keys(INDIA_STATES_DISTRICTS)}
           value={state}
           placeholder={t("State")}
           error={errors.state}
           onChange={(val) => {
             setState(val);
             setErrors({...errors, state: ''});
             if (INDIA_STATES_DISTRICTS[val]) {
                 setDistrictsAvailable(INDIA_STATES_DISTRICTS[val]);
             } else {
                 setDistrictsAvailable([]);
             }
             setDistrict('');
           }}
         />
       </div>
       {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
     </div>

     <div>
       <div className="mt-1 relative w-full">
         <SearchableSelect
           icon={<MapPin className="h-4 w-4" />}
           options={districtsAvailable}
           value={district}
           placeholder={t("District")}
           error={errors.district}
           disabled={!state}
           onChange={(val) => {
             setDistrict(val);
             setErrors({...errors, district: ''});
           }}
         />
       </div>
       {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
     </div>
   </div>
 </div>

 <div>
 <button type="submit" disabled={loading}
 className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-earth-600 hover:bg-earth-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-earth-500 disabled:opacity-50"
 >
 {loading ? 'Registering...' : 'Sign up'}
 </button>
 </div>
 </form>
 <div className="mt-6 text-center border-t border-nature-200 dark:border-nature-800 pt-6">
 <p className="text-sm text-nature-600 dark:text-white">
 Already have an account?{' '}
 <Link to="/login" className="font-medium text-earth-600 hover:text-earth-500">
 {t("Sign in")}
 </Link>
 </p>
 </div>
 </div>
 </div>
 </div>
 );
}
