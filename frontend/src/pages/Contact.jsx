import React from 'react';
import { useLiveTranslation } from '../hooks/useLiveTranslation';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowLeft, Sprout } from 'lucide-react';

export default function Contact() {
  const { tLive } = useLiveTranslation();

 const location = useLocation();
 const isDashboard = location.pathname.includes('/app');

 return (
 <div className={isDashboard ? "font-sans text-nature-900 dark:text-white select-none py-4 sm:py-8" : "min-h-screen bg-nature-50 dark:bg-nature-900 font-sans text-nature-900 dark:text-white select-none"}>
 {/* Minimal Navbar */}
 {!isDashboard && (
 <nav className="h-16 bg-white dark:bg-nature-950/80 backdrop-blur-md border-b border-nature-200 dark:border-nature-800 z-50 px-4 md:px-8 flex items-center justify-between">
 <Link to="/" className="flex items-center gap-2 text-xl font-bold group">
 <ArrowLeft className="w-5 h-5 text-nature-400 dark:text-white group-hover:-translate-x-1 transition-transform" />
 <Sprout className="w-6 h-6 text-earth-500 ml-2" />
 <span>{tLive("Agri")}<span className="text-earth-500">{tLive("Smart")}</span></span>
 </Link>
 </nav>
 )}

 <div className={`max-w-4xl mx-auto ${isDashboard ? 'px-2' : 'px-4 py-16 sm:py-24'}`}>
 <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
 {tLive("Get in")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-earth-500 to-earth-700">{tLive("Touch")}</span>
 </h1>
 <p className="text-nature-600 dark:text-white max-w-xl mx-auto text-lg leading-relaxed">
 {tLive("Have questions about our Smart Irrigation system? Our support team is here to help you optimize your farm.")}
 </p>
 </div>

 <div className="bg-white dark:bg-nature-950 rounded-3xl p-8 md:p-12 shadow-xl shadow-nature-200/50 dark:shadow-none border border-nature-100 dark:border-nature-800 animate-in fade-in zoom-in-95 duration-500 delay-150 relative overflow-hidden">
 {/* Decorative Elements */}
 <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-earth-50 dark:bg-earth-900/20 blur-3xl opacity-50 pointer-events-none"></div>
 <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-blue-50 dark:bg-blue-900/10 blur-3xl opacity-50 pointer-events-none"></div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
 {/* Email Card */}
 <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-nature-50 dark:bg-nature-900/50 border border-nature-100 dark:border-nature-800 hover:border-earth-300 dark:hover:border-earth-700 transition-colors group">
 <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
 <Mail className="w-6 h-6" />
 </div>
 <h3 className="text-lg font-bold mb-2">{tLive("Email Us")}</h3>
 <p className="text-nature-500 dark:text-white text-sm mb-4">{tLive("For general inquiries and technical support.")}</p>
 <a href="mailto:support@agrismart.com" className="font-semibold text-earth-600 dark:text-earth-400 hover:text-earth-700 transition-colors mt-auto">
 {tLive("support@agrismart.com")}
 </a>
 </div>

 {/* Phone Card */}
 <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-nature-50 dark:bg-nature-900/50 border border-nature-100 dark:border-nature-800 hover:border-earth-300 dark:hover:border-earth-700 transition-colors group">
 <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
 <Phone className="w-6 h-6" />
 </div>
 <h3 className="text-lg font-bold mb-2">{tLive("Call Us")}</h3>
 <p className="text-nature-500 dark:text-white text-sm mb-4">{tLive("Mon-Fri from 9am to 6pm IST.")}</p>
 <a href="tel:+91XXXXXXXXXX" className="font-semibold text-earth-600 dark:text-earth-400 hover:text-earth-700 transition-colors mt-auto">
 {tLive("+91 XXXXX XXXXX")}
 </a>
 </div>

 {/* Location Card */}
 <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-nature-50 dark:bg-nature-900/50 border border-nature-100 dark:border-nature-800 hover:border-earth-300 dark:hover:border-earth-700 transition-colors group">
 <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
 <MapPin className="w-6 h-6" />
 </div>
 <h3 className="text-lg font-bold mb-2">{tLive("Visit Us")}</h3>
 <p className="text-nature-500 dark:text-white text-sm mb-4">{tLive("Our headquarters and research facility.")}</p>
 <span className="font-semibold text-earth-600 dark:text-earth-400 mt-auto">
 {tLive("India")}
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
