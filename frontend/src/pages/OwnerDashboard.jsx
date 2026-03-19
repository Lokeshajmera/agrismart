import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Users, AlertCircle, Lightbulb, Bell, LogOut, Sprout, CheckCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const API_URL = `http://${window.location.hostname}:5000/api`;

const OwnerDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ users: 0, pendingComplaints: 0, suggestions: 0 });
    const [recentMembers, setRecentMembers] = useState([]);
    const [recentComplaints, setRecentComplaints] = useState([]);
    const [recentSuggestions, setRecentSuggestions] = useState([]);
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        // Mock some system updates for the hackathon demo since there is no updates table
        setUpdates([
            { id: 1, title: 'AI Yield Model Updated', date: new Date().toLocaleDateString(), desc: 'The North Indian wheat yield prediction model has been improved by 15%.' },
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

            setRecentComplaints(fetchedComplaints.slice(0, 5));
            setRecentSuggestions(fetchedSuggestions.slice(0, 5));
            setRecentMembers(fetchedUsers.slice(0, 5));

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

    const handleDeleteComplaint = async (id) => {
        try {
            const { error } = await supabase.from('complaints').delete().eq('id', id);
            if (error) throw error;
            setRecentComplaints(prev => prev.filter(c => c.id !== id));
            setStats(prev => ({ ...prev, pendingComplaints: Math.max(0, prev.pendingComplaints - 1) }));
            toast.success('Complaint resolved and removed');
        } catch (error) {
            toast.error('Failed to resolve complaint');
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

    const handleLogout = () => {
        toast.success('Logged out successfully');
        navigate('/');
    };

    if (loading) return <div className="p-8 flex justify-center text-nature-600">Loading Director Dashboard...</div>;

    return (
        <div className="min-h-screen bg-nature-50">
            {/* Top Navigation */}
            <nav className="bg-white border-b border-nature-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <Sprout className="w-8 h-8 text-earth-600" />
                    <span className="text-xl font-bold text-nature-900">Agri<span className="text-earth-600">Smart</span> <span className="text-nature-500 font-medium ml-2">Director Portal</span></span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-nature-700 bg-nature-100 px-3 py-1 rounded-full">xyz@gmail.com</span>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-nature-600 hover:text-red-600 transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Exit</span>
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto p-6 space-y-8 mt-4">
                <header>
                    <h1 className="text-3xl font-bold text-nature-900 mb-2">Welcome, Director</h1>
                    <p className="text-nature-600">Here is the latest overview of the AgriSmart platform.</p>
                </header>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-nature-200 flex items-center gap-4">
                        <div className="p-4 bg-blue-100 rounded-xl text-blue-600">
                            <Users className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-sm text-nature-500 font-medium uppercase tracking-wide">Total Members</p>
                            <p className="text-3xl font-bold text-nature-900">{stats.users}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-nature-200 flex items-center gap-4">
                        <div className="p-4 bg-red-100 rounded-xl text-red-600">
                            <AlertCircle className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-sm text-nature-500 font-medium uppercase tracking-wide">Pending Issues</p>
                            <p className="text-3xl font-bold text-nature-900">{stats.pendingComplaints}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-nature-200 flex items-center gap-4">
                        <div className="p-4 bg-yellow-100 rounded-xl text-yellow-600">
                            <Lightbulb className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-sm text-nature-500 font-medium uppercase tracking-wide">New Suggestions</p>
                            <p className="text-3xl font-bold text-nature-900">{stats.suggestions}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Complaints */}
                    <section className="bg-white rounded-2xl shadow-sm border border-nature-200 overflow-hidden">
                        <div className="p-5 border-b border-nature-100 bg-nature-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-nature-900 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500" /> Recent Complaints
                            </h2>
                        </div>
                        <div className="divide-y divide-nature-100">
                            {recentComplaints.length > 0 ? recentComplaints.map(c => (
                                <div key={c.id} className="p-5 hover:bg-nature-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-semibold text-nature-900">{c.users?.name || 'Unknown User'} <span className="text-nature-400 text-sm font-normal">({c.users?.farmer_id})</span></div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                                c.status === 'pending' ? 'bg-red-100 text-red-700' : 
                                                c.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>{c.status.toUpperCase()}</span>
                                            <button 
                                                onClick={() => handleDeleteComplaint(c.id)}
                                                className="p-1.5 text-nature-400 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors border border-transparent hover:border-green-200"
                                                title="Mark as Solved & Remove"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-nature-600 text-sm mb-2">{c.message}</p>
                                    <div className="flex justify-between items-center text-xs text-nature-400 font-medium">
                                        <span>Category: <span className="capitalize">{c.category}</span></span>
                                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            )) : <div className="p-8 text-center text-nature-500">No recent complaints.</div>}
                        </div>
                    </section>

                    {/* Suggestions */}
                    <section className="bg-white rounded-2xl shadow-sm border border-nature-200 overflow-hidden">
                        <div className="p-5 border-b border-nature-100 bg-nature-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-nature-900 flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-yellow-500" /> New Suggestions
                            </h2>
                        </div>
                        <div className="divide-y divide-nature-100">
                            {recentSuggestions.length > 0 ? recentSuggestions.map(s => (
                                <div key={s.id} className="p-5 hover:bg-nature-50 transition-colors">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="font-semibold text-nature-900">{s.users?.name || 'Unknown User'}</div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-nature-400 font-medium">{new Date(s.created_at).toLocaleDateString()}</span>
                                            <button 
                                                onClick={() => handleDeleteSuggestion(s.id)}
                                                className="p-1.5 text-nature-400 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors border border-transparent hover:border-green-200"
                                                title="Mark as Reviewed & Remove"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-nature-600 text-sm">{s.message}</p>
                                </div>
                            )) : <div className="p-8 text-center text-nature-500">No recent suggestions.</div>}
                        </div>
                    </section>

                    {/* Members List */}
                    <section className="bg-white rounded-2xl shadow-sm border border-nature-200 overflow-hidden">
                        <div className="p-5 border-b border-nature-100 bg-nature-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-nature-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-500" /> New Members
                            </h2>
                        </div>
                        <div className="divide-y divide-nature-100">
                            {recentMembers.length > 0 ? recentMembers.map(m => (
                                <div key={m.id} className="p-4 flex items-center justify-between hover:bg-nature-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-earth-100 text-earth-700 flex items-center justify-center font-bold text-sm">
                                            {m.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-nature-900 text-sm">{m.name}</p>
                                            <p className="text-xs text-nature-500">{m.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-nature-700">{m.farmer_id}</p>
                                        <p className="text-xs text-nature-400">{new Date(m.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )) : <div className="p-8 text-center text-nature-500">No recent members.</div>}
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;
