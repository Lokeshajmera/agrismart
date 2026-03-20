import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, Menu, Settings, LogOut, Map, AlertTriangle, Droplets, ThermometerSun, Search, Languages, Leaf, ChevronDown, Wheat, IndianRupee } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { useLiveTranslation } from '../../hooks/useLiveTranslation';
import { useAlerts } from '../../context/AlertsContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function Navbar({ setIsMobileMenuOpen }) {
    const { tLive: t, i18n } = useLiveTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { unreadCount } = useAlerts();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
    const [showImpacts, setShowImpacts] = useState(false);
    const [profile, setProfile] = useState({ name: 'User', email: '', farmer_id: '' });
    
    const menuRef = useRef(null);
    const notifRef = useRef(null);
    const langRef = useRef(null);
    const searchRef = useRef(null);
    const impactRef = useRef(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                if (!error && data) setProfile(data);
            }
        };
        fetchProfile();
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setShowProfileMenu(false);
            if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
            if (langRef.current && !langRef.current.contains(event.target)) setShowLangMenu(false);
            if (searchRef.current && !searchRef.current.contains(event.target)) setShowSearchSuggestions(false);
            if (impactRef.current && !impactRef.current.contains(event.target)) setShowImpacts(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchableLinks = [
        { path: '/app/map', label: t('Farm Overview'), keywords: ['farm', 'overview', 'map', 'शेती', 'खेत', 'नकाशा'] },
        { path: '/app/irrigation', label: t('Irrigation Control'), keywords: ['water', 'irrigation', 'सिंचन', 'सिंचाई'] },
        { path: '/app/insights', label: t('Drone Missions'), keywords: ['drone', 'insight', 'map', 'ड्रोन'] },
        { path: '/app/alerts', label: t('Alerts'), keywords: ['alert', 'warning', 'अलर्ट'] },
        { path: '/app/complaint', label: t('Complaints'), keywords: ['complaint', 'तक्रार', 'शिकायत'] },
        { path: '/app/settings', label: t('Settings'), keywords: ['setting', 'सेटिंग'] },
        { path: '/app/recommendations', label: t('Recommendations'), keywords: ['recommendation', 'suggest', 'शिफारस', 'सुझाव'] }
    ];

    const filteredSuggestions = searchableLinks.filter(link => 
        link.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
        link.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setShowLangMenu(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchQuery.trim() || filteredSuggestions.length === 0) return;
        
        navigate(filteredSuggestions[0].path);
        toast.success(`${t('Navigating to')} ${filteredSuggestions[0].label}`);
        setSearchQuery('');
        setShowSearchSuggestions(false);
    };

    const handleSuggestionClick = (path, label) => {
        navigate(path);
        toast.success(`${t('Navigating to')} ${label}`);
        setSearchQuery('');
        setShowSearchSuggestions(false);
    };

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-nature-200 h-20 flex items-center justify-between px-6 lg:px-8 shrink-0 relative z-[100]">
            <div className="flex items-center gap-4 lg:hidden">
                <button
                    onClick={() => setIsMobileMenuOpen?.(prev => !prev)}
                    className="text-nature-600 hover:text-nature-900 transition-colors cursor-pointer p-1"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div className="font-bold text-lg text-nature-800 flex items-center gap-2 tracking-tight">
                    Agri<span className="text-earth-500 font-light">Smart</span>
                </div>
            </div>

            <div className="hidden lg:flex flex-1 items-center gap-8">
                <h1 className="text-xl text-nature-600 tracking-wide hidden xl:block">
                    {t('Dashboard')}
                </h1>
                
                {/* Search Bar */}
                <div ref={searchRef} className="relative w-full max-w-sm xl:max-w-xs">
                    <form onSubmit={handleSearch}>
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-nature-400" />
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSearchSuggestions(true);
                            }}
                            onFocus={() => setShowSearchSuggestions(true)}
                            placeholder={t('Search')}
                            className="w-full pl-10 pr-4 py-2 bg-nature-50 border border-nature-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earth-500 focus:bg-white transition-all text-sm"
                        />
                    </form>

                    {/* Search Suggestions Dropdown */}
                    {showSearchSuggestions && searchQuery.trim().length > 0 && (
                        <div className="absolute top-[110%] left-0 right-0 bg-white rounded-xl shadow-2xl border border-nature-200 overflow-hidden z-[110]">
                            {filteredSuggestions.length > 0 ? (
                                <ul className="max-h-60 overflow-y-auto py-2">
                                    {filteredSuggestions.map((suggestion, idx) => (
                                        <li key={idx}>
                                            <button
                                                onClick={() => handleSuggestionClick(suggestion.path, suggestion.label)}
                                                className="w-full text-left px-4 py-2.5 hover:bg-nature-50 transition-colors flex items-center gap-3 text-sm text-nature-700 hover:text-earth-600 cursor-pointer"
                                            >
                                                <Search className="w-3.5 h-3.5 text-nature-400" />
                                                {suggestion.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="px-4 py-3 text-sm text-nature-500 italic text-center">
                                    {t('Search Not Found')}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Impact Metrics Button */}
                <div className="hidden xl:flex items-center ml-auto relative" ref={impactRef}>
                    <button 
                        onClick={() => setShowImpacts(!showImpacts)}
                        className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-2 rounded-full border border-green-200 hover:border-green-300 transition shadow-sm font-bold text-sm cursor-pointer"
                    >
                        <Leaf className="w-4 h-4 text-green-600" />
                        {t('Impact')}
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showImpacts ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Simplified Impact Dropdown */}
                    {showImpacts && (
                        <div className="absolute top-[130%] right-0 w-48 bg-white/95 backdrop-blur-md border border-green-200 rounded-xl shadow-xl flex flex-col p-1.5 animate-in fade-in slide-in-from-top-2 origin-top-right z-[120]">
                            <div className="flex items-center justify-between p-2 hover:bg-green-50 rounded-lg transition">
                                <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                                    <Droplets className="w-4 h-4" /> {t('Water Saved')}
                                </div>
                                <span className="font-bold text-green-800 text-sm">40%</span>
                            </div>
                            <div className="flex items-center justify-between p-2 hover:bg-green-50 rounded-lg transition">
                                <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                                    <Wheat className="w-4 h-4" /> {t('Yield')}
                                </div>
                                <span className="font-bold text-green-800 text-sm">20%</span>
                            </div>
                            <div className="flex items-center justify-between p-2 hover:bg-green-50 rounded-lg transition">
                                <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                                    <IndianRupee className="w-4 h-4" /> {t('Cost Red.')}
                                </div>
                                <span className="font-bold text-green-800 text-sm">30%</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Language Switcher */}
                <div className="relative" ref={langRef}>
                    <button
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        className="p-2 text-nature-600 hover:bg-nature-50 rounded-full transition-colors flex items-center gap-1"
                    >
                        <Languages className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase">{i18n.language.split('-')[0]}</span>
                    </button>
                    {showLangMenu && (
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-nature-200 py-2 z-50">
                            {[
                                { code: 'en', label: 'English' }, // Don't translate the language names themselves
                                { code: 'hi', label: 'Hindi' },
                                { code: 'mr', label: 'Marathi' }
                            ].map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => changeLanguage(lang.code)}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-nature-50 ${i18n.language.startsWith(lang.code) ? 'text-earth-600 font-bold' : 'text-nature-700'}`}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <Link to="/app/alerts" className="relative flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 transition-colors shadow-sm cursor-pointer group" title="Active Alerts">
                    <AlertTriangle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm hidden sm:inline">Alerts</span>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 border-2 border-white shadow text-white text-[10px] font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Link>

                <div className="relative ml-2" ref={menuRef}>
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-3 pl-4 border-l border-nature-200 hover:bg-nature-50 rounded-xl py-1.5 pr-2 transition-colors cursor-pointer"
                    >
                        <div className="hidden md:block text-right">
                            <p className="text-sm font-medium text-nature-900">{profile.name}</p>
                            <p className="text-xs text-earth-600 font-bold">{profile.farmer_id}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-nature-100 overflow-hidden border border-nature-200 flex items-center justify-center text-nature-500">
                            <User className="w-6 h-6" />
                        </div>
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-nature-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="px-4 py-3 border-b border-nature-100">
                                <p className="text-sm font-medium text-nature-900">{profile.name}</p>
                                <p className="text-xs text-nature-500 truncate">{profile.email}</p>
                            </div>
                            <div className="py-1">
                                <Link to="/app/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-nature-700 hover:bg-nature-50 hover:text-earth-600">
                                    <User className="w-4 h-4" /> {t('Profile')}
                                </Link>
                                <Link to="/app/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-nature-700 hover:bg-nature-50 hover:text-earth-600">
                                    <Settings className="w-4 h-4" /> {t('Settings')}
                                </Link>
                                <Link to="/app/complaint" className="flex items-center gap-2 px-4 py-2 text-sm text-nature-700 hover:bg-nature-50 hover:text-earth-600">
                                    <AlertTriangle className="w-4 h-4 text-red-500" /> {t('Complaints')}
                                </Link>
                            </div>
                            <div className="border-t border-nature-100 py-1">
                                <button 
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                                >
                                    <LogOut className="w-4 h-4" /> {t('Logout')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
