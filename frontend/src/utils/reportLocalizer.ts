import { CropAnalysisReport } from '../types/analysis.types';
import { LanguageCode, localizeCropName, localizeDiseaseName, localizeWeatherCondition } from './translations';

export const localizeReportData = (report: CropAnalysisReport, lang: LanguageCode): CropAnalysisReport => {
  if (!report) return report;
  const rawCrop = report.mlModelDetection?.cropIdentified || 'Crop';
  const rawDisease = report.mlModelDetection?.diseaseOrCondition || 'Condition';

  const aiAdv = report.aiAdvisory || ({} as any);
  const tm = aiAdv.treatmentAndManagement || {};
  const immActions = Array.isArray(aiAdv.immediateActions) ? aiAdv.immediateActions : [];
  const chemMethods = Array.isArray(tm.chemicalMethods) ? tm.chemicalMethods : [];
  const orgMethods = Array.isArray(tm.organicBioControl) ? tm.organicBioControl : [];
  const cultPractices = Array.isArray(tm.culturalPractices) ? tm.culturalPractices : [];
  const prevMeasures = Array.isArray(aiAdv.preventiveMeasures) ? aiAdv.preventiveMeasures : [];
  const monChecklist = Array.isArray(aiAdv.monitoringChecklist) ? aiAdv.monitoringChecklist : [];

  if (lang === 'en') {
    return {
      ...report,
      aiAdvisory: {
        ...aiAdv,
        overallRiskLevel: aiAdv.overallRiskLevel || "MODERATE",
        executiveSummary: aiAdv.executiveSummary || `Field diagnosis for ${rawCrop}: ${rawDisease} detected.`,
        whyHappening: aiAdv.whyHappening || `Pathogen proliferation favored by ambient microclimate.`,
        environmentalCorrelation: aiAdv.environmentalCorrelation || `Ambient relative humidity and temperature facilitate disease activity.`,
        immediateActions: immActions.length > 0 ? immActions : [
          {
            id: "act-1",
            title: "Targeted Foliar Spray",
            description: "Apply recommended curative formulation during calm early morning hours.",
            urgency: "IMMEDIATE",
            category: "Chemical",
            dosageOrMethod: "2ml/L of clean water",
          }
        ],
        treatmentAndManagement: {
          chemicalMethods: chemMethods.length > 0 ? chemMethods : ["Apply recommended registered chemical fungicide/insecticide @ 2ml/L."],
          organicBioControl: orgMethods.length > 0 ? orgMethods : ["Apply 5% neem seed kernel extract (NSKE) or bio-pesticide."],
          culturalPractices: cultPractices.length > 0 ? cultPractices : ["Ensure clean weed-free rows and adequate drainage."],
        },
        preventiveMeasures: prevMeasures.length > 0 ? prevMeasures : ["Use certified disease-resistant seeds."],
        monitoringChecklist: monChecklist.length > 0 ? monChecklist : ["Re-inspect leaves in 72 hours for spore stoppage."],
        farmerAdvisoryNote: aiAdv.farmerAdvisoryNote || "Wear protective gear when spraying.",
      }
    };
  }
  const crop = localizeCropName(rawCrop, lang);
  const disease = localizeDiseaseName(rawDisease, lang);
  const certainty = ((report.mlModelDetection?.confidenceScore || 0.9) * 100).toFixed(1);
  const humidity = report.environmentalSnapshot?.humidity || 65;
  const temp = report.environmentalSnapshot?.temperature || 28;
  const cond = localizeWeatherCondition(report.environmentalSnapshot?.condition || 'Clear', lang);
  const scientific = report.mlModelDetection?.scientificName || 'Pathogen';

  const localizedSummaries: Record<LanguageCode, {
    summary: string;
    why: string;
    env: string;
    act1Title: string;
    act1Desc: string;
    act2Title: string;
    act2Desc: string;
    chemTitle: string;
    chem1: string;
    chem2: string;
    orgTitle: string;
    org1: string;
    cult1: string;
    cult2: string;
    prev1: string;
    prev2: string;
    chk1: string;
    chk2: string;
    note: string;
  }> = {
    haryanvi: {
      summary: `Fasal Jaanch Report: ${crop} pe ${disease} ki pehchan ${certainty}% pukhta saboot ke gail hui se. Khet mein hawa ki nami (${humidity}%) zyada hon te bimari badhan ka khatra se.`,
      why: `Mukhya rogaanu (${scientific}) 70% te zyada nami aur ${temp}°C tapman mein ghani tezi te phaile se.`,
      env: `Khet ka mausam (${cond}) fafundi ke beej phailan khatir anukool sthiti bana raha se.`,
      act1Title: "Khet mein Turant Dawa Chhidkaav",
      act1Desc: "Prabhavit pattiyan pe khet mein turant sifarish kari gayi dawa ka spray karo.",
      act2Title: "Kharab Pattiyan ki Safai",
      act2Desc: "Zyada bimari aali pattiyan tod ke khet te door mitti mein daba do ya jala do.",
      chemTitle: "Chemical Dawa",
      chem1: "Pattiyan pe spray: Sifarish kari gayi fungicide ka spray subah ke time karo.",
      chem2: "Dawa ki resistance na bane is karke 7 din baad contact fungicide badal ke spray karo.",
      orgTitle: "Jaivik / Desi Upchar",
      org1: "Neem oil (10,000 PPM @ 3ml/L) ya khatti chhaach ka subah spray karo.",
      cult1: "Pattiyan ke upar te pani na daalo jisse patti gili na rahe.",
      cult2: "Panktiyan ke beech dhoop aur hawa aawan khatir kharpatwar saaf rakho.",
      prev1: "Agli bar beejte time bimari-rodhi beej chuno.",
      prev2: "Fasal chakra (crop rotation) apnavo.",
      chk1: "Dawa chhidkan ke 72 ghante baad nayi pattiyan jaancho.",
      chk2: "Khet ke chaaron koonon aur beech mein 'W' pattern mein paudhe dekho.",
      note: "Dawa banate aur spray karte time gloves aur mask zaroor pehno. Hawa ke ulte rukh spray kade na karo."
    },
    hinglish: {
      summary: `Fasal Jaanch Report: ${crop} par ${disease} ki pehchan ${certainty}% statistical certainty ke sath hui hai. Khet mein hawa ki nami (${humidity}%) ki wajah se bimari phailne ka khatra hai.`,
      why: `Mukhya rogaanu (${scientific}) 70% se zyada nami aur ${temp}°C tapman mein tezi se badhta hai.`,
      env: `Vatavaran (${cond}) fungus ke beej phailane ke anukool hai.`,
      act1Title: "Khet mein Turant Dawa Chhidkaav",
      act1Desc: "Prabhavit pattiyo par khet me turant sifarish ki gayi dawa ka spray karein.",
      act2Title: "Kharab Pattiyo ki Safai",
      act2Desc: "Zyada sankramit pattiyo ko todkar khet se door mitti mein daba dein.",
      chemTitle: "Chemical Dawa",
      chem1: "Pattiyo par spray: Sifarish ki gayi fungicide ka spray subah karein.",
      chem2: "Dawa ki resistance na bane isliye 7 din baad contact fungicide ke sath spray karein.",
      orgTitle: "Jaivik Upchar",
      org1: "Neem oil (10,000 PPM @ 3ml/L) ya khatti chhaach ka subah spray karein.",
      cult1: "Pattiyo ke upar se paani na dalein taki pattiya gili na rahein.",
      cult2: "Panktiyo ke beech dhoop aur hawa ke liye kharpatwar saaf karein.",
      prev1: "Agali buwai ke samay bimari-rodhi beej chunein.",
      prev2: "Fasal chakra (crop rotation) apnayein.",
      chk1: "Dawa chhidkne ke 72 ghante baad nayi pattiyo ki jaanch karein.",
      chk2: "Khet ke charo kono aur beech mein 'W' pattern mein paudho ko dekhein.",
      note: "Dawa banate aur spray karte samay gloves aur mask pehnein. Hawa ke ulte disha mein spray na karein."
    },
    hi: {
      summary: `फसल निदान रिपोर्ट: ${crop} में ${disease} की पुष्टि ${certainty}% सांख्यिकीय सटीकता के साथ हुई है। खेत में उच्च आर्द्रता (${humidity}%) के कारण रोग विस्तार का जोखिम है।`,
      why: `रोगजनक ${scientific} 70% से अधिक आर्द्रता और ${temp}°C तापमान पर तेजी से फैलता है।`,
      env: `वर्तमान मौसम (${cond}) बीजाणुओं के प्रसार हेतु अनुकूल है।`,
      act1Title: "खेत में तत्काल रासायनिक उपचार",
      act1Desc: "प्रभावित पौधों पर अनुशंसित कवकनाशी का तत्काल छिड़काव करें।",
      act2Title: "संक्रमित पत्तियों की छंटाई",
      act2Desc: "अत्यधिक रोगग्रस्त पत्तियों को काटकर खेत से दूर गड्ढे में दबाएं।",
      chemTitle: "रासायनिक उपचार",
      chem1: "पर्णीय छिड़काव: अनुशंसित कवकनाशी का सुबह के समय छिड़काव करें।",
      chem2: "रोग प्रतिरोधकता रोकने हेतु 7 दिनों बाद वैकल्पिक कवकनाशी का प्रयोग करें।",
      orgTitle: "जैविक समाधान",
      org1: "नीम तेल (10,000 PPM @ 3ml/L) या खट्टी छाछ का सुबह छिड़काव करें।",
      cult1: "फव्वारा सिंचाई से बचें ताकि पत्तियां लंबे समय तक गीली न रहें।",
      cult2: "धूप एवं वायु संचार सुनिश्चित करने हेतु निराई-गुड़ाई करें।",
      prev1: "आगामी बुवाई में रोग प्रतिरोधी प्रमाणित बीजों का चयन करें।",
      prev2: "गैर-पोषक फसलों के साथ फसल चक्र अपनाएं।",
      chk1: "छिड़काव के 72 घंटे पश्चात नई पत्तियों पर लक्षणों की पुनः जांच करें।",
      chk2: "खेत में 'W' पैटर्न में घूमकर पौधों का निरीक्षण करें।",
      note: "रसायन तैयार करते समय दस्ताने एवं मास्क का प्रयोग करें। हवा के विपरीत छिड़काव न करें।"
    },
    pa: {
      summary: `ਫ਼ਸਲ ਜਾਂਚ ਰਿਪੋਰਟ: ${crop} ਉੱਤੇ ${disease} ਦੀ ਪੁਸ਼ਟੀ ${certainty}% ਸ਼ੁੱਧਤਾ ਨਾਲ ਹੋਈ ਹੈ। ਹਵਾ ਵਿੱਚ ਨਮੀ (${humidity}%) ਕਾਰਨ ਬਿਮਾਰੀ ਵਧਣ ਦਾ ਖ਼ਤਰਾ ਹੈ।`,
      why: `ਰੋਗਾਣੂ ${scientific} ਵੱਧ ਨਮੀ ਅਤੇ ${temp}°C ਤਾਪਮਾਨ ਵਿੱਚ ਤੇਜ਼ੀ ਨਾਲ ਫੈਲਦਾ ਹੈ।`,
      env: `ਮੌਜੂਦਾ ਮੌਸਮ ਫ਼ਸਲ ਉੱਤੇ ਬਿਮਾਰੀ ਦੇ ਵਾਧੇ ਲਈ ਅਨੁਕੂਲ ਹੈ।`,
      act1Title: "ਤੁਰੰਤ ਕੀਟਨਾਸ਼ਕ ਸਪਰੇਅ",
      act1Desc: "ਪ੍ਰਭਾਵਿਤ ਫ਼ਸਲ ਉੱਤੇ ਤੁਰੰਤ ਸਿਫ਼ਾਰਸ਼ ਕੀਤੀ ਦਵਾਈ ਦਾ ਛਿੜਕਾਅ ਕਰੋ।",
      act2Title: "ਖ਼ਰਾਬ ਪੱਤਿਆਂ ਦੀ ਸਫ਼ਾਈ",
      act2Desc: "ਬਿਮਾਰੀ ਵਾਲੇ ਪੱਤਿਆਂ ਨੂੰ ਤੋੜ ਕੇ ਖੇਤ ਤੋਂ ਦੂਰ ਦੱਬ ਦਿਓ।",
      chemTitle: "ਰਸਾਇਣਕ ਉਪਚਾਰ",
      chem1: "ਸਵੇਰੇ ਠੰਢੇ ਸਮੇਂ ਪੱਤਿਆਂ ਉੱਤੇ ਸਪਰੇਅ ਕਰੋ।",
      chem2: "ਦਵਾਈ ਦੀ ਰੋਕਥਾਮ ਸ਼ਕਤੀ ਵਧਾਉਣ ਲਈ ਬਦਲਵੀਂ ਸਪਰੇਅ ਕਰੋ।",
      orgTitle: "ਜੈਵਿਕ ਉਪਚਾਰ",
      org1: "ਨੀਮ ਦਾ ਤੇਲ ਜਾਂ ਖੱਟੀ ਲੱਸੀ ਦਾ ਸਵੇਰੇ ਸਪਰੇਅ ਕਰੋ।",
      cult1: "ਪੱਤਿਆਂ ਉੱਤੇ ਜ਼ਿਆਦਾ ਪਾਣੀ ਨਾ ਖੜ੍ਹਨ ਦਿਓ।",
      cult2: "ਖੇਤ ਵਿੱਚ ਧੁੱਪ ਅਤੇ ਹਵਾ ਲਈ ਨਦੀਨ ਸਾਫ਼ ਰੱਖੋ।",
      prev1: "ਬਿਮਾਰੀ ਰਹਿਤ ਬੀਜਾਂ ਦੀ ਵਰਤੋਂ ਕਰੋ।",
      prev2: "ਫ਼ਸਲੀ ਚੱਕਰ ਅਪਣਾਓ।",
      chk1: "ਸਪਰੇਅ ਤੋਂ 72 ਘੰਟੇ ਬਾਅਦ ਨਵੇਂ ਪੱਤਿਆਂ ਦੀ ਜਾਂਚ ਕਰੋ।",
      chk2: "ਖੇਤ ਦੇ ਸਾਰੇ ਹਿੱਸਿਆਂ ਵਿੱਚ ਨਿਗਰਾਨੀ ਰੱਖੋ।",
      note: "ਸਪਰੇਅ ਕਰਦੇ ਸਮੇਂ ਮਾਸਕ ਅਤੇ ਦਸਤਾਨੇ ਜ਼ਰੂਰ ਪਾਓ।"
    },
    mr: {
      summary: `पीक निदान अहवाल: ${crop} पिकावर ${disease} रोगाची पुष्टी ${certainty}% अचूकतेसह झाली आहे. हवेतील आर्द्रता (${humidity}%) जास्त असल्याने रोग प्रसाराचा धोका वाढला आहे.`,
      why: `रोगकारक ${scientific} ७०% पेक्षा जास्त आर्द्रता आणि ${temp}°C तापमानात वेगाने वाढतो.`,
      env: `सध्याचे हवामान बुरशीच्या प्रसारासाठी पोषक आहे.`,
      act1Title: "तातडीने रासायनिक फवारणी",
      act1Desc: "रोगट भागावर त्वरित शिफारस केलेले बुरशीनाशक फवारा.",
      act2Title: "बाधित पानांची छाटणी",
      act2Desc: "रोगट पाने गोळा करून शेताबाहेर खड्ड्यात पुरा.",
      chemTitle: "रासायनिक उपाय",
      chem1: "सकाळच्या वेळी पानांवर शिफारशीत औषध फवारा.",
      chem2: "रोग प्रतिकारक्षमता टिकवण्यासाठी आलटून-पालटून औषध वापरा.",
      orgTitle: "सेंद्रिय उपाय",
      org1: "सकाळी कडुलिंब अर्क किंवा आंबट ताकाची फवारणी करा.",
      cult1: "पाने जास्त वेळ ओले राहणार नाहीत याची काळजी घ्या.",
      cult2: "शेतातील तण काढून हवा व सूर्यप्रकाश खेळता ठेवा.",
      prev1: "पुढील पेरणीसाठी रोगप्रतिकारक वाणांची निवड करा.",
      prev2: "पीक फेरपालट पद्धतीचा अवलंब करा.",
      chk1: "फवारणीनंतर ७२ तासांनी नवीन पानांची पाहणी करा.",
      chk2: "शेतात फिरून झाडांचे नियमित निरीक्षण करा.",
      note: "औषध फवारताना हातमोजे व मास्क वापरा. वाऱ्याच्या विरुद्ध फवारणी करू नका."
    },
    te: {
      summary: `పంట రోగ నిర్ధారణ నివేదిక: ${crop} పంటలో ${disease} తెగులు ${certainty}% ఖచ్చితత్వంతో నిర్ధారించబడింది. వాతావరణంలో తేమ (${humidity}%) ఎక్కువగా ఉండటం వల్ల తెగులు వ్యాప్తి చెందే ప్రమాదం ఉంది.`,
      why: `తెగులు కారకం ${scientific} అధిక తేమ మరియు ${temp}°C ఉష్ణోగ్రతలో వేగంగా వ్యాపిస్తుంది.`,
      env: `ప్రస్తుత వాతావరణం తెగుళ్ల వ్యాప్తికి అనుకూలంగా ఉంది.`,
      act1Title: "వెంటనే రసాయన మందుల పిచికారీ",
      act1Desc: "బాధిత పంటపై వెంటనే సూచించిన మందును పిచికారీ చేయండి.",
      act2Title: "తెగులు సోకిన ఆకుల తొలగింపు",
      act2Desc: "బాగా తెగులు సోకిన ఆకులను తుంచి పొలానికి దూరంగా పూడ్చండి.",
      chemTitle: "రసాయన పద్ధతులు",
      chem1: "ఉదయం వేళ ఆకులపై సరియైన మోతాదులో పిచికారీ చేయండి.",
      chem2: "తెగుళ్ల నిరోధకతను అధిగమించడానికి మందులను మార్చి పిచికారీ చేయండి.",
      orgTitle: "సేంద్రీయ పరిష్కారం",
      org1: "వేప నూనె లేదా పులిసిన మజ్జిగను ఉదయం వేళ పిచికారీ చేయండి.",
      cult1: "ఆకులు తడిగా ఉండకుండా చూసుకోండి.",
      cult2: "గాలి, వెలుతురు కోసం పొలంలో కలుపు తీసివేయండి.",
      prev1: "తదుపరి పంటకు తెగుళ్లను తట్టుకునే రకాలను ఎంచుకోండి.",
      prev2: "పంట మార్పిడి పద్ధతిని పాటించండి.",
      chk1: "పిచికారీ చేసిన 72 గంటల తర్వాత కొత్త ఆకులను పరిశీలించండి.",
      chk2: "పొలంలో మొక్కలను నిరంతరం గమనించండి.",
      note: "రసాయనాలు పిచికారీ చేసేటప్పుడు చేతి తొడుగులు మరియు మాస్క్ ధరించండి."
    },
    ta: {
      summary: `பயிர் பரிசோதனை அறிக்கை: ${crop} பயிரில் ${disease} பாதிப்பு ${certainty}% துல்லியத்துடன் கண்டறியப்பட்டுள்ளது. காற்றில் உள்ள ஈரப்பதம் (${humidity}%) நோய் பரவ வழிவகுக்கிறது.`,
      why: `காரணி ${scientific} அதிக ஈரப்பதம் மற்றும் ${temp}°C வெப்பநிலையில் வேகமாக பரவுகிறது.`,
      env: `தற்போதைய வானிலை பூஞ்சை வளர்ச்சிக்கு சாதகமாக உள்ளது.`,
      act1Title: "உடனடி மருந்து தெளிப்பு",
      act1Desc: "பரிந்துரைக்கப்பட்ட பூஞ்சைக் கொல்லியை உடனடியாக தெளிக்கவும்.",
      act2Title: "பாதிக்கப்பட்ட இலைகளை அகற்றுதல்",
      act2Desc: "அதிகம் பாதிக்கப்பட்ட இலைகளை பறித்து குப்பையில் புதைக்கவும்.",
      chemTitle: "இரசாயன சிகிச்சை",
      chem1: "காலை வேளையில் இலைகள் மீது மருந்து தெளிக்கவும்.",
      chem2: "தொடர்ந்து ஒரே மருந்தை பயன்படுத்தாமல் மாற்றி தெளிக்கவும்.",
      orgTitle: "இயற்கை தீர்வு",
      org1: "வேப்ப எண்ணெய் அல்லது புளித்த மோர் கரைசலை தெளிக்கவும்.",
      cult1: "இலைகளில் நீர் தேங்காமல் பார்த்துக் கொள்ளவும்.",
      cult2: "களைகளை அகற்றி சூரிய ஒளி கிடைக்க வழிசெய்யவும்.",
      prev1: "அடுத்த பருவத்தில் நோய் எதிர்ப்பு திறன் கொண்ட விதைகளை பயன்படுத்தவும்.",
      prev2: "பயிர் சுழற்சி முறையை பின்பற்றவும்.",
      chk1: "தெளித்த 72 மணி நேரத்திற்குப் பின் இலைகளை மீண்டும் கண்காணிக்கவும்.",
      chk2: "தோட்டம் முழுவதும் வழக்கமான ஆய்வு மேற்கொள்ளவும்.",
      note: "மருந்து தெளிக்கும் போது முகக்கவசம் மற்றும் கையுறைகளை அணியவும்."
    },
    kn: {
      summary: `ಬೆಳೆ ತಪಾಸಣಾ ವರದಿ: ${crop} ಬೆಳೆಯಲ್ಲಿ ${disease} ರೋಗವು ${certainty}% ನಿಖರತೆಯೊಂದಿಗೆ ದೃಢಪಟ್ಟಿದೆ. ಆರ್ದ್ರತೆ (${humidity}%) ಹೆಚ್ಚಿರುವುದರಿಂದ ರೋಗ ಹರಡುವ ಅಪಾಯವಿದೆ.`,
      why: `ರೋಗಾಣು ${scientific} ಹೆಚ್ಚಿನ ಆರ್ದ್ರತೆ ಮತ್ತು ${temp}°C ತಾಪಮಾನದಲ್ಲಿ ವೇಗವಾಗಿ ಹರಡುತ್ತದೆ.`,
      env: `ಪ್ರಸ್ತುತ ಹವಾಮಾನವು ರೋಗ ಹರಡಲು ಪೂರಕವಾಗಿದೆ.`,
      act1Title: "ತಕ್ಷಣದ ರಾಸಾಯನಿಕ ಸಿಂಪಡಣೆ",
      act1Desc: "ಶಿಫಾರಸು ಮಾಡಲಾದ ಶಿಲೀಂಧ್ರನಾಶಕವನ್ನು ತಕ್ಷಣ ಸಿಂಪಡಿಸಿ.",
      act2Title: "ರೋಗಪೀಡಿತ ಎಲೆಗಳ ತೆಗೆಯುವಿಕೆ",
      act2Desc: "ಹೆಚ್ಚು ರೋಗವಿರುವ ಎಲೆಗಳನ್ನು ಕತ್ತರಿಸಿ ಹೊಲದಿಂದ ದೂರ ಹಾಕಿ.",
      chemTitle: "ರಾಸಾಯನಿಕ ಕ್ರಮಗಳು",
      chem1: "ಬೆಳಗಿನ ಸಮಯದಲ್ಲಿ ಎಲೆಗಳ ಮೇಲೆ ಸಿಂಪಡಣೆ ಮಾಡಿ.",
      chem2: "ರೋಗ ನಿರೋಧಕತೆ ತಡೆಗಟ್ಟಲು ಪರ್ಯಾಯ ಔಷಧ ಬಳಸಿ.",
      orgTitle: "ಸಾವಯವ ಪರಿಹಾರ",
      org1: "ಬೇವಿನ ಎಣ್ಣೆ ಅಥವಾ ಹುಳಿ ಮಜ್ಜಿಗೆಯನ್ನು ಸಿಂಪಡಿಸಿ.",
      cult1: "ಎಲೆಗಳು ಒದ್ದೆಯಾಗಿರದಂತೆ ಎಚ್ಚರ ವಹಿಸಿ.",
      cult2: "ಬಿಸಿಲು ಮತ್ತು ಗಾಳಿಗಾಗಿ ಹೊಲವನ್ನು ಕಳೆಮುಕ್ತವಾಗಿಡಿ.",
      prev1: "ಮುಂದಿನ ಋತುವಿನಲ್ಲಿ ರೋಗ ನಿರೋಧಕ ತಳಿಗಳನ್ನು ಬಳಸಿ.",
      prev2: "ಬೆಳೆ ಪರಿವರ್ತನೆ ಪದ್ಧತಿಯನ್ನು ಅನುಸರಿಸಿ.",
      chk1: "ಸಿಂಪಡಿಸಿದ 72 ಗಂಟೆಗಳ ನಂತರ ಹೊಸ ಎಲೆಗಳನ್ನು ಪರೀಕ್ಷಿಸಿ.",
      chk2: "ಹೊಲದ ಎಲ್ಲಾ ಭಾಗಗಳಲ್ಲಿ ಸಸಿಗಳನ್ನು ವೀಕ್ಷಿಸಿ.",
      note: "ಔಷಧ ಸಿಂಪಡಿಸುವಾಗ ಮಾಸ್ಕ್ ಮತ್ತು ಕೈಗವಸುಗಳನ್ನು ಧರಿಸಿ."
    },
    gu: {
      summary: `પાક નિદાન અહેવાલ: ${crop} પાકમાં ${disease} રોગ ${certainty}% ચોકસાઈ સાથે ઓળખાયો છે. હવામાં ભેજ (${humidity}%) વધુ હોવાથી રોગ ફેલાવાનું જોખમ છે.`,
      why: `રોગકારક ${scientific} વધુ ભેજ અને ${temp}°C તાપમાનમાં ઝડપથી ફેલાય છે.`,
      env: `હાલનું હવામાન ફૂગના ફેલાવા માટે અનુકૂળ છે.`,
      act1Title: "તાત્કાલિક દવાનો છંટકાવ",
      act1Desc: "સૂચવેલ ફૂગનાશકનો પાક પર તાત્કાલિક છંટકાવ કરો.",
      act2Title: "રોગગ્રસ્ત પાંદડાં દૂર કરવા",
      act2Desc: "ખૂબ રોગગ્રસ્ત પાંદડાં તોડીને ખેતરની બહાર ખાડામાં દાટો.",
      chemTitle: "રાસાયણિક ઉપાયો",
      chem1: "સવારના સમયે પાંદડાં પર દવાનો છંટકાવ કરો.",
      chem2: "રોગ પ્રતિકારક શક્તિ જાળવવા બદલીને દવા વાપરો.",
      orgTitle: "જૈવિક ઉપાયો",
      org1: "લીમડાનું તેલ અથવા ખાટી છાશનો સવારે છંટકાવ કરો.",
      cult1: "પાંદડાં લાંબા સમય સુધી ભીના ન રહે તેનું ધ્યાન રાખો.",
      cult2: "સૂર્યપ્રકાશ અને હવા માટે ખેતરને નિંદણમુક્ત રાખો.",
      prev1: "આગામી વાવેતરમાં રોગપ્રતિકારક બિયારણ વાપરો.",
      prev2: "પાકની ફેરબદલી પદ્ધતિ અપનાવો.",
      chk1: "છંટકાવના 72 કલાક પછી નવા પાંદડાં તપાસો.",
      chk2: "ખેતરમાં ફરીને છોડનું નિયમિત નિરીક્ષણ કરો.",
      note: "દવા છાંટતી વખતે માસ્ક અને મોજાં પહેરો. પવનની વિરુદ્ધ દિશામાં છંટકાવ ન કરો."
    },
    bn: {
      summary: `ফসল রোগ নির্ণয় রিপোর্ট: ${crop} ফসলে ${disease} রোগ ${certainty}% নির্ভুলতার সাথে শনাক্ত হয়েছে। বাতাসে আর্দ্রতা (${humidity}%) বেশি থাকায় রোগ বৃদ্ধির ঝুঁকি রয়েছে।`,
      why: `রোগজীবাণু ${scientific} অতিরিক্ত আর্দ্রতা ও ${temp}°C তাপমাত্রায় দ্রুত বৃদ্ধি পায়।`,
      env: `বর্তমান আবহাওয়া ছত্রাকের বিস্তারের জন্য অনুকূল।`,
      act1Title: "জরুরি রাসায়নিক স্প্রে",
      act1Desc: "প্রস্তাবিত ছত্রাকনাশক অবিলম্বে স্প্রে করুন।",
      act2Title: "আক্রান্ত পাতা পরিষ্কার করা",
      act2Desc: "অতিরিক্ত আক্রান্ত পাতা কেটে জমির বাইরে মাটিতে পুঁতে ফেলুন।",
      chemTitle: "রাসায়নিক প্রতিকার",
      chem1: "সকালের দিকে পাতার ওপর নির্ধারিত মাত্রায় স্প্রে করুন।",
      chem2: "একই ওষুধ বারবার ব্যবহার না করে পরিবর্তন করে স্প্রে করুন।",
      orgTitle: "জৈব সমাধান",
      org1: "নিম তেল বা টক ঘোল সকালে স্প্রে করুন।",
      cult1: "গাছের পাতা যাতে দীর্ঘক্ষণ ভিজে না থাকে খেয়াল রাখুন।",
      cult2: "জমিতে পর্যাপ্ত আলো-বাতাসের জন্য আগাছা পরিষ্কার রাখুন।",
      prev1: "পরবর্তী চাষে রোগ প্রতিরোধী বীজ নির্বাচন করুন।",
      prev2: "ফসল চক্র (Crop Rotation) মেনে চলুন।",
      chk1: "ওষুধ প্রয়োগের ৭২ ঘণ্টা পর নতুন পাতা পরীক্ষা করুন।",
      chk2: "নিয়মিত পুরো জমি পর্যবেক্ষণ করুন।",
      note: "কীটনাশক ব্যবহারের সময় মাস্ক ও গ্লাভস ব্যবহার করুন।"
    },
    en: {
      summary: aiAdv.executiveSummary || `Field diagnosis for ${crop}: ${disease} identified.`,
      why: aiAdv.whyHappening || `Pathogen proliferation favored by ambient microclimate.`,
      env: aiAdv.environmentalCorrelation || `Ambient conditions facilitate disease activity.`,
      act1Title: immActions[0]?.title || "Targeted Intervention",
      act1Desc: immActions[0]?.description || "Apply recommended curative formulation.",
      act2Title: immActions[1]?.title || "Canopy Sanitation",
      act2Desc: immActions[1]?.description || "Prune heavily diseased foliage.",
      chemTitle: "Chemical Treatment",
      chem1: chemMethods[0] || "Apply recommended registered chemical fungicide/insecticide.",
      chem2: chemMethods[1] || "Alternate with contact protective spray after 7-10 days.",
      orgTitle: "Organic Solutions",
      org1: orgMethods[0] || "Apply 5% neem seed kernel extract (NSKE) or bio-control agent.",
      cult1: cultPractices[0] || "Avoid overhead watering to keep foliage dry.",
      cult2: cultPractices[1] || "Ensure clean weed-free rows and adequate drainage.",
      prev1: prevMeasures[0] || "Use certified disease-resistant seeds.",
      prev2: prevMeasures[1] || "Practice crop rotation cycles.",
      chk1: monChecklist[0] || "Re-inspect leaves in 72 hours for spore stoppage.",
      chk2: monChecklist[1] || "Scout field in W pattern.",
      note: aiAdv.farmerAdvisoryNote || "Wear protective gear when spraying."
    }
  };

  const loc = localizedSummaries[lang] || localizedSummaries.en;

  return {
    ...report,
    language: lang,
    mlModelDetection: {
      ...report.mlModelDetection,
      cropIdentified: crop,
      diseaseOrCondition: disease,
    },
    environmentalSnapshot: {
      ...report.environmentalSnapshot,
      condition: cond,
    },
    aiAdvisory: {
      ...aiAdv,
      overallRiskLevel: aiAdv.overallRiskLevel || "MODERATE",
      executiveSummary: loc.summary,
      whyHappening: loc.why,
      environmentalCorrelation: loc.env,
      immediateActions: [
        {
          id: immActions[0]?.id || "act-1",
          title: loc.act1Title,
          description: loc.act1Desc,
          urgency: immActions[0]?.urgency || "IMMEDIATE",
          category: immActions[0]?.category || ("Cultural / Physical" as const),
          dosageOrMethod: immActions[0]?.dosageOrMethod || "Foliar application",
        },
        ...(immActions[1] ? [{
          ...immActions[1],
          title: loc.act2Title,
          description: loc.act2Desc,
        }] : [{
          id: "act-2",
          title: loc.act2Title,
          description: loc.act2Desc,
          urgency: "NEXT_24_48_HOURS" as const,
          category: "Cultural / Physical" as const,
          dosageOrMethod: "Pruning shears sanitized with 1% bleach",
        }])
      ],
      treatmentAndManagement: {
        chemicalMethods: [loc.chem1, loc.chem2].filter(Boolean),
        organicBioControl: [loc.org1, orgMethods[1] || "Apply Trichoderma viride bio-fungicide"].filter(Boolean),
        culturalPractices: [loc.cult1, loc.cult2].filter(Boolean),
      },
      preventiveMeasures: [loc.prev1, loc.prev2].filter(Boolean),
      monitoringChecklist: [loc.chk1, loc.chk2].filter(Boolean),
      farmerAdvisoryNote: loc.note,
    }
  };
};
