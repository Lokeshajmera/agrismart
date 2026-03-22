import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Sprout } from 'lucide-react';

export default function Legal() {
  const { t } = useTranslation();

 const location = useLocation();
 const isDashboard = location.pathname.includes('/app');

 return (
 <div className={isDashboard ? "font-sans text-nature-900 dark:text-white py-4 sm:py-8" : "min-h-screen bg-nature-50 dark:bg-nature-900 font-sans text-nature-900 dark:text-white"}>
 {!isDashboard && (
 <nav className="h-16 bg-white dark:bg-nature-950/80 backdrop-blur-md border-b border-nature-200 dark:border-nature-800 z-50 px-4 md:px-8 flex items-center justify-between sticky top-0">
 <Link to="/" className="flex items-center gap-2 text-xl font-bold group">
 <ArrowLeft className="w-5 h-5 text-nature-400 dark:text-white group-hover:-translate-x-1 transition-transform" />
 <Sprout className="w-6 h-6 text-earth-500 ml-2" />
 <span>{t("Agri")}<span className="text-earth-500">{t("Smart")}</span></span>
 </Link>
 </nav>
 )}

 <div className={`max-w-3xl mx-auto ${isDashboard ? 'px-2' : 'px-4 py-12 sm:py-16'}`}>
 <div className="bg-white dark:bg-nature-950 rounded-3xl p-8 md:p-12 shadow-sm border border-nature-100 dark:border-nature-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8">{t("Terms & Privacy Policy")}</h1>
 <div className="space-y-6 text-nature-600 dark:text-white leading-relaxed">
 {/* Terms Section */}
 <div className="mb-10">
 <h2 className="text-2xl font-bold text-nature-900 dark:text-white mb-6 border-b border-nature-100 dark:border-nature-800 pb-2">{t("Terms and Conditions")}</h2>
 <section className="mb-6">
 <h3 className="text-lg font-bold text-nature-900 dark:text-white mb-2">{t("1. Acceptance of Terms")}</h3>
 <p>{t("By accessing and using AgriSmart's IoT irrigation and crop monitoring services, you agree to comply with and be bound by these Terms and Conditions. If you do not agree, please do not use our platform.")}</p>
 </section>

 <section className="mb-6">
 <h3 className="text-lg font-bold text-nature-900 dark:text-white mb-2">{t("2. Service Usage")}</h3>
 <p>{t("Our platform provides predictive analytics, sensor data monitoring, and automated irrigation capabilities. These tools are designed to assist in farm management but should not entirely replace professional agronomic judgment.")}</p>
 </section>

 <section className="mb-6">
 <h3 className="text-lg font-bold text-nature-900 dark:text-white mb-2">{t("3. User Responsibilities")}</h3>
 <ul className="list-disc pl-5 space-y-2">
 <li>{t("You are responsible for maintaining the confidentiality of your account credentials.")}</li>
 <li>{t("You agree to use the hardware sensors provided only for their intended agricultural purposes.")}</li>
 <li>{t("Tampering with the ESP32 nodes or valves violates these terms.")}</li>
 </ul>
 </section>
 </div>

 {/* Privacy Section */}
 <div>
 <h2 className="text-2xl font-bold text-nature-900 dark:text-white mb-6 border-b border-nature-100 dark:border-nature-800 pb-2">{t("Privacy Policy")}</h2>

 <section className="mb-6">
 <h3 className="text-lg font-bold text-nature-900 dark:text-white mb-2">{t("1. Information We Collect")}</h3>
 <p>{t("AgriSmart collects various types of information to optimize your farm management experience:")}</p>
 <ul className="list-disc pl-5 space-y-2 mt-2">
 <li><strong>{t("Account Details:")}</strong> {t("Name, Farmer ID, email, and contact number.")}</li>
 <li><strong>{t("Farm Data:")}</strong> {t("Sensor telemetry (soil moisture, temperature, pH), irrigation logs, and crop yield data.")}</li>
 <li><strong>{t("Location Data:")}</strong> {t("Geographical coordinates used strictly for weather API fetching and satellite map integration.")}</li>
 </ul>
 </section>

 <section className="mb-6">
 <h3 className="text-lg font-bold text-nature-900 dark:text-white mb-2">{t("2. How We Use Your Data")}</h3>
 <p>{t("Your agricultural data is processed through our cloud AI models to provide precise irrigation schedules, disease predictions, and yield estimations. We do not sell your personal or farm data to any third-party marketing agencies.")}</p>
 </section>

 <section className="mb-6">
 <h3 className="text-lg font-bold text-nature-900 dark:text-white mb-2">{t("3. Data Security")}</h3>
 <p>{t("We employ enterprise-grade security including Supabase Row Level Security (RLS) to ensure that your telemetry and account data are accessible only to you and authorized platform administrators.")}</p>
 </section>

 <section className="mb-6">
 <h3 className="text-lg font-bold text-nature-900 dark:text-white mb-2">{t("4. User Rights")}</h3>
 <p>{t("You have the right to access, rectify, or delete your data at any time. To request a complete export or deletion of your farm's historical data, please reach out via our Contact Support portal.")}</p>
 </section>
 </div>

 <p className="pt-8 text-sm text-nature-500 dark:text-white">{t("Last updated: March 2026")}</p>
 </div>
 </div>
 </div>
 </div>
 );
}
