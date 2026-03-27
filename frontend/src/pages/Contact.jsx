import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowLeft, Sprout } from 'lucide-react';

export default function Contact() {
  const { t } = useTranslation();

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
 <span>{t("Agri")}<span className="text-earth-500">{t("Smart")}</span></span>
 </Link>
 </nav>
 )}

 <div className={`max-w-4xl mx-auto ${isDashboard ? 'px-2' : 'px-4 py-16 sm:py-24'}`}>
 <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
 {t("Get in")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-earth-500 to-earth-700">{t("Touch")}</span>
 </h1>
 <p className="text-nature-600 dark:text-white max-w-xl mx-auto text-lg leading-relaxed">
 {t("Have questions about our Smart Irrigation system? Our support team is here to help you optimize your farm.")}
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
 <h3 className="text-lg font-bold mb-2">{t("Email Us")}</h3>
 <p className="text-nature-500 dark:text-white text-sm mb-4">{t("For general inquiries and technical support.")}</p>
 <a href="mailto:[EMAIL_ADDRESS]" className="font-semibold text-earth-600 dark:text-earth-400 hover:text-earth-700 transition-colors mt-auto">
 {t("agrismart26@gmail.com")}
 </a>
 </div>

 {/* Phone Card */}
 <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-nature-50 dark:bg-nature-900/50 border border-nature-100 dark:border-nature-800 hover:border-earth-300 dark:hover:border-earth-700 transition-colors group">
 <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
 <Phone className="w-6 h-6" />
 </div>
 <h3 className="text-lg font-bold mb-2">{t("Call Us")}</h3>
 <p className="text-nature-500 dark:text-white text-sm mb-4">{t("Mon-Fri from 9am to 6pm IST.")}</p>
 <a href="tel:+918263967306" className="font-semibold text-earth-600 dark:text-earth-400 hover:text-earth-700 transition-colors mt-auto">
 {t("+91 8263967306")}
 </a>
 </div>

 {/* Location Card */}
 <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-nature-50 dark:bg-nature-900/50 border border-nature-100 dark:border-nature-800 hover:border-earth-300 dark:hover:border-earth-700 transition-colors group">
 <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
 <MapPin className="w-6 h-6" />
 </div>
 <h3 className="text-lg font-bold mb-2">{t("Visit Us")}</h3>
 <p className="text-nature-500 dark:text-white text-sm mb-4">{t("Our headquarters and research facility.")}</p>
 <span className="font-semibold text-earth-600 dark:text-earth-400 mt-auto">
 {t("India")}
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
