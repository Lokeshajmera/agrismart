import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Map as MapIcon,
    Sprout,
    Droplets,
    BrainCircuit,
    BellRing,
    BarChart3,
    Settings,
    Landmark,
    MessageSquare,
    Lightbulb,
    ShieldCheck,
    Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import { useLiveTranslation } from '../../hooks/useLiveTranslation';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
    const { tLive: t } = useLiveTranslation();
    const { user } = useAuth();
    const [role, setRole] = useState('user');

    useEffect(() => {
        const fetchRole = async () => {
            if (user) {
                const { data, error } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                if (!error && data) setRole(data.role);
            }
        };
        fetchRole();
    }, [user]);

    const navItems = [
        { icon: LayoutDashboard, label: t('Dashboard'), path: '/app/dashboard' },
        { icon: MapIcon, label: t('Farm Overview'), path: '/app/map' },
        { icon: Droplets, label: t('Irrigation Control'), path: '/app/irrigation' },
        { icon: BrainCircuit, label: t('Drone Missions'), path: '/app/insights' },
        { icon: Sparkles, label: t('Recommendations'), path: '/app/recommendations' },
        { icon: Landmark, label: t('Govt Schemes'), path: '/app/schemes' },
        { icon: BellRing, label: t('Alerts'), path: '/app/alerts' },
        { icon: MessageSquare, label: t('Complaints'), path: '/app/complaint' },
        { icon: Lightbulb, label: t('Suggestions'), path: '/app/suggestion' },
        { icon: BarChart3, label: t('Analytics'), path: '/app/analytics' },
        { icon: Settings, label: t('Settings'), path: '/app/settings' },
    ];

    if (role === 'admin') {
        navItems.push({ icon: ShieldCheck, label: t('Admin'), path: '/admin' });
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-nature-900 text-nature-50 flex flex-col h-full transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 shrink-0 shadow-2xl lg:shadow-none border-r border-nature-800",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-20 flex items-center px-6 border-b border-nature-800">
                    <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
                        <div className="text-earth-400">
                            <Sprout className="w-7 h-7" />
                        </div>
                        <span className="text-white">Agri<span className="text-earth-400 font-light">Smart</span></span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
                    <div className="px-3 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen?.(false)}
                                className={({ isActive }) => clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-[15px] font-medium mb-1",
                                    isActive
                                        ? "bg-nature-800 text-earth-400 shadow-[inset_4px_0_0_0_rgba(195,141,78,1)]"
                                        : "text-nature-300 hover:bg-nature-800/50 hover:text-nature-100"
                                )}
                            >
                                <item.icon className={clsx("w-5 h-5", "group-hover:text-earth-400 transition-colors")} />
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    <div className="bg-nature-800/50 rounded-xl p-4 border border-nature-700/50 backdrop-blur-sm">
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-2xl font-bold text-white">31%</span>
                        </div>
                        <p className="text-xs text-nature-300 mb-3">{t('Avg Soil Moisture')}</p>
                        <div className="w-full bg-nature-700 rounded-full h-1.5 mb-1">
                            <div className="bg-earth-400 h-1.5 rounded-full" style={{ width: '31%' }}></div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
