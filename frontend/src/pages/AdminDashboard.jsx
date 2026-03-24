import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Users, AlertCircle, Lightbulb, TrendingUp, Search } from 'lucide-react';
import { supabase } from '../supabaseClient';

import API_URL from '../config';

const API_BASE_URL = `${API_URL}/api`;


const AdminDashboard = () => {
  const { t } = useTranslation();
  const [farmers, setFarmers] = useState([]);
 const [complaints, setComplaints] = useState([]);
 const [suggestions, setSuggestions] = useState([]);
 const [loading, setLoading] = useState(true);
 const [stats, setStats] = useState({ users: 0, pendingComplaints: 0 });

 useEffect(() => {
 fetchData();
 }, []);

 const fetchData = async () => {
 setLoading(true);
 try {
 const { data: { session } } = await supabase.auth.getSession();
 const config = { headers: { Authorization: `Bearer ${session.access_token}` } };
 const [complResp, suggResp] = await Promise.all([
 axios.get(`${API_URL}/complaints`, config),
 axios.get(`${API_URL}/suggestions`, config)
 ]);

 setComplaints(complResp.data);
 setSuggestions(suggResp.data);
 // For farmers, we'd ideally have an admin endpoint to list users
 // Using search with empty query as a workaround for this mock/simple impl
 const farmResp = await axios.get(`${API_URL}/search?q=`, config);
 setFarmers(farmResp.data.users || []);

 setStats({
 users: farmResp.data.users?.length || 0,
 pendingComplaints: complResp.data.filter(c => c.status === 'pending').length
 });
 } catch (error) {
 toast.error('Failed to fetch admin data');
 } finally {
 setLoading(false);
 }
 };

 if (loading) return <div className="p-6">{t("Loading admin data...")}</div>;

  return (
 <div className="p-6 space-y-8 bg-nature-50 dark:bg-nature-900 min-h-screen">
 <header className="flex justify-between items-center mb-8">
 <div>
 <h1 className="text-3xl font-bold text-nature-900 dark:text-white">{t('admin')}</h1>
 <p className="text-nature-600 dark:text-white">{t("Platform Overview & Management")}</p>
 </div>
 </header>

 {/* Quick Stats */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 {[
 { label: 'Total Farmers', value: stats.users, icon: Users, color: 'bg-blue-500' },
 { label: 'Pending Complaints', value: stats.pendingComplaints, icon: AlertCircle, color: 'bg-red-500' },
 { label: 'New Suggestions', value: suggestions.length, icon: Lightbulb, color: 'bg-yellow-500' },
 { label: 'Active Users', value: stats.users, icon: TrendingUp, color: 'bg-green-500' },
 ].map((stat, i) => (
 <div key={i} className="bg-white dark:bg-nature-950 p-6 rounded-xl shadow-sm border border-nature-200 dark:border-nature-800">
 <div className="flex items-center gap-4">
 <div className={`p-3 rounded-lg text-white ${stat.color}`}>
 <stat.icon className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm text-nature-600 dark:text-white">{stat.label}</p>
 <p className="text-2xl font-bold text-nature-900 dark:text-white">{stat.value}</p>
 </div>
 </div>
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Complaints Section */}
 <section className="bg-white dark:bg-nature-950 rounded-xl shadow-sm border border-nature-200 dark:border-nature-800 overflow-hidden">
 <div className="p-6 border-b border-nature-100 dark:border-nature-700/50 flex justify-between items-center">
 <h2 className="text-xl font-bold flex items-center gap-2">
 <AlertCircle className="w-5 h-5 text-red-500" />
 {t("Recent Complaints")}
 </h2>
 </div>
 <div className="divide-y divide-nature-100">
 {complaints.length > 0 ? complaints.map((c) => (
 <div key={c.id} className="p-4 hover:bg-nature-50 dark:hover:bg-nature-800 dark:bg-nature-900">
 <div className="flex justify-between mb-1">
 <span className="font-medium text-nature-900 dark:text-white">{c.users?.name} ({c.users?.farmer_id})</span>
 <span className={`text-xs px-2 py-1 rounded-full ${
 c.status === 'pending' ? 'bg-red-100 text-red-600' : c.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
 }`}>
 {c.status.toUpperCase()}
 </span>
 </div>
 <p className="text-sm text-nature-600 dark:text-white mb-2">{c.message}</p>
 <span className="text-xs text-nature-400 dark:text-white">{new Date(c.created_at).toLocaleDateString()}</span>
 </div>
 )) : <p className="p-6 text-center text-nature-400 dark:text-white">{t("No complaints found")}</p>}
 </div>
 </section>

 {/* Suggestions Section */}
 <section className="bg-white dark:bg-nature-950 rounded-xl shadow-sm border border-nature-200 dark:border-nature-800 overflow-hidden">
 <div className="p-6 border-b border-nature-100 dark:border-nature-700/50">
 <h2 className="text-xl font-bold flex items-center gap-2">
 <Lightbulb className="w-5 h-5 text-yellow-500" />
 {t("Farmer Feedback")}
 </h2>
 </div>
 <div className="divide-y divide-nature-100">
 {suggestions.length > 0 ? suggestions.map((s) => (
 <div key={s.id} className="p-4 hover:bg-nature-50 dark:hover:bg-nature-800 dark:bg-nature-900">
 <div className="flex justify-between mb-1">
 <span className="font-medium text-nature-900 dark:text-white">{s.users?.name}</span>
 <span className="text-xs text-nature-400 dark:text-white">{new Date(s.created_at).toLocaleDateString()}</span>
 </div>
 <p className="text-sm text-nature-600 dark:text-white">{s.message}</p>
 </div>
 )) : <p className="p-6 text-center text-nature-400 dark:text-white">{t("No suggestions found")}</p>}
 </div>
 </section>
 </div>
 </div>
 );
};

export default AdminDashboard;
