import React, { useState, useEffect } from 'react';
import { User, Shield, Languages, Lock, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import API_URL from '../config';



const API_BASE_URL = `${API_URL}/api`;


export default function Settings() {
 const { t, i18n } = useTranslation();
 const [activeTab, setActiveTab] = useState('profile');
 const [profile, setProfile] = useState({ name: '', phone: '' });
 const [passwords, setPasswords] = useState({ new: '', confirm: '' });
 const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
 const [loading, setLoading] = useState(false);

 useEffect(() => {
 const fetchProfile = async () => {
 try {
 const { data: { session } } = await supabase.auth.getSession();
 if (!session) return;
 const { data } = await axios.get(`${API_URL}/user`, {
 headers: { Authorization: `Bearer ${session.access_token}` }
 });
 setProfile({ name: data.name || '', phone: data.phone || '' });
 } catch (err) {
 console.error('Failed to fetch profile', err);
 }
 };
 fetchProfile();
 }, []);

 const handleProfileUpdate = async (e) => {
 e.preventDefault();
 setLoading(true);
 try {
 const { data: { session } } = await supabase.auth.getSession();
 await axios.put(`${API_URL}/user/update`, profile, {
 headers: { Authorization: `Bearer ${session.access_token}` }
 });
 toast.success('Profile updated successfully');
 } catch (error) {
 toast.error(error.message);
 } finally {
 setLoading(false);
 }
 };

 const handlePasswordUpdate = async (e) => {
 e.preventDefault();
 if (passwords.new !== passwords.confirm) return toast.error('Passwords do not match');
 if (passwords.new.length < 6) return toast.error('Password must be at least 6 characters');
 setLoading(true);
 try {
 const { error } = await supabase.auth.updateUser({ password: passwords.new });
 if (error) throw error;
 toast.success('Password updated successfully');
 setPasswords({ new: '', confirm: '' });
 } catch (error) {
 toast.error(error.message);
 } finally {
 setLoading(false);
 }
 };

 const handleLanguageSave = () => {

 i18n.changeLanguage(selectedLang);
 toast.success('Language updated successfully');
 };

 const navItems = [
 { key: 'profile', label: 'Profile Info', icon: <User className="w-4 h-4" /> },
 { key: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> },
 { key: 'language', label: 'Language', icon: <Languages className="w-4 h-4" /> },
 ];

 return (
 <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 p-6">
 <div>
 <h1 className="text-3xl font-bold text-nature-900 dark:text-white tracking-tight">{t('settings')}</h1>
 <p className="text-nature-500 dark:text-white mt-1">{t("Manage your account and preferences.")}</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 {/* Sidebar */}
 <div className="space-y-1">
 {navItems.map(item => (
 <button
 key={item.key}
 onClick={() => setActiveTab(item.key)}
 className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
 activeTab === item.key
 ? 'bg-earth-50 text-earth-700 font-bold'
 : 'text-nature-600 dark:text-white hover:bg-nature-50 dark:hover:bg-nature-800 dark:bg-nature-900'
 }`}
 >
 {item.icon} {item.label}
 </button>
 ))}
 </div>

 {/* Content */}
 <div className="md:col-span-2 space-y-8">

 {/* Profile Tab */}
 {activeTab === 'profile' && (
 <div className="bg-white dark:bg-nature-950 rounded-2xl border border-nature-200 dark:border-nature-800 shadow-sm p-6">
 <h2 className="text-lg font-bold mb-6 text-nature-900 dark:text-white flex items-center gap-2">
 <User className="w-5 h-5 text-earth-500" /> {t("Profile Info")}
 </h2>
 <form onSubmit={handleProfileUpdate} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-nature-700 dark:text-white mb-1">{t("Full Name")}</label>
 <input
 type="text"
 value={profile.name}
 onChange={(e) => setProfile({ ...profile, name: e.target.value })}
 className="w-full border border-nature-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-earth-500 outline-none"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-nature-700 dark:text-white mb-1">{t("Mobile Number")}</label>
 <input
 type="tel"
 value={profile.phone}
 onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
 className="w-full border border-nature-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-earth-500 outline-none"
 />
 </div>
 <button
 type="submit"
 disabled={loading}
 className="flex items-center gap-2 bg-earth-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-earth-700 transition-colors disabled:opacity-50"
 >
 <Save className="w-4 h-4" /> {t("Save Profile")}
 </button>
 </form>
 </div>
 )}

 {/* Security Tab */}
 {activeTab === 'security' && (
 <div className="bg-white dark:bg-nature-950 rounded-2xl border border-nature-200 dark:border-nature-800 shadow-sm p-6">
 <h2 className="text-lg font-bold mb-6 text-nature-900 dark:text-white flex items-center gap-2">
 <Shield className="w-5 h-5 text-earth-500" /> {t("Change Password")}
 </h2>
 <form onSubmit={handlePasswordUpdate} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-nature-700 dark:text-white mb-1">{t("New Password")}</label>
 <input
 type="password"
 value={passwords.new}
 onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
 className="w-full border border-nature-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-earth-500 outline-none"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-nature-700 dark:text-white mb-1">{t("Confirm New Password")}</label>
 <input
 type="password"
 value={passwords.confirm}
 onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
 className="w-full border border-nature-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-earth-500 outline-none"
 />
 </div>
 <button
 type="submit"
 disabled={loading}
 className="flex items-center gap-2 bg-earth-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-earth-700 transition-colors disabled:opacity-50"
 >
 <Lock className="w-4 h-4" /> {t("Update Password")}
 </button>
 </form>
 </div>
 )}

 {/* Language Tab */}
 {activeTab === 'language' && (
 <div className="bg-white dark:bg-nature-950 rounded-2xl border border-nature-200 dark:border-nature-800 shadow-sm p-6">
 <h2 className="text-lg font-bold mb-6 text-nature-900 dark:text-white flex items-center gap-2">
 <Languages className="w-5 h-5 text-earth-500" /> {t("Language Preference")}
 </h2>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-nature-700 dark:text-white mb-1">{t('language')}</label>
 <select
 value={selectedLang}
 onChange={(e) => setSelectedLang(e.target.value)}
 className="w-full border border-nature-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-earth-500 outline-none bg-white dark:bg-nature-950"
 >
 <option value="en">{t("English")}</option>
 <option value="hi">{t("Hindi (हिंदी)")}</option>
 <option value="mr">{t("Marathi (मराठी)")}</option>
 </select>
 </div>
 <button
 onClick={handleLanguageSave}
 className="flex items-center gap-2 bg-earth-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-earth-700 transition-colors"
 >
 <Save className="w-4 h-4" /> {t("Save Language")}
 </button>
 </div>
 </div>
 )}

 </div>
 </div>
 </div>
 );
}
