import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, BarChart3, Droplets, Map, Brain, Shield, ArrowRight } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-nature-50 dark:bg-nature-900 font-sans text-nature-900 dark:text-white scroll-smooth">
            {/* Navbar Minimal for Landing Page */}
            <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-nature-950/80 backdrop-blur-md border-b border-nature-200 dark:border-nature-800 z-50 px-4 md:px-8 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xl font-bold">
                    <Sprout className="w-6 h-6 text-earth-500" />
                    <span>Agri<span className="text-earth-500">Smart</span></span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-medium text-nature-700 dark:text-nature-200 hover:text-earth-600 transition-colors">Login</Link>
                    <Link to="/signup" className="text-sm font-medium bg-earth-500 text-white px-4 py-2 rounded-lg hover:bg-earth-600 transition-colors shadow-sm">Get Started</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 md:px-8 relative overflow-hidden">
                {/* Abstract Background Elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-earth-200/50 blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-nature-300/50 blur-3xl opacity-50"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nature-100 dark:bg-nature-800 text-nature-700 dark:text-nature-200 text-sm font-medium mb-6 animate-fade-in-up">
                        <span className="w-2 h-2 rounded-full bg-earth-500 animate-pulse"></span>
                        AI-Powered Precision Agriculture
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                        AI-Driven Smart Irrigation System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-earth-500 to-earth-700">Wheat Farms</span>
                    </h1>
                    <p className="text-lg md:text-xl text-nature-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Maximize yield and minimize water waste using IoT sensors, satellite imagery, and advanced AI models trained for North Indian climate conditions.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/signup" className="w-full sm:w-auto px-8 py-3 rounded-lg bg-nature-800 text-white font-medium hover:bg-nature-900 transition-colors flex items-center justify-center gap-2">
                            Start Farm Setup <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats/Impact */}
            <section className="py-12 bg-white dark:bg-nature-950 border-y border-nature-200 dark:border-nature-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <p className="text-3xl font-bold text-earth-600 mb-1">40%</p>
                            <p className="text-sm font-medium text-nature-500 uppercase tracking-wide">Water Saved</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-earth-600 mb-1">25%</p>
                            <p className="text-sm font-medium text-nature-500 uppercase tracking-wide">Yield Increase</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-earth-600 mb-1">24/7</p>
                            <p className="text-sm font-medium text-nature-500 uppercase tracking-wide">AI Monitoring</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-earth-600 mb-1">10k+</p>
                            <p className="text-sm font-medium text-nature-500 uppercase tracking-wide">Acres Managed</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 md:px-8 max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4">Complete Crop Intelligence</h2>
                    <p className="text-nature-600 max-w-2xl mx-auto">Everything you need to automate your irrigation system and monitor your wheat farm's health from anywhere.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { icon: Droplets, title: 'Smart Irrigation', desc: 'Automated zone-based watering using real-time soil moisture and weather forecasts.' },
                        { icon: Map, title: 'Satellite Validation', desc: 'NDVI heatmaps and drone imagery integration to spot dry zones before crop stress occurs.' },
                        { icon: Brain, title: 'AI Predictions', desc: 'Disease risk prediction and yield estimation models tailored for the North Indian wheat cycle.' },
                        { icon: BarChart3, title: 'Real-time Analytics', desc: 'Track soil temperature, pH, and groundwater levels in a single unified dashboard.' },
                        { icon: Shield, title: 'Disease Alerts', desc: 'Get instant notifications for weather anomalies, crop heat stress, and pest risks.' },
                        { icon: Sprout, title: 'Soil Memory Models', desc: 'Advanced AI that learns your soil\'s water retention rate over time to optimize watering.' }
                    ].map((feat, i) => (
                        <div key={i} className="bg-white dark:bg-nature-950 p-6 rounded-2xl border border-nature-200 dark:border-nature-800 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-xl bg-nature-50 dark:bg-nature-900 flex items-center justify-center mb-4 text-earth-600">
                                <feat.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">{feat.title}</h3>
                            <p className="text-nature-600 text-sm leading-relaxed">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Architecture Overview */}
            <section className="py-20 bg-nature-900 text-white">
                <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
                    <h2 className="text-3xl font-bold mb-12">How It Works</h2>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4 relative">
                        <div className="bg-nature-800 p-6 rounded-xl border border-nature-700 w-full md:w-1/3 z-10 relative">
                            <div className="text-earth-400 mb-3"><Droplets className="w-8 h-8 mx-auto" /></div>
                            <h4 className="font-bold mb-2 text-lg">1. Sensors Collect Data</h4>
                            <p className="text-sm text-nature-300">IoT nodes gather moisture, weather, and soil temp across your field.</p>
                        </div>

                        <div className="hidden md:block w-16 border-t-2 border-dashed border-nature-600 flex-shrink-0"></div>

                        <div className="bg-nature-800 p-6 rounded-xl border border-nature-700 w-full md:w-1/3 z-10 relative">
                            <div className="text-earth-400 mb-3"><Brain className="w-8 h-8 mx-auto" /></div>
                            <h4 className="font-bold mb-2 text-lg">2. AI Processes Insights</h4>
                            <p className="text-sm text-nature-300">Cloud AI combines sensor data with satellite NDVI and weather APIs.</p>
                        </div>

                        <div className="hidden md:block w-16 border-t-2 border-dashed border-nature-600 flex-shrink-0"></div>

                        <div className="bg-nature-800 p-6 rounded-xl border border-nature-700 w-full md:w-1/3 z-10 relative">
                            <div className="text-earth-400 mb-3"><Sprout className="w-8 h-8 mx-auto" /></div>
                            <h4 className="font-bold mb-2 text-lg">3. Automated Action</h4>
                            <p className="text-sm text-nature-300">Smart valves trigger precise watering only where and when needed.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <footer className="bg-earth-900 border-t border-earth-800 pt-16 pb-8 text-earth-100/70">
                <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-6">Ready to upgrade your farm?</h2>
                    <Link to="/signup" className="inline-block px-8 py-3 rounded-lg bg-earth-500 text-white font-bold hover:bg-earth-600 transition-colors mb-16 shadow-lg shadow-earth-500/20">
                        Create Free Account
                    </Link>

                    <div className="border-t border-earth-800/50 pt-8 flex flex-col md:flex-row items-center justify-between text-sm">
                        <div className="flex items-center gap-2 font-bold text-white mb-4 md:mb-0">
                            <Sprout className="w-5 h-5 text-earth-400" />
                            <span>Agri<span className="text-earth-400">Smart</span></span>
                        </div>
                        <p>© 2026 AgriSmart. Made for the Hackathon.</p>
                        <div className="flex gap-4 mt-4 md:mt-0">
                            <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
                            <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
                            <Link to="/login?owner=true" className="hover:text-earth-400 font-bold ml-4 border-l border-earth-700 pl-4 transition-colors">
                                Director/Owner Login
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
