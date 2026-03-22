import fs from 'fs';

const newTranslations = {
  "Profile Info": { hi: "प्रोफाइल जानकारी", mr: "प्रोफाइल माहिती" },
  "Security": { hi: "सुरक्षा", mr: "सुरक्षा" },
  "Change Password": { hi: "पासवर्ड बदलें", mr: "पासवर्ड बदला" },
  "Full Name": { hi: "पूरा नाम", mr: "पूर्ण नाव" },
  "Mobile Number": { hi: "मोबाइल नंबर", mr: "मोबाईल क्रमांक" },
  "Save Profile": { hi: "प्रोफाइल सहेजें", mr: "प्रोफाइल जतन करा" },
  "New Password": { hi: "नया पासवर्ड", mr: "नवीन पासवर्ड" },
  "Confirm New Password": { hi: "नया पासवर्ड कन्फर्म करें", mr: "नवीन पासवर्डची पुष्टी करा" },
  "Update Password": { hi: "पासवर्ड अपडेट करें", mr: "पासवर्ड अपडेट करा" },
  "Language Preference": { hi: "भाषा प्राथमिकता", mr: "भाषा प्राधान्य" },
  "Save Language": { hi: "भाषा सहेजें", mr: "भाषा जतन करा" },

  "Live Analytics Dashboard": { hi: "लाइव एनालिटिक्स डैशबोर्ड", mr: "थेट ॲनालिटिक्स डॅशबोर्ड" },
  "Real-time incoming ESP32 sensor telemetry streams.": { hi: "वास्तविक समय में आने वाली ESP32 सेंसर टेलीमेट्री स्ट्रीम।", mr: "रिअल-टाइम येणारे ईएसपी32 सेन्सर टेलिमेट्री स्ट्रीम्स." },
  "Loading Data...": { hi: "डेटा लोड हो रहा है...", mr: "डेटा लोड होत आहे..." },
  "Live Telemetry": { hi: "लाइव टेलीमेट्री", mr: "थेट टेलिमेट्री" },
  "Avg Soil Moisture": { hi: "औसत मिट्टी की नमी", mr: "सरासरी मातीची ओलावा" },
  "Moving average of live window": { hi: "लाइव विंडो की मूविंग एवरेज", mr: "लाइव्ह विंडोची मूव्हिंग एव्हरेज" },
  "Crop Health Index": { hi: "फसल स्वास्थ्य सूचकांक", mr: "पीक आरोग्य निर्देशांक" },
  "Optimal": { hi: "अनुकूल", mr: "इष्टतम" },
  "Correlated with telemetry": { hi: "टेलीमेट्री के साथ सहसंबद्ध", mr: "टेलिमेट्रीशी सहसंबंधित" },
  "Telemetry Status": { hi: "टेलीमेट्री स्थिति", mr: "टेलिमेट्री स्थिती" },
  "Listening to live ESP32": { hi: "लाइव ESP32 को सुन रहा है", mr: "थेट ईएसपी32 ऐकत आहे" },
  "Soil Moisture Dynamics": { hi: "मिट्टी की नमी गतिशीलता", mr: "मातीची ओलावा गतिशीलता" },
  "Waiting for data...": { hi: "डेटा का इंतजार...", mr: "डेटाची प्रतीक्षा..." },
  "Environmental Dynamics (Temperature & Humidity)": { hi: "पर्यावरणीय गतिशीलता (तापमान और आर्द्रता)", mr: "पर्यावरणीय गतिशीलता (तापमान आणि आर्द्रता)" },

  "Downloadable Analytics Report": { hi: "डाउनलोड योग्य एनालिटिक्स रिपोर्ट", mr: "डाउनलोड करण्यायोग्य ॲनालिटिक्स रिपोर्ट" },
  "Generate professional insights across selected telemetry windows.": { hi: "चयनित टेलीमेट्री विंडो पर पेशेवर जानकारी उत्पन्न करें।", mr: "निवडलेल्या टेलिमेट्री विंडोवर व्यावसायिक अंतर्दृष्टी व्युत्पन्न करा." },
  "Last 1 Hour": { hi: "पिछले 1 घंटे", mr: "मागील १ तासात" },
  "Last 1 Day": { hi: "पिछला 1 दिन", mr: "मागील १ दिवसात" },
  "Last 7 Days": { hi: "पिछले 7 दिन", mr: "मागील ७ दिवसात" },
  "Custom": { hi: "कस्टम", mr: "सानुकूल" },
  "Download PDF": { hi: "PDF डाउनलोड करें", mr: "PDF डाउनलोड करा" },
  "Generating...": { hi: "उत्पन्न हो रहा है...", mr: "तयार करत आहे..." },
  "Querying selected range...": { hi: "चयनित सीमा को क्वेरी कर रहा है...", mr: "निवडलेल्या श्रेणीची चौकशी करत विश्लेषित करत आहे..." },
  "No data available for selected range": { hi: "चयनित सीमा के लिए कोई डेटा उपलब्ध नहीं है", mr: "निवडलेल्या श्रेणीसाठी कोणताही डेटा उपलब्ध नाही" },
  "Try widening your time window or selecting a different date.": { hi: "अपनी समय सीमा को चौड़ा करने या कोई अन्य तारीख चुनने का प्रयास करें।", mr: "तुमची वेळ मर्यादा रुंद करण्याचा किंवा दुसरी तारीख निवडण्याचा प्रयत्न करा." },
  "Farm Analytics Report": { hi: "कृषि एनालिटिक्स रिपोर्ट", mr: "कृषी ॲनालिटिक्स रिपोर्ट" },
  "Generated:": { hi: "उत्पन्न:", mr: "तयार केले:" },
  "Account Holder": { hi: "खाताधारक", mr: "खातेदार" },
  "Assigned Telemetry Array": { hi: "नियुक्त टेलीमेट्री एरे", mr: "नियुक्त टेलिमेट्री ॲरे" },
  "Avg Moisture": { hi: "औसत नमी", mr: "सरासरी ओलावा" },
  "Avg Temperature": { hi: "औसत तापमान", mr: "सरासरी तापमान" },
  "Avg Tank Level": { hi: "औसत टैंक स्तर", mr: "सरासरी टँक पातळी" },
  "Irrigation Events": { hi: "सिंचाई की घटनाएँ", mr: "सिंचनाच्या घटना" },
  "Detected Spikes": { hi: "देखे गए स्पाइक्स", mr: "शोधलेले स्पाइक्स" },
  "Algorithmic Insight": { hi: "एल्गोरिदमिक इनसाइट", mr: "अल्गोरिदमिक इनसाइट" },
  "Moisture vs Time": { hi: "नमी बनाम समय", mr: "ओलावा विरुद्ध वेळ" },
  "Temperature vs Time": { hi: "तापमान बनाम समय", mr: "तापमान विरुद्ध वेळ" },
  "Raw Telemetry Snippet (Latest 6 Rows)": { hi: "कच्ची टेलीमेट्री स्निपेट (नवीनतम 6 पंक्तियाँ)", mr: "कच्चे टेलिमेट्री स्निपेट (नवीनतम ६ पंक्ती)" },
  "Timestamp": { hi: "टाइमस्टैम्प", mr: "टाइमस्टॅम्प" },
  "Moisture (%)": { hi: "नमी (%)", mr: "ओलावा (%)" },
  "Temperature (°C)": { hi: "तापमान (°C)", mr: "तापमान (°C)" },
  "Water Level (%)": { hi: "पानी का स्तर (%)", mr: "पाण्याची पातळी (%)" },

  "Yield Prediction Model": { hi: "उपज भविष्यवाणी मॉडल", mr: "उत्पादन अंदाज मॉडेल" },
  "Tons / Hectare": { hi: "टन / हेक्टेयर", mr: "टन / हेक्टर" },
  "Based on current soil conditions, historical data from India, and the 14-day weather forecast, your yield is projected to be +5% higher than the regional average.": { hi: "वर्तमान मिट्टी की स्थिति, भारत के ऐतिहासिक डेटा और 14 दिवसीय मौसम पूर्वानुमान के आधार पर, आपकी उपज क्षेत्रीय औसत से +5% अधिक होने का अनुमान है।", mr: "सध्याची मातीची स्थिती, भारतातील ऐतिहासिक डेटा आणि १४ दिवसांचा हवामान अंदाज यावर आधारित, तुमचे उत्पादन प्रादेशिक सरासरीपेक्षा +५% जास्त असण्याचा अंदाज आहे." },
  "Medium Risk": { hi: "मध्यम जोखिम", mr: "मध्यम धोका" },
  "Crop Rust": { hi: "फसल जंग (रस्ट)", mr: "पीक गंज (रस्ट)" },
  "Run AI Diagnostics": { hi: "AI निदान चलाएँ", mr: "AI निदान चालवा" },
  
  "Apply Mulch to Prevent Moisture Loss": { hi: "नमी के नुकसान को रोकने के लिए मल्च लगाएं", mr: "ओलावा कमी होण्यापासून रोखण्यासाठी आच्छादन (मल्च) लावा" },
  "Low humidity at 26% causes soil moisture to evaporate 2-3× faster than normal. Mulching can cut water needs by up to 40%.": { hi: "26% कम आर्द्रता के कारण मिट्टी की नमी सामान्य से 2-3 गुना तेजी से वाष्पित होती है। मल्चिंग से पानी की आवश्यकता 40% तक कम हो सकती है।", mr: "२६% कमी आर्द्रतेमुळे मातीतील ओलावा सामान्यपेक्षा २-३ पट वेगाने बाष्पीभवन होतो. मल्चिंगमुळे पाण्याची गरज ४०% पर्यंत कमी होऊ शकते." },
  "Rabi Season — Monitor for Crop Rust": { hi: "रबी का मौसम — फसल जंग की निगरानी करें", mr: "रब्बी हंगाम - पिकांच्या गंजावर लक्ष ठेवा" },
  "Rabi crops and chickpea are susceptible to yellow and stem rust during cool humid periods. Inspect flag leaves weekly.": { hi: "रबी की फसलें और चना ठंडे और नमी वाले मौसम में पीले और तने के जंग के प्रति संवेदनशील होते हैं। साप्ताहिक रूप से फ्लैग पत्तियों का निरीक्षण करें।", mr: "थंड दमट कालावधीत रब्बी पिके आणि हरभरा पिवळ्या आणि स्टेम रस्ट (गंज) साठी संवेदनशील असतात. आठवड्यातून एकदा फ्लॅग पानांची तपासणी करा." },
  "Suitable Farming Conditions": { hi: "कृषि के लिए उपयुक्त परिस्थितियाँ", mr: "शेतीसाठी योग्य परिस्थिती" },
  "Current weather (27.3°C) and environment are highly suitable for all general farming operations.": { hi: "वर्तमान मौसम (27.3°C) और पर्यावरण सभी सामान्य कृषि कार्यों के लिए अत्यधिक उपयुक्त हैं।", mr: "सध्याचे हवामान (२७.३°C) आणि पर्यावरण सर्व सामान्य शेतीच्या कामांसाठी अत्यंत योग्य आहे." },
  "Irrigation Schedule is Optimal": { hi: "सिंचाई अनुसूची अनुकूल है", mr: "सिंचन वेळापत्रक इष्टतम आहे" },
  "Soil moisture at 45% is within the ideal range (40-65%). Maintain your current watering schedule.": { hi: "45% पर मिट्टी की नमी आदर्श सीमा (40-65%) के भीतर है। अपनी वर्तमान सिंचाई अनुसूची बनाए रखें।", mr: "४५% मातीची आर्द्रता आदर्श श्रेणीत (४०-६५%) आहे. तुमचे सध्याचे सिंचन वेळापत्रक चालू ठेवा." },
  "Good Window for Drone Operations": { hi: "ड्रोन संचालन के लिए अच्छा समय", mr: "ड्रोन ऑपरेशन्ससाठी चांगली वेळ" },
  "Wind at 2.8 m/s and clear conditions provide a good flight window for NDVI scanning and field surveys.": { hi: "2.8 m/s की हवा और साफ मौसम NDVI स्कैनिंग और फील्ड सर्वेक्षण के लिए एक अच्छी उड़ान खिड़की प्रदान करते हैं।", mr: "२.८ m/s चा वारा आणि स्वच्छ परिस्थिती एनडीव्हीआय स्कॅनिंग आणि फील्ड सर्वेक्षणांसाठी एक चांगली उड्डाण विंडो प्रदान करते." }
};

