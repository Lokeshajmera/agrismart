import React, { useState, useMemo } from 'react';
import { Landmark, Search, Filter, Languages, Sparkles, Sprout, HandCoins, ShieldCheck, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const schemeData = [
 {
 id: 'pmksy',
 category: 'irrigation',
 icon: Sprout,
 en: {
 title: 'Pradhan Mantri Krishi Sinchai Yojana (PMKSY)',
 desc: 'Improve farm water use efficiency and expand cultivable area under assured irrigation (More crop per drop).',
 eligibility: 'All farmers, specific preference to small & marginal farmers.',
 benefits: 'Financial assistance up to 55% for micro-irrigation systems like drips and sprinklers.',
 docs: 'Aadhar Card, Land documents (Khasra/Khatauni), Bank Passbook.',
 apply: 'Visit local agriculture department or PMKSY official portal.',
 link: 'https://pmksy.gov.in/'
 },
 hi: {
 title: 'प्रधानमंत्री कृषि सिंचाई योजना (PMKSY)',
 desc: 'खेतों में पानी के उपयोग की दक्षता में सुधार और सुनिश्चित सिंचाई के तहत खेती योग्य क्षेत्र का विस्तार ("प्रति बूंद अधिक फसल").',
 eligibility: 'सभी किसान, छोटे और सीमांत किसानों को विशेष प्राथमिकता।',
 benefits: 'ड्रिप और स्प्रिंकलर जैसी सूक्ष्म सिंचाई प्रणालियों के लिए 55% तक वित्तीय सहायता।',
 docs: 'आधार कार्ड, भूमि के दस्तावेज (खसरा/खतौनी), बैंक पासबुक।',
 apply: 'स्थानीय कृषि विभाग या PMKSY आधिकारिक पोर्टल पर जाएं।',
 link: 'https://pmksy.gov.in/'
 }
 },
 {
 id: 'pmkisan',
 category: 'finance',
 icon: HandCoins,
 en: {
 title: 'PM-KISAN Scheme',
 desc: 'Direct income support scheme for landholding farmer families across the country.',
 eligibility: 'Must own cultivable land in their name. Excludes institutional land holders and high-income earners.',
 benefits: 'Financial support of ₹6,000 per year in three equal installments directly to bank accounts.',
 docs: 'Aadhar Card, Bank Account details, Land ownership proof.',
 apply: 'Apply through PM-KISAN portal or local CSC centers.',
 link: 'https://pmkisan.gov.in/'
 },
 hi: {
 title: 'पीएम-किसान योजना',
 desc: 'देश भर में खेतीहर किसान परिवारों के लिए प्रत्यक्ष आय सहायता योजना।',
 eligibility: 'अपने नाम पर खेती योग्य जमीन होनी चाहिए। संस्थागत भूमि धारक और उच्च आय वाले लोग बाहर।',
 benefits: 'प्रति वर्ष ₹6,000 की वित्तीय सहायता, सीधे बैंक खातों में तीन समान किश्तों में।',
 docs: 'आधार कार्ड, बैंक खाता विवरण, भूमि स्वामित्व प्रमाण।',
 apply: 'पीएम-किसान पोर्टल या स्थानीय सीएससी केंद्रों के माध्यम से आवेदन करें।',
 link: 'https://pmkisan.gov.in/'
 }
 },
 {
 id: 'pmfby',
 category: 'insurance',
 icon: ShieldCheck,
 en: {
 title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
 desc: 'Comprehensive crop insurance covering natural calamities, pests, and diseases.',
 eligibility: 'All farmers growing notified crops in notified areas. Compulsory for loanee farmers.',
 benefits: 'Full insured amount against crop failure. Premium is only 1.5% for Rabi, 2% for Kharif, and 5% for commercial/horticultural crops.',
 docs: 'Aadhar Card, Crop sowing certificate, Land records.',
 apply: 'Through banks, CSCs, or PMFBY national portal.',
 link: 'https://pmfby.gov.in/'
 },
 hi: {
 title: 'प्रधानमंत्री फसल बीमा योजना (PMFBY)',
 desc: 'प्राकृतिक आपदाओं, कीटों और बीमारियों को कवर करने वाला व्यापक फसल बीमा।',
 eligibility: 'अधिसूचित क्षेत्रों में अधिसूचित फसलें उगाने वाले सभी किसान। ऋणी किसानों के लिए अनिवार्य।',
 benefits: 'फसल खराब होने पर पूर्ण बीमित राशि। प्रीमियम रबी के लिए केवल 1.5%, खरीफ के लिए 2% और वाणिज्यिक/बागवानी फसलों के लिए 5% है।',
 docs: 'आधार कार्ड, फसल बुवाई का प्रमाण पत्र, भूमि रिकॉर्ड।',
 apply: 'बैंकों, सीएससी या पीएमएफबीवाई राष्ट्रीय पोर्टल के माध्यम से।',
 link: 'https://pmfby.gov.in/'
 }
 },
 {
 id: 'kcc',
 category: 'finance',
 icon: HandCoins,
 en: {
 title: 'Kisan Credit Card (KCC)',
 desc: 'Ensure adequate and timely credit support from the banking system for agricultural operations.',
 eligibility: 'All farmers, tenant farmers, and sharecroppers.',
 benefits: 'Short-term credit limits with subsidized interest rates (often effectively 4% on prompt repayment).',
 docs: 'Aadhar, Pan Card, Land documents, Passport size photos.',
 apply: 'Approach any commercial, cooperative, or rural bank branch.',
 link: 'https://sbi.co.in/web/agri-rural/agriculture-banking/crop-loan/kisan-credit-card'
 },
 hi: {
 title: 'किसान क्रेडिट कार्ड (KCC)',
 desc: 'कृषि कार्यों के लिए बैंकिंग प्रणाली से पर्याप्त और समय पर ऋण सहायता सुनिश्चित करना।',
 eligibility: 'सभी किसान, किरायेदार किसान और बटाईदार।',
 benefits: 'रियायती ब्याज दरों के साथ अल्पकालिक ऋण सीमा (अक्सर समय पर भुगतान करने पर 4% प्रभावी)।',
 docs: 'आधार, पैन कार्ड, भूमि के दस्तावेज, पासपोर्ट साइज फोटो।',
 apply: 'किसी भी वाणिज्यिक, सहकारी या ग्रामीण बैंक शाखा से संपर्क करें।',
 link: 'https://sbi.co.in/web/agri-rural/agriculture-banking/crop-loan/kisan-credit-card'
 }
 }
];

export default function GovernmentSchemes() {
 const [lang, setLang] = useState('en');
 const [search, setSearch] = useState('');
 const [category, setCategory] = useState('all');
 const [expandedId, setExpandedId] = useState(null);

 // Filter schemes
 const filteredSchemes = useMemo(() => {
 return schemeData.filter(scheme => {
 const matchCat = category === 'all' || scheme.category === category;
 const matchSearch = scheme[lang].title.toLowerCase().includes(search.toLowerCase()) ||
 scheme[lang].desc.toLowerCase().includes(search.toLowerCase());
 return matchCat && matchSearch;
 });
 }, [search, category, lang]);

 return (
 <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">

 {/* Header & Controls */}
 <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
 <div>
 <h1 className="text-2xl font-bold text-nature-900 dark:text-white tracking-tight flex items-center gap-2">
 <Landmark className="w-7 h-7 text-earth-500" />
 {lang === 'en' ? 'Government Schemes & Support' : 'सरकारी योजनाएं एवं सहायता'}
 </h1>
 <p className="text-nature-500 dark:text-white mt-1 max-w-xl">
 {lang === 'en'
 ? 'Discover agricultural subsidies, financial support, and insurance programs available for your farm.'
 : 'अपने खेत के लिए उपलब्ध कृषि सब्सिडी, वित्तीय सहायता और बीमा कार्यक्रमों की खोज करें।'}
 </p>
 </div>

 <button
 onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
 className="flex items-center gap-2 bg-nature-100 dark:bg-nature-800 text-nature-800 dark:text-white px-4 py-2 rounded-lg text-sm font-bold border border-nature-200 dark:border-nature-800 hover:bg-nature-200 transition-colors"
 >
 <Languages className="w-4 h-4" />
 {lang === 'en' ? 'हिंदी में पढ़ें' : 'Read in English'}
 </button>
 </div>

 {/* AI Recommendation Banner */}
 <div className="bg-gradient-to-r from-earth-600 to-earth-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 dark:bg-nature-950/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
 <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
 <div className="p-3 bg-white dark:bg-nature-950/20 rounded-xl backdrop-blur-sm shrink-0">
 <Sparkles className="w-8 h-8 text-earth-100" />
 </div>
 <div className="flex-1">
 <p className="text-earth-200 text-sm font-bold tracking-wider uppercase mb-1">
 {lang === 'en' ? 'AI Recommended For You' : 'AI द्वारा आपके लिए अनुशंसित'}
 </p>
 <h2 className="text-2xl font-extrabold mb-2 text-white">
 {schemeData[0][lang].title}
 </h2>
 <p className="text-earth-100 text-sm max-w-2xl leading-relaxed">
 {lang === 'en'
 ? 'Based on your profile as a Farmer actively managing irrigation zones, you are highly eligible for PMKSY subsidies. Upgrading your sensors and drip lines can be subsidized by up to 55%.'
 : 'गेहूं के किसान के रूप में आपकी प्रोफ़ाइल के आधार पर, आप पीएमकेएसवाई सब्सिडी के लिए अत्यधिक पात्र हैं। आपके सेंसर और ड्रिप लाइनों को अपग्रेड करने पर 55% तक की सब्सिडी मिल सकती है।'}
 </p>
 </div>
 <button
 onClick={() => setExpandedId('pmksy')}
 className="bg-white dark:bg-nature-950 text-earth-700 px-6 py-2.5 rounded-lg text-sm font-extrabold hover:bg-earth-50 transition-colors shrink-0 shadow-sm"
 >
 {lang === 'en' ? 'View Eligibility' : 'पात्रता देखें'}
 </button>
 </div>
 </div>

 {/* Search & Filters */}
 <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-nature-950 p-4 rounded-xl border border-nature-200 dark:border-nature-800 shadow-sm mt-8">
 <div className="relative flex-1">
 <Search className="w-5 h-5 text-nature-400 dark:text-white absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 placeholder={lang === 'en' ? "Search schemes by name..." : "नाम से योजनाएं खोजें..."}
 className="w-full pl-10 pr-4 py-2 border border-nature-300 rounded-lg focus:outline-none focus:border-earth-500 focus:ring-1 focus:ring-earth-500 text-sm"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 />
 </div>
 <div className="flex items-center gap-2">
 <Filter className="w-5 h-5 text-nature-500 dark:text-white hidden md:block" />
 <select
 className="border border-nature-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-earth-500 focus:ring-1 focus:ring-earth-500 bg-white dark:bg-nature-950 min-w-[180px]"
 value={category}
 onChange={(e) => setCategory(e.target.value)}
 >
 <option value="all">{lang === 'en' ? 'All Categories' : 'सभी श्रेणियां'}</option>
 <option value="irrigation">{lang === 'en' ? 'Irrigation & Water' : 'सिंचाई और जल'}</option>
 <option value="finance">{lang === 'en' ? 'Financial Support' : 'वित्तीय सहायता'}</option>
 <option value="insurance">{lang === 'en' ? 'Crop Insurance' : 'फसल बीमा'}</option>
 </select>
 </div>
 </div>

 {/* Schemes List */}
 <div className="space-y-4">
 {filteredSchemes.map((scheme) => {
 const isExpanded = expandedId === scheme.id;
 return (
 <div key={scheme.id} className={`bg-white dark:bg-nature-950 rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-earth-500 shadow-md' : 'border-nature-200 dark:border-nature-800 shadow-sm hover:border-earth-300'}`}>

 {/* Card Header (Clickable) */}
 <div
 className="p-5 md:p-6 cursor-pointer flex items-start md:items-center gap-4 group"
 onClick={() => setExpandedId(isExpanded ? null : scheme.id)}
 >
 <div className={`p-3 rounded-xl transition-colors ${isExpanded ? 'bg-earth-100 text-earth-600' : 'bg-nature-100 dark:bg-nature-800 text-nature-600 dark:text-white group-hover:bg-nature-200'}`}>
 <scheme.icon className="w-6 h-6" />
 </div>
 <div className="flex-1 pr-4">
 <h3 className={`text-lg font-bold transition-colors ${isExpanded ? 'text-earth-700' : 'text-nature-900 dark:text-white group-hover:text-earth-600'}`}>
 {scheme[lang].title}
 </h3>
 <p className="text-sm text-nature-600 dark:text-white mt-1 line-clamp-1">
 {scheme[lang].desc}
 </p>
 </div>
 <div className="shrink-0 text-nature-400 dark:text-white p-2">
 {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
 </div>
 </div>

 {/* Expanded Details */}
 {isExpanded && (
 <div className="px-6 pb-6 pt-2 border-t border-nature-100 dark:border-nature-700/50 animate-in slide-in-from-top-2 bg-nature-50 dark:bg-nature-900/50">
 <p className="text-nature-700 dark:text-white leading-relaxed mb-6">
 {scheme[lang].desc}
 </p>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
 <div className="space-y-2">
 <p className="text-xs font-bold text-earth-600 uppercase tracking-wider">{lang === 'en' ? 'Key Benefits' : 'प्रमुख लाभ'}</p>
 <p className="text-sm text-nature-800 dark:text-white bg-white dark:bg-nature-950 p-3 rounded-lg border border-nature-200 dark:border-nature-800">{scheme[lang].benefits}</p>
 </div>
 <div className="space-y-2">
 <p className="text-xs font-bold text-earth-600 uppercase tracking-wider">{lang === 'en' ? 'Eligibility' : 'पात्रता'}</p>
 <p className="text-sm text-nature-800 dark:text-white bg-white dark:bg-nature-950 p-3 rounded-lg border border-nature-200 dark:border-nature-800">{scheme[lang].eligibility}</p>
 </div>
 <div className="space-y-2 md:col-span-2">
 <p className="text-xs font-bold text-earth-600 uppercase tracking-wider">{lang === 'en' ? 'Required Documents' : 'आवश्यक दस्तावेज़'}</p>
 <p className="text-sm text-nature-800 dark:text-white bg-white dark:bg-nature-950 p-3 rounded-lg border border-nature-200 dark:border-nature-800">{scheme[lang].docs}</p>
 </div>
 </div>

 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-nature-200 dark:border-nature-800">
 <p className="text-sm text-nature-600 dark:text-white">
 <span className="font-medium text-nature-900 dark:text-white">{lang === 'en' ? 'How to Apply: ' : 'आवेदन कैसे करें: '}</span>
 {scheme[lang].apply}
 </p>
 <a
 href={scheme[lang].link}
 target="_blank"
 rel="noopener noreferrer"
 className="w-full sm:w-auto flex items-center justify-center gap-2 bg-nature-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-nature-800 transition-colors shrink-0"
 >
 {lang === 'en' ? 'Visit Official Portal' : 'आधिकारिक पोर्टल पर जाएं'}
 <ExternalLink className="w-4 h-4" />
 </a>
 </div>
 </div>
 )}
 </div>
 );
 })}

 {filteredSchemes.length === 0 && (
 <div className="text-center py-12 bg-white dark:bg-nature-950 rounded-2xl border border-nature-200 dark:border-nature-800">
 <Landmark className="w-12 h-12 text-nature-300 dark:text-white mx-auto mb-3" />
 <p className="text-nature-600 dark:text-white font-medium">{lang === 'en' ? 'No schemes found matching your search.' : 'आपकी खोज से मेल खाने वाली कोई योजना नहीं मिली।'}</p>
 </div>
 )}
 </div>

 </div>
 );
}
