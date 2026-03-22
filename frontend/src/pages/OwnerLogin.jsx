import React, { useState, useEffect } from 'react';
import { useLiveTranslation } from '../hooks/useLiveTranslation';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function OwnerLogin() {
  const { tLive } = useLiveTranslation();

 const navigate = useNavigate();
 const { user } = useAuth();
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [loading, setLoading] = useState(false);

 // Auto-redirect if already logged in
 useEffect(() => {
 if (user && user.email === 'xyz@gmail.com') {
 navigate('/owner-dashboard');
 }
 }, [user, navigate]);

 const handleLogin = async (e) => {
 e.preventDefault();
 setLoading(true);

 if (email === 'xyz@gmail.com' && password === '654321') {
 setTimeout(() => {
 setLoading(false);
 toast.success('Logged in as Director successfully');
 navigate('/owner-dashboard');
 }, 500);
 } else {
 setTimeout(() => {
 setLoading(false);
 toast.error('Invalid director credentials');
 }, 500);
 }
 };

 return (
 <div className="min-h-screen bg-nature-50 dark:bg-nature-900 flex flex-col justify-center sm:px-6 lg:px-8 relative">
 <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-nature-500 dark:text-white hover:text-earth-600 font-medium transition-colors">
 <ArrowLeft className="w-4 h-4" /> {tLive("Back to Home")}
 </Link>

 <div className="sm:mx-auto sm:w-full sm:max-w-md">
 <div className="flex justify-center mb-6">
 <div className="flex items-center gap-2 text-2xl font-bold text-nature-900 dark:text-white">
 <Sprout className="w-8 h-8 text-earth-500" />
 <span>{tLive("Agri")}<span className="text-earth-500">{tLive("Smart")}</span></span>
 </div>
 </div>
 <h2 className="text-center text-3xl font-extrabold text-nature-900 dark:text-white">
 {tLive("Director Portal Login")}
 </h2>
 </div>

 <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
 <div className="bg-white dark:bg-nature-950 py-8 px-4 shadow-sm border border-nature-200 dark:border-nature-800 sm:rounded-xl sm:px-10">
 <form className="space-y-6" onSubmit={handleLogin}>
 <div>
 <label className="block text-sm font-medium text-nature-700 dark:text-white ">{tLive("Director Email")}</label>
 <div className="mt-1 relative">
 <Mail className="absolute left-3 top-2.5 h-4 w-4 text-nature-400 dark:text-white" />
 <input required type="email" value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="appearance-none block w-full pl-10 pr-3 py-2 border border-nature-300 dark:border-nature-700 dark:bg-nature-900 dark:text-white rounded-md shadow-sm placeholder-nature-400 focus:outline-none focus:ring-earth-500 sm:text-sm" placeholder="director@example.com"
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-nature-700 dark:text-white ">{tLive("Password")}</label>
 <div className="mt-1 relative">
 <Lock className="absolute left-3 top-2.5 h-4 w-4 text-nature-400 dark:text-white" />
 <input required type="password" value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="appearance-none block w-full pl-10 pr-3 py-2 border border-nature-300 dark:border-nature-700 dark:bg-nature-900 dark:text-white rounded-md shadow-sm placeholder-nature-400 focus:outline-none focus:ring-earth-500 sm:text-sm" placeholder="••••••••"
 />
 </div>
 </div>

 <div>
 <button type="submit" disabled={loading}
 className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-earth-600 hover:bg-earth-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-earth-500 disabled:opacity-50 transition-colors"
 >
 {loading ? 'Authenticating...' : 'Access Portal'}
 </button>
 </div>
 </form>
 </div>
 </div>
 </div>
 );
}
