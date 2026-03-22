import fs from 'fs';

const newTranslations = {
  // Sidebar & Navigation
  "Dashboard": { hi: "डैशबोर्ड", mr: "डॅशबोर्ड" },
  "Farm Overview": { hi: "खेत का अवलोकन", mr: "शेती विहंगावलोकन" },
  "Irrigation Control": { hi: "सिंचाई नियंत्रण", mr: "सिंचन नियंत्रण" },
  "Drone Missions": { hi: "ड्रोन मिशन", mr: "ड्रोन मोहीम" },
  "Recommendations": { hi: "सुझाव", mr: "शिफारसी" },
  "Govt Schemes": { hi: "सरकारी योजनाएं", mr: "सरकारी योजना" },
  "Alerts": { hi: "अलर्ट", mr: "इशारे" },
  "Complaints": { hi: "शिकायतें", mr: "तक्रारी" },
  "Suggestions": { hi: "सुझाव", mr: "सूचना" },
  "Analytics": { hi: "एनालिटिक्स", mr: "ॲनालिटिक्स" },
  "Settings": { hi: "सेटिंग्स", mr: "सेटिंग्ज" },
  "Contact Support": { hi: "संपर्क सहायता", mr: "संपर्क समर्थन" },
  "Search": { hi: "खोजें", mr: "शोधा" },
  "Impact": { hi: "प्रभाव", mr: "प्रभाव" },
  "Avg Soil Moisture": { hi: "औसत मिट्टी की नमी", mr: "सरासरी मातीतील ओलावा" },

  // Dashboard Specific
  "Crop Health Map": { hi: "फसल स्वास्थ्य मानचित्र", mr: "पीक आरोग्य नकाशा" },
  "Very Healthy": { hi: "बहुत स्वस्थ", mr: "अतिशय निरोगी" },
  "CONTROL PANEL": { hi: "नियंत्रण कक्ष", mr: "नियंत्रण कक्ष" },
  "NEXT IRRIGATION": { hi: "अगली सिंचाई", mr: "पुढील सिंचन" },
  "Soil Condition": { hi: "मिट्टी की स्थिति", mr: "मातीची स्थिती" },
  "Moderate": { hi: "मध्यम", mr: "मध्यम" },
  "3 Hours": { hi: "3 घंटे", mr: "3 तास" },

  // Analytics
  "Real-time incoming ESP32 sensor telemetry streams.": { hi: "रीयल-टाइम आने वाली ESP32 सेंसर टेलीमेट्री स्ट्रीम।", mr: "रिअल-टाइम येणारे ESP32 सेन्सर टेलिमेट्री स्ट्रीम्स." },
  "Loading Data...": { hi: "डेटा लोड हो रहा है...", mr: "डेटा लोड होत आहे..." },
  "Live Telemetry": { hi: "लाइव टेलीमेट्री", mr: "थेट टेलिमेट्री" },
  "Moving average of live window": { hi: "लाइव विंडो का मूविंग एवरेज", mr: "थेट विंडोची मूव्हिंग एव्हरेज" },
  "Crop Health Index": { hi: "फसल स्वास्थ्य सूचकांक", mr: "पीक आरोग्य निर्देशांक" },
  "Optimal": { hi: "इष्टतम", mr: "इष्टतम" },
  "Correlated with telemetry": { hi: "टेलीमेट्री के साथ सहसंबद्ध", mr: "टेलिमेट्रीशी संबंधित" },
  "Telemetry Status": { hi: "टेलीमेट्री स्थिति", mr: "टेलिमेट्री स्थिती" },
  "Active": { hi: "सक्रिय", mr: "सक्रिय" },
  "Listening to live ESP32": { hi: "लाइव ESP32 सुन रहा है", mr: "थेट ESP32 ऐकत आहे" },
  "Soil Moisture Dynamics": { hi: "मिट्टी की नमी की गतिशीलता", mr: "मातीतील ओलाव्याची गतिशीलता" },
  "Environmental Dynamics (Temperature & Humidity)": { hi: "पर्यावरणीय गतिशीलता (तापमान और आर्द्रता)", mr: "पर्यावरणीय गतिशीलता (तापमान आणि आर्द्रता)" },
  "Waiting for data...": { hi: "डेटा की प्रतीक्षा कर रहा है...", mr: "डेटाची प्रतीक्षा करत आहे..." },

  // AI Crop Intelligence
  "AI Crop Intelligence": { hi: "एआई फसल बुद्धिमत्ता", mr: "एआय पीक बुद्धिमत्ता" },
  "Machine Learning insights tailored for your crop.": { hi: "आपकी फसल के लिए तैयार मशीन लर्निंग अंतर्दृष्टि।", mr: "तुमच्या पिकासाठी तयार केलेले मशीन लर्निंग इनसाइट्स." },
  "AI Models Active": { hi: "एआई मॉडल सक्रिय", mr: "एआय मॉडेल्स सक्रिय" },
  "Yield Prediction Model": { hi: "उपज भविष्यवाणी मॉडल", mr: "उत्पादन अंदाज मॉडेल" },
  "Running advanced machine learning diagnostics on latest sensor telemetry...": { hi: "नवीनतम सेंसर टेलीमेट्री पर उन्नत मशीन लर्निंग डायग्नोस्टिक्स चलाना...", mr: "नवीनतम सेन्सर टेलिमेट्रीवर प्रगत मशीन लर्निंग डायग्नोस्टिक्स चालवत आहे..." },
  "Tons / Hectare": { hi: "टन / हेक्टेयर", mr: "टन / हेक्टर" },
  "Based on current soil conditions, historical data from India, and the 14-day weather forecast, your yield is projected to be": { hi: "वर्तमान मिट्टी की स्थिति, भारत के ऐतिहासिक डेटा और 14-दिन के मौसम के पूर्वानुमान के आधार पर, आपकी उपज होने का अनुमान है", mr: "सध्याची मातीची स्थिती, भारतातील ऐतिहासिक डेटा आणि 14-दिवसांच्या हवामानाच्या अंदाजानुसार, तुमचे उत्पादन असण्याचा अंदाज आहे" },
  "than the regional average.": { hi: "क्षेत्रीय औसत से अधिक।", mr: "प्रादेशिक सरासरीपेक्षा जास्त." },
  "Growth Stage": { hi: "विकास का चरण", mr: "वाढीचा टप्पा" },
  "Heading": { hi: "शीर्षक", mr: "शीर्षक" },
  "Estimated Harvest": { hi: "अनुमानित फसल", mr: "अंदाजित कापणी" },
  "April 15": { hi: "15 अप्रैल", mr: "15 एप्रिल" },
  "Confidence": { hi: "आत्मविश्वास", mr: "आत्मविश्वास" },
  "Disease Risk": { hi: "रोग का जोखिम", mr: "रोगाचा धोका" },
  "Medium Risk": { hi: "मध्यम जोखिम", mr: "मध्यम धोका" },
  "Crop Rust": { hi: "फसल जंग", mr: "पीक गंज" },
  "High humidity tomorrow increases susceptibility. Consider preventative measures.": { hi: "कल उच्च आर्द्रता संवेदनशीलता बढ़ाती है। निवारक उपायों पर विचार करें।", mr: "उद्या जास्त आर्द्रतेमुळे संवेदनशीलता वाढते. प्रतिबंधात्मक उपायांचा विचार करा." },
  "Run AI Diagnostics": { hi: "एआई डायग्नोस्टिक्स चलाएं", mr: "एआय डायग्नोस्टिक्स चालवा" },
  "Insights Feed": { hi: "अंतर्दृष्टि फ़ीड", mr: "इनसाइट्स फीड" },

  // AI Insights Custom Cards
  "Soil Memory Adjusted": { hi: "मिट्टी की याददाश्त समायोजित", mr: "मातीची मेमरी समायोजित केली" },
  "The AI has learned that Zone 2 retains moisture 15% longer than Zone 1. Irrigation schedules have been updated automatically.": { hi: "एआई ने सीखा है कि ज़ोन 2 ज़ोन 1 की तुलना में 15% अधिक समय तक नमी बनाए रखता है। सिंचाई कार्यक्रम स्वचालित रूप से अपडेट कर दिए गए हैं।", mr: "एआयला समजले आहे की झोन 2 झोन 1 पेक्षा 15% जास्त काळ ओलावा टिकवून ठेवतो. सिंचन वेळापत्रक स्वयंचलितपणे अद्यतनित केले गेले आहे." },
  "Heat Stress Warning": { hi: "गर्मी के तनाव की चेतावनी", mr: "उष्णतेच्या तणावाचा इशारा" },
  "Temperatures projected to exceed 32°C next Tuesday. Pre-emptive short irrigation bursts scheduled.": { hi: "अगले मंगलवार को तापमान 32 डिग्री सेल्सियस से अधिक होने का अनुमान है। पूर्व-निवारक लघु सिंचाई फटने का कार्यक्रम है।", mr: "पुढील मंगळवारी तापमान 32°C पेक्षा जास्त असल्याचा अंदाज आहे. प्री-एम्प्टिव्ह शॉर्ट इरिगेशन बर्स्ट शेड्यूल केले आहेत." },
  "Vegetation Health (NDVI)": { hi: "वनस्पति स्वास्थ्य (एनडीवीआई)", mr: "वनस्पती आरोग्य (NDVI)" },
  "Satellite imagery analysis confirms uniform crop health across 95% of the acreage. No major anomalies.": { hi: "सैटेलाइट इमेजरी विश्लेषण 95% एकड़ में एकसमान फसल स्वास्थ्य की पुष्टि करता है। कोई बड़ी विसंगतियां नहीं।", mr: "सॅटेलाइट इमेजरी विश्लेषण 95% एकरमध्ये समान पीक आरोग्याची पुष्टी करते. कोणतीही मोठी विसंगती नाही." }
};

const i18nPath = './src/i18n.js';
let content = fs.readFileSync(i18nPath, 'utf8');

const languages = ['hi', 'mr'];

languages.forEach(lang => {
  const marker = `${lang}: {\n    translation: {\n`;
  const insertPos = content.indexOf(marker);
  
  if (insertPos !== -1) {
    let newEntries = [];
    Object.keys(newTranslations).forEach(key => {
      // Avoid duplicates
      if (!content.includes(`"${key}":`)) {
        newEntries.push(`      "${key}": "${newTranslations[key][lang]}",`);
      }
    });

    if (newEntries.length > 0) {
      const insertion = newEntries.join('\n') + '\n';
      const exactInsertPoint = insertPos + marker.length;
      content = content.slice(0, exactInsertPoint) + insertion + content.slice(exactInsertPoint);
    }
  }
});

fs.writeFileSync(i18nPath, content, 'utf8');
console.log('Successfully injected new translations.');
