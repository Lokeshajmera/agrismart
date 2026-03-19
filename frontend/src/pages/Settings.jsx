import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Smartphone, Languages, Lock, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = `http://${window.location.hostname}:5000/api`;

export default function Settings() {
    const { t, i18n } = useTranslation();
    const [profile, setProfile] = useState({ name: '', phone: '', language: 'en' });
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data } = await axios.get(`${API_URL}/user`, {
                headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session.access_token}` }
            });
            setProfile(data);
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
            i18n.changeLanguage(profile.language);
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
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: passwords.new });
            if (error) throw error;
            toast.success('Password updated successfully');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 p-6">
            <div>
                <h1 className="text-3xl font-bold text-nature-900 tracking-tight">{t('settings')}</h1>
                <p className="text-nature-500 mt-1">Manage your account and preferences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sidebar links for settings */}
                <div className="space-y-1">
                    <button className="w-full flex items-center gap-3 px-4 py-2 bg-earth-50 text-earth-700 rounded-lg font-bold">
                        <User className="w-4 h-4" /> Profile Info
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-nature-600 hover:bg-nature-50 rounded-lg">
                        <Lock className="w-4 h-4" /> Security
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-nature-600 hover:bg-nature-50 rounded-lg">
                        <Languages className="w-4 h-4" /> Language
                    </button>
                </div>

                <div className="md:col-span-2 space-y-8">
                    {/* Profile Section */}
                    <div className="bg-white rounded-2xl border border-nature-200 shadow-sm p-6">
                        <h2 className="text-lg font-bold mb-6 text-nature-900 flex items-center gap-2">
                             <User className="w-5 h-5 text-earth-500" />
                             {t('settings')}
                        </h2>
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-nature-700 mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    value={profile.name}
                                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                                    className="w-full border border-nature-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-earth-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-nature-700 mb-1">Mobile Number</label>
                                <input 
                                    type="tel" 
                                    value={profile.phone}
                                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                                    className="w-full border border-nature-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-earth-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-nature-700 mb-1">{t('language')}</label>
                                <select 
                                    value={profile.language}
                                    onChange={(e) => setProfile({...profile, language: e.target.value})}
                                    className="w-full border border-nature-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-earth-500 outline-none bg-white"
                                >
                                    <option value="en">English</option>
                                    <option value="hi">Hindi (हिंदी)</option>
                                    <option value="mr">Marathi (मराठी)</option>
                                </select>
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="flex items-center gap-2 bg-earth-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-earth-700 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" /> Save Profile
                            </button>
                        </form>
                    </div>

                    {/* Password Section */}
                    <div className="bg-white rounded-2xl border border-nature-200 shadow-sm p-6">
                        <h2 className="text-lg font-bold mb-6 text-nature-900 flex items-center gap-2">
                             <Shield className="w-5 h-5 text-earth-500" />
                             Change Password
                        </h2>
                        <form onSubmit={handlePasswordUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-nature-700 mb-1">New Password</label>
                                <input 
                                    type="password" 
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                    className="w-full border border-nature-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-earth-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-nature-700 mb-1">Confirm New Password</label>
                                <input 
                                    type="password" 
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                    className="w-full border border-nature-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-earth-500 outline-none" 
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="flex items-center gap-2 bg-earth-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-earth-700 transition-colors disabled:opacity-50"
                            >
                                <Lock className="w-4 h-4" /> Update Password
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