const i18nPath = 'src/i18n.js';
let i18nContent = fs.readFileSync(i18nPath, 'utf8');

// The file contains:
// const resources = {
//   en: { translation: { ... } },
//   hi: { translation: { ... } },
//   mr: { translation: { ... } }
// };

// We will parse it by finding the start of each translation object
const enStart = i18nContent.indexOf('en: {\n    translation: {') + 'en: {\n    translation: {'.length;
const hiStart = i18nContent.indexOf('hi: {\n    translation: {') + 'hi: {\n    translation: {'.length;
const mrStart = i18nContent.indexOf('mr: {\n    translation: {') + 'mr: {\n    translation: {'.length;

function insertKeys(content, startIndex, langMap) {
  let insertionPoint = content.indexOf('\n', startIndex) + 1;
  let linesToInsert = ``;
  for (const [key, translations] of Object.entries(langMap)) {
    if (!content.includes(`"${key}"`)) { // Only add if missing
      linesToInsert += `      "${key}": "${translations.val}",\n`;
    }
  }
  return content.slice(0, insertionPoint) + linesToInsert + content.slice(insertionPoint);
}

const enUpdates = Object.keys(newTranslations).reduce((acc, key) => { acc[key] = { val: key }; return acc; }, {});
const hiUpdates = Object.keys(newTranslations).reduce((acc, key) => { acc[key] = { val: newTranslations[key].hi }; return acc; }, {});
const mrUpdates = Object.keys(newTranslations).reduce((acc, key) => { acc[key] = { val: newTranslations[key].mr }; return acc; }, {});

// We must apply replacements backwards to not mess up earlier indices
i18nContent = insertKeys(i18nContent, mrStart, mrUpdates);
const newHiStart = i18nContent.indexOf('hi: {\n    translation: {') + 'hi: {\n    translation: {'.length;
i18nContent = insertKeys(i18nContent, newHiStart, hiUpdates);
const newEnStart = i18nContent.indexOf('en: {\n    translation: {') + 'en: {\n    translation: {'.length;
i18nContent = insertKeys(i18nContent, newEnStart, enUpdates);

fs.writeFileSync(i18nPath, i18nContent);
console.log('Successfully injected new keys into i18n.js');
