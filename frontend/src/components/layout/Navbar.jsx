import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, User, Menu, Settings, LogOut, Map, AlertTriangle, Droplets, ThermometerSun, Search, Languages, Leaf, ChevronDown, Wheat, IndianRupee, Sun, Moon, Zap, Cpu, CloudRain } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { useLiveTranslation } from '../../hooks/useLiveTranslation';
import { useAlerts } from '../../context/AlertsContext';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function Navbar({ setIsMobileMenuOpen }) {
    const { tLive: t, i18n } = useLiveTranslation();
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const { unreadCount, alerts } = useAlerts();
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
        { path: '/app/irrigation', label: t('Irrigation Control'), keywords: ['water', 'irrigation', 'सिंचन', 'सिंचाई', 'pump'] },
        { path: '/app/insights', label: t('Drone Missions'), keywords: ['drone', 'insight', 'map', 'ड्रोन', 'mission', 'ai'] },
        { path: '/app/alerts', label: t('Alerts'), keywords: ['alert', 'warning', 'अलर्ट', 'notification'] },
        { path: '/app/complaint', label: t('Complaints'), keywords: ['complaint', 'तक्रार', 'शिकायत', 'support', 'help'] },
        { path: '/app/settings', label: t('Settings'), keywords: ['setting', 'सेटिंग', 'profile'] },
        { path: '/app/recommendations', label: t('Recommendations'), keywords: ['recommendation', 'suggest', 'शिफारस', 'सुझाव'] },
        { path: '/app/schemes', label: t('Government Schemes'), keywords: ['government', 'govt', 'scheme', 'yojana', 'subsidy', 'योजना'] },
        { path: '/app/suggestion', label: t('Suggestions'), keywords: ['suggestion', 'feedback', 'idea'] },
        { path: '/app/profile', label: t('User Profile'), keywords: ['profile', 'account', 'user'] },
        { path: '/app/analytics', label: t('Analytics'), keywords: ['analytics', 'chart', 'graph', 'data', 'report'] },
        { path: '/app/sensors', label: t('Sensor Monitoring'), keywords: ['sensor', 'monitor', 'data', 'live'] },
        { path: '/app/contact', label: t('Contact Support'), keywords: ['contact', 'support', 'help', 'email', 'phone'] }
    ];

    const allSearchableItems = useMemo(() => {
        const items = [];
        
        // 1. Pages
        searchableLinks.forEach(link => {
            items.push({
                type: 'Page',
                icon: Search,
                title: link.label,
                path: link.path,
                searchText: `${link.label} ${link.keywords.join(' ')}`.toLowerCase()
            });
        });

        // 2. Alerts (from context)
        if (alerts && alerts.length > 0) {
            alerts.forEach(alert => {
                items.push({
                    type: 'Alert',
                    icon: AlertTriangle,
                    title: alert.title,
                    path: '/app/alerts',
                    searchText: `${alert.title} ${alert.type} alert warning notification`.toLowerCase()
                });
            });
        }

        // 3. Sensor Data (Simulated Real-time Data)
        const sensorData = [
            { title: 'Soil Moisture Level (Zone A)', value: '31%', path: '/app/dashboard', icon: Droplets },
            { title: 'Temperature Sensor', value: '28°C', path: '/app/dashboard', icon: ThermometerSun },
            { title: 'Ambient Humidity', value: '65%', path: '/app/dashboard', icon: CloudRain },
            { title: 'Main Water Pump Status', value: 'Active', path: '/app/irrigation', icon: Zap },
            { title: 'Drone Battery Level', value: '84%', path: '/app/insights', icon: Cpu }
        ];
        
        sensorData.forEach(sensor => {
            items.push({
                type: 'Sensor',
                icon: sensor.icon || Cpu,
                title: `${sensor.title}: ${sensor.value}`,
                path: sensor.path,
                searchText: `${sensor.title} ${sensor.value} sensor data reading`.toLowerCase()
            });
        });

        return items;
    }, [alerts, t]);

    const filteredSuggestions = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const queryTerms = searchQuery.toLowerCase().split(' ').filter(q => q);
        return allSearchableItems
            .filter(item => {
                // Return true only if ALL typed words are found somewhere in the item's search text
                return queryTerms.every(term => item.searchText.includes(term));
            })
            .slice(0, 8); // top 8 results to keep UI clean
    }, [searchQuery, allSearchableItems]);

    const highlightText = (text, query) => {
        if (!query) return text;
        const queryTerms = query.toLowerCase().split(' ').filter(q => q);
        
        // A simple approach: highlight any occurrence of any query term
        if (queryTerms.length === 0) return text;
        
        let regex = new RegExp(`(${queryTerms.join('|')})`, 'gi');
        const parts = text.split(regex);
        
        return parts.map((part, i) => {
            const isMatch = queryTerms.some(term => part.toLowerCase() === term);
            return isMatch ? 
            <strong key={i} className="text-earth-700 dark:text-earth-400 bg-earth-100 dark:bg-earth-900/40 px-0.5 rounded-sm">{part}</strong> : part;
        });
    };

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
        <header className="bg-white dark:bg-nature-950/80 backdrop-blur-md border-b border-nature-200 dark:border-nature-800 h-16 sm:h-20 flex items-center justify-between px-3 md:px-6 lg:px-8 shrink-0 relative z-[100]">
            <div className="flex items-center gap-2 sm:gap-4 lg:hidden shrink-0">
                <button
                    onClick={() => setIsMobileMenuOpen?.(prev => !prev)}
                    className="text-nature-600 hover:text-nature-900 dark:text-white transition-colors cursor-pointer p-1 shrink-0"
                >
                    <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <div className="font-bold text-base sm:text-lg text-nature-800 dark:text-nature-100 flex items-center gap-1 sm:gap-2 tracking-tight shrink-0">
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
                            className="w-full pl-10 pr-4 py-2 bg-nature-50 dark:bg-nature-900 border border-nature-200 dark:border-nature-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-earth-500 focus:bg-white dark:bg-nature-950 transition-all text-sm"
                        />
                    </form>

                    {/* Search Suggestions Dropdown */}
                    {showSearchSuggestions && searchQuery.trim().length > 0 && (
                        <div className="absolute top-[110%] left-0 right-0 bg-white dark:bg-nature-950 rounded-xl shadow-2xl border border-nature-200 dark:border-nature-800 overflow-hidden z-[110]">
                            {filteredSuggestions.length > 0 ? (
                                <ul className="max-h-60 overflow-y-auto py-2">
                                    {filteredSuggestions.map((suggestion, idx) => {
                                        const Icon = suggestion.icon;
                                        return (
                                            <li key={idx}>
                                                <button
                                                    onClick={() => handleSuggestionClick(suggestion.path, suggestion.title)}
                                                    className="w-full text-left px-4 py-3 hover:bg-nature-50 dark:hover:bg-nature-900 transition-colors flex items-start gap-3 cursor-pointer group border-b border-nature-50 dark:border-nature-800/50 last:border-0"
                                                >
                                                    <div className={`p-1.5 rounded-md mt-0.5 ${
                                                        suggestion.type === 'Alert' ? 'bg-red-50 text-red-500 dark:bg-red-900/20' :
                                                        suggestion.type === 'Sensor' ? 'bg-blue-50 text-blue-500 dark:bg-blue-900/20' :
                                                        'bg-nature-100 text-nature-500 dark:bg-nature-800'
                                                    }`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-nature-900 dark:text-nature-100 group-hover:text-earth-600 transition-colors line-clamp-1">
                                                            {highlightText(suggestion.title, searchQuery)}
                                                        </div>
                                                        <div className="text-xs text-nature-400 dark:text-nature-500 font-medium">
                                                            {suggestion.type}
                                                        </div>
                                                    </div>
                                                </button>
                                            </li>
                                        );
                                    })}
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
                <div className="hidden xl:flex items-center ml-auto mr-6 relative" ref={impactRef}>
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
                        <div className="absolute top-[130%] right-0 w-48 bg-white dark:bg-nature-950/95 backdrop-blur-md border border-green-200 rounded-xl shadow-xl flex flex-col p-1.5 animate-in fade-in slide-in-from-top-2 origin-top-right z-[120]">
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

            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-1.5 sm:p-2 text-nature-600 hover:bg-nature-50 dark:bg-nature-900 rounded-full transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>

                {/* Language Switcher */}
                <div className="relative shrink-0" ref={langRef}>
                    <button
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        className="p-1.5 sm:p-2 text-nature-600 hover:bg-nature-50 dark:bg-nature-900 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                    >
                        <Languages className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase hidden sm:inline-block">{i18n.language.split('-')[0]}</span>
                    </button>
                    {showLangMenu && (
                        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-nature-950 rounded-xl shadow-lg border border-nature-200 dark:border-nature-800 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                            {[
                                { code: 'en', label: 'English' }, // Don't translate the language names themselves
                                { code: 'hi', label: 'Hindi' },
                                { code: 'mr', label: 'Marathi' }
                            ].map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => changeLanguage(lang.code)}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-nature-50 dark:hover:bg-nature-900 cursor-pointer ${i18n.language.startsWith(lang.code) ? 'text-earth-600 font-bold' : 'text-nature-700 dark:text-nature-200'}`}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <Link to="/app/alerts" className="relative flex items-center gap-1.5 sm:gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-red-200 dark:border-red-800/30 hover:bg-red-100 transition-colors shadow-sm cursor-pointer group shrink-0" title="Active Alerts">
                    <AlertTriangle className="w-4 h-4 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm hidden sm:inline">Alerts</span>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] px-1 rounded-full bg-red-500 border-2 border-white font-bold text-white text-[9px] sm:text-[10px]">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Link>

                <div className="relative ml-0.5 sm:ml-2 shrink-0" ref={menuRef}>
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-2 sm:gap-3 sm:pl-4 sm:border-l border-nature-200 dark:border-nature-800 hover:bg-nature-50 dark:bg-nature-900 rounded-xl py-1 sm:py-1.5 pl-1 pr-1 sm:pr-2 transition-colors cursor-pointer"
                    >
                        <div className="hidden md:block text-right">
                            <p className="text-sm font-medium text-nature-900 dark:text-white">{profile.name}</p>
                            <p className="text-xs text-earth-600 font-bold">{profile.farmer_id}</p>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-nature-100 dark:bg-nature-800 overflow-hidden border border-nature-200 dark:border-nature-800 flex items-center justify-center text-nature-500 shrink-0">
                            <User className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-nature-950 rounded-xl shadow-lg border border-nature-200 dark:border-nature-800 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="px-4 py-3 border-b border-nature-100 dark:border-nature-700/50">
                                <p className="text-sm font-medium text-nature-900 dark:text-white">{profile.name}</p>
                                <p className="text-xs text-nature-500 truncate">{profile.email}</p>
                            </div>
                            <div className="py-1">
                                <Link to="/app/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-nature-700 dark:text-nature-200 hover:bg-nature-50 dark:bg-nature-900 hover:text-earth-600">
                                    <User className="w-4 h-4" /> {t('Profile')}
                                </Link>
                                <Link to="/app/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-nature-700 dark:text-nature-200 hover:bg-nature-50 dark:bg-nature-900 hover:text-earth-600">
                                    <Settings className="w-4 h-4" /> {t('Settings')}
                                </Link>
                                <Link to="/app/complaint" className="flex items-center gap-2 px-4 py-2 text-sm text-nature-700 dark:text-nature-200 hover:bg-nature-50 dark:bg-nature-900 hover:text-earth-600">
                                    <AlertTriangle className="w-4 h-4 text-red-500" /> {t('Complaints')}
                                </Link>
                            </div>
                            <div className="border-t border-nature-100 dark:border-nature-700/50 py-1">
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
