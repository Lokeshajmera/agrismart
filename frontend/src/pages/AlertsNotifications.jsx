import React from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';

const alerts = [
    { id: 1, type: 'critical', title: 'Water Stress Detected', msg: 'Zone 2 moisture level dropped below 28%. Auto-irrigation initiated.', time: '10 mins ago', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    { id: 2, type: 'warning', title: 'Heat Stress Warning', msg: 'Ambient temp expected to reach 34°C by 2 PM. Monitor crop health closely.', time: '2 hours ago', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { id: 3, type: 'success', title: 'Irrigation Cycle Complete', msg: 'Zone 1 irrigation successfully completed. 250L water dispersed.', time: '4 hours ago', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { id: 4, type: 'info', title: 'System Update', msg: 'AI yield prediction models updated with latest satellite data.', time: '1 day ago', icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
];

export default function AlertsNotifications() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-nature-900 tracking-tight">Alerts & Notifications</h1>
                    <p className="text-nature-500 mt-1">Review system alerts, warnings, and automated actions.</p>
                </div>
                <button className="text-sm font-medium text-nature-600 bg-nature-100 hover:bg-nature-200 px-4 py-2 rounded-lg transition-colors">
                    Mark all as read
                </button>
            </div>

            <div className="space-y-4">
                {alerts.map(alert => (
                    <div key={alert.id} className={`p-4 rounded-xl border ${alert.bg} ${alert.border} flex gap-4 transition-all hover:shadow-md`}>
                        <div className={`mt-1 ${alert.color}`}>
                            <alert.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className={`font-bold ${alert.color === 'text-red-600' ? 'text-red-900' : 'text-nature-900'}`}>{alert.title}</h3>
                                <span className="text-xs font-medium text-nature-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {alert.time}
                                </span>
                            </div>
                            <p className="text-nature-700 text-sm leading-relaxed">{alert.msg}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
