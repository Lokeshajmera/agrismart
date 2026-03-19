import React from 'react';
import { Sprout, CloudRain, Sun, Leaf, Droplets } from 'lucide-react';

export default function Recommendations() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-nature-900 tracking-tight">AI Recommendations</h1>
                <p className="text-nature-500 mt-1">Actionable insights generated specifically for your farm.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-nature-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-40 h-40 bg-earth-500/20 rounded-bl-full blur-3xl"></div>
                    <div className="relative z-10 flex items-center gap-3 mb-6">
                        <div className="p-2 bg-earth-500/20 rounded-lg text-earth-300">
                            <Droplets className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold">Irrigation Strategy</h2>
                    </div>
                    <p className="text-nature-200 mb-6 leading-relaxed relative z-10 text-sm">
                        Based on the deep soil memory model, your central field retains water 12% better than the periphery. We recommend reducing peripheral irrigation by 5 mins to prevent waterlogging.
                    </p>
                    <button className="bg-earth-500 hover:bg-earth-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors w-full relative z-10">
                        Apply Optimized Schedule
                    </button>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-nature-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-4 text-blue-600">
                            <CloudRain className="w-6 h-6" />
                            <h2 className="text-xl font-bold text-nature-900">Weather-Adjusted Actions</h2>
                        </div>
                        <p className="text-nature-600 text-sm mb-4 leading-relaxed">
                            Heavy rainfall (15mm) predicted in 48 hours for the North India region. All auto-irrigation schedules for tomorrow should be suspended.
                        </p>
                    </div>
                    <button className="bg-nature-100 hover:bg-nature-200 text-nature-800 px-4 py-2 rounded-lg text-sm font-bold transition-colors w-full mt-4">
                        Suspend Irrigation (24h)
                    </button>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-nature-200 shadow-sm md:col-span-2">
                    <div className="flex items-center justify-between mb-6 border-b border-nature-100 pb-4">
                        <div className="flex items-center gap-3 text-green-600">
                            <Sprout className="w-6 h-6" />
                            <h2 className="text-xl font-bold text-nature-900">Crop Health Recommendations</h2>
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">Optimal Stage: Tillering</span>
                    </div>

                    <ul className="space-y-4">
                        <li className="flex gap-4">
                            <div className="mt-1 w-2 h-2 rounded-full bg-earth-500 shrink-0"></div>
                            <div>
                                <h4 className="font-bold text-nature-900 text-sm">Nitrogen Application</h4>
                                <p className="text-nature-600 text-sm mt-1">NDVI scan shows slight yellowing in Zone 3. Consider side-dressing 20kg/ha of Urea within the next 3 days.</p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <div className="mt-1 w-2 h-2 rounded-full bg-earth-500 shrink-0"></div>
                            <div>
                                <h4 className="font-bold text-nature-900 text-sm">Weed Management</h4>
                                <p className="text-nature-600 text-sm mt-1">Current temperature profile is optimal for Phalaris minor emergence. Scout fields early next week.</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
