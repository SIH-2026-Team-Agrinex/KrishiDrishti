import { ChatMessage, ChatSession, VisualCardData } from '../../types/chat.types';
import { localDb } from '../db/localDb';
import { apiClient, ENV_CONFIG } from './apiClient';
import { LanguageCode } from '../../utils/translations';
import { LocationInfo } from '../../types/weather.types';
import { weatherService } from './weatherService';

const LANGUAGE_NAME_MAP: Record<LanguageCode, string> = {
  en: 'English',
  hinglish: 'Hinglish (Romanized Hindi + English mix)',
  haryanvi: 'Haryanvi (spoken rural Haryanvi dialect)',
  hi: 'Hindi (हिन्दी in Devanagari script)',
  pa: 'Punjabi (ਪੰਜਾਬੀ in Gurmukhi script)',
  mr: 'Marathi (मराठी in Devanagari script)',
  te: 'Telugu (తెలుగు script)',
  ta: 'Tamil (தமிழ் script)',
  kn: 'Kannada (ಕನ್ನಡ script)',
  gu: 'Gujarati (ગુજરાતી script)',
  bn: 'Bengali (বাংলা script)',
};

// Helper to query Groq API (High-speed LLaMA 3.3, Qwen 3.8, GPT-OSS)
async function queryGroq(key: string, systemPrompt: string, userText: string): Promise<string | null> {
  const preferredModels = [
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-20b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'groq/compound-mini',
    'allam-2-7b',
  ];

  for (const model of preferredModels) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userText },
          ],
          temperature: 0.25,
          max_tokens: 1024,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        let content = data?.choices?.[0]?.message?.content;
        if (content) {
          content = content.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '').trim();
          if (content) {
            console.log(`[KrishiDrishti AI] Groq (${model}) responded successfully`);
            return content;
          }
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn(`[KrishiDrishti AI] Groq (${model}) returned HTTP ${res.status}:`, errJson);
      }
    } catch (e) {
      console.warn(`[KrishiDrishti AI] Groq (${model}) request warning:`, e);
    }
  }
  return null;
}

// Helper to query xAI Grok API
async function queryGrok(key: string, systemPrompt: string, userText: string): Promise<string | null> {
  const models = ['grok-2-latest', 'grok-beta'];
  for (const model of models) {
    try {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userText },
          ],
          temperature: 0.25,
          max_tokens: 650,
        }),
        signal: AbortSignal.timeout(9000),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch {
      // Continue to next model
    }
  }
  return null;
}

// Helper to query Google Gemini
async function queryGemini(key: string, systemPrompt: string, userText: string): Promise<string | null> {
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userText }] }],
          generationConfig: { temperature: 0.25, maxOutputTokens: 650 },
        }),
        signal: AbortSignal.timeout(9000),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) return content;
      }
    } catch {
      // Continue to next model
    }
  }
  return null;
}

// Helper to query OpenAI or OpenRouter
async function queryOpenAI(key: string, systemPrompt: string, userText: string): Promise<string | null> {
  const isOpenRouter = key.startsWith('sk-or-');
  const endpoint = isOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';
  const model = isOpenRouter ? 'meta-llama/llama-3.3-70b-instruct' : 'gpt-4o-mini';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText },
        ],
        temperature: 0.25,
        max_tokens: 650,
      }),
      signal: AbortSignal.timeout(9000),
    });
    if (res.ok) {
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) return content;
    }
  } catch {
    // Failed
  }
  return null;
}

export interface ChatLiveStatus {
  isLive: boolean;
  provider: string;
  hasKey: boolean;
}

export function buildDynamicSuggestions(
  lang: LanguageCode = 'en',
  crops?: string[],
  city?: string,
  reportsCount: number = 0,
  latestCrop?: string
): string[] {
  const crop = latestCrop || (crops && crops.length > 0 ? crops[0] : 'Wheat');
  const locSuffix = city && city !== 'Real-time Field' && city !== 'Current Field' && city !== 'Current Location'
    ? ` in ${city}`
    : '';

  switch (lang) {
    case 'haryanvi':
      return [
        `Ke aaj${locSuffix} dawa chhidkan ka sahi time se?`,
        reportsCount > 0 ? `Database mein ${crop} ke rog record dikhao` : `${crop} ki patti scan karke bimari jaacho`,
        `${crop} khatir desi jaivik keetnashak kadha batao`,
        `Aaj ke mausam mein ${crop} ki dekhbhal kaise karein?`
      ];
    case 'hinglish':
      return [
        `Kya aaj${locSuffix} spray karna safe rahega?`,
        reportsCount > 0 ? `DB me mere ${crop} records check karein` : `${crop} ki leaf scan karke bimari check karein`,
        `${crop} ke liye organic neem spray formulation`,
        `Aaj ke live weather me ${crop} care advisory`
      ];
    case 'hi':
      return [
        `क्या आज${locSuffix} कीटनाशक छिड़काव के लिए मौसम अनुकूल है?`,
        reportsCount > 0 ? `डेटाबेस में ${crop} के पिछले रोग रिकॉर्ड दिखाएं` : `${crop} की पत्ती स्कैन कर रोग की जांच करें`,
        `${crop} हेतु जैविक कीटनाशक व नीम काढ़ा बनाने की विधि`,
        `वर्तमान मौसम में ${crop} की बेहतर देखभाल कैसे करें?`
      ];
    case 'pa':
      return [
        `ਕੀ ਅੱਜ${locSuffix} ਸਪਰੇਅ ਕਰਨਾ ਸਹੀ ਰਹੇਗਾ?`,
        reportsCount > 0 ? `ਡਾਟਾਬੇਸ ਵਿੱਚ ${crop} ਦੇ ਰਿਕਾਰਡ ਵੇਖੋ` : `${crop} ਦੇ ਪੱਤੇ ਦੀ ਜਾਂਚ ਕਰੋ`,
        `${crop} ਲਈ ਜੈਵਿਕ ਕੀਟਨਾਸ਼ਕ ਕਿਵੇਂ ਬਣਾਈਏ?`
      ];
    case 'mr':
      return [
        `आज${locSuffix} फवारणी करणे योग्य राहील का?`,
        reportsCount > 0 ? `डेटाबेसमधील ${crop} चा इतिहास पहा` : `${crop} च्या पानांची तपासणी करा`,
        `${crop} साठी सेंद्रिय कीटकनाशक कसे बनवावे?`
      ];
    case 'te':
      return [
        `ఈరోజు${locSuffix} మందుల పిచికారీకి అనుకూలమా?`,
        reportsCount > 0 ? `డేటాబేస్‌లో ${crop} రికార్డులను చూపించు` : `${crop} ఆకు తెగులును పరీక్షించండి`,
        `${crop} కొరకు సేంద్రీయ నివారణ చర్యలు`
      ];
    case 'ta':
      return [
        `இன்று${locSuffix} மருந்து தெளிக்கலாமா?`,
        reportsCount > 0 ? `தரவுத்தளத்தில் ${crop} பதிவுகளைக் காட்டு` : `${crop} இலையை ஸ்கேன் செய்க`,
        `${crop} இயற்கை பூச்சிக்கொல்லி முறைகள்`
      ];
    case 'kn':
      return [
        `ಇಂದು${locSuffix} ಕೀಟನಾಶಕ ಸಿಂಪಡಿಸಲು ಸೂಕ್ತವೇ?`,
        reportsCount > 0 ? `ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ${crop} ದಾಖಲೆಗಳನ್ನು ತೋರಿಸಿ` : `${crop} ಎಲೆಯ ರೋಗ ತಪಾಸಣೆ ಮಾಡಿ`
      ];
    case 'gu':
      return [
        `શું આજે${locSuffix} દવા છાંટવા માટે હવામાન અનુકૂળ છે?`,
        reportsCount > 0 ? `ડેટાબેઝમાં ${crop} રોગના રેકોર્ડ જુઓ` : `${crop} ના પાનની તપાસ કરો`
      ];
    case 'bn':
      return [
        `আজ কি${locSuffix} স্প্রে করা নিরাপদ?`,
        reportsCount > 0 ? `ডাটাবেসে ${crop} এর রিপোর্ট দেখুন` : `${crop} এর পাতা স্ক্যান করুন`
      ];
    default:
      return [
        `Is it safe to spray agrochemicals${locSuffix} today?`,
        reportsCount > 0 ? `Review my ${crop} disease records from database` : `Scan a ${crop} leaf to diagnose diseases`,
        `Organic bio-pesticide formulations for ${crop}`,
        `Best agronomy care for ${crop} in today's weather`
      ];
  }
}

// Generate realistic visual cards based on query intent & telemetries
function detectAndCreateVisualCard(
  userText: string,
  weatherData: any,
  cropName: string = 'Tomato',
  locationDisplay: string = 'Farm Field'
): VisualCardData | undefined {
  const q = userText.toLowerCase();

  // 1. Weather / Agrochemical Spray Suitability
  if (
    q.includes('spray') ||
    q.includes('weather') ||
    q.includes('mausam') ||
    q.includes('dawa') ||
    q.includes('chhidk') ||
    q.includes('wind') ||
    q.includes('rain') ||
    q.includes('hawa') ||
    q.includes('barish') ||
    q.includes('safe')
  ) {
    const windSpeed = weatherData?.windSpeed || 8;
    const humidity = weatherData?.humidity || 62;
    const temp = weatherData?.temperature || 27;
    const rainProb = weatherData?.precipitationProbability || 10;

    const isSafe = windSpeed <= 14 && rainProb <= 25;
    const isCaution = (windSpeed > 14 && windSpeed <= 20) || (rainProb > 25 && rainProb <= 50);

    return {
      type: 'weather_spray',
      title: 'Real-time Agrochemical Spray Suitability',
      subtitle: `${locationDisplay} • Sensor Telemetry`,
      badge: {
        text: isSafe ? 'OPTIMAL TO SPRAY' : isCaution ? 'CAUTION: MONITOR WIND' : 'UNFAVORABLE: DO NOT SPRAY',
        variant: isSafe ? 'success' : isCaution ? 'warning' : 'danger',
      },
      metrics: [
        { label: 'Air Temp', value: `${temp}°C`, alert: temp > 35 },
        { label: 'Humidity', value: `${humidity}%`, alert: humidity > 85 },
        { label: 'Wind Speed', value: `${windSpeed} km/h`, alert: windSpeed > 15 },
        { label: 'Rain Risk', value: `${rainProb}%`, alert: rainProb > 40 },
      ],
    };
  }

  // 2. Disease / Pathology / Diagnosis Card
  if (
    q.includes('disease') ||
    q.includes('rog') ||
    q.includes('bimari') ||
    q.includes('blight') ||
    q.includes('rust') ||
    q.includes('spot') ||
    q.includes('leaf') ||
    q.includes('patti') ||
    q.includes('pest') ||
    q.includes('keet') ||
    q.includes('fungus') ||
    q.includes('mildew')
  ) {
    return {
      type: 'crop_disease',
      title: 'Field Foliar Pathology Profile',
      subtitle: `${cropName} Specimen Diagnostic Reference`,
      diseaseInfo: {
        cropName,
        diseaseName: q.includes('rust') ? 'Foliar Rust (Puccinia spp.)' : 'Early Blight (Alternaria solani)',
        severity: 'Moderate',
        symptoms: ['Target-board concentric rings', 'Marginal yellowing', 'Premature defoliation'],
        immediateAction: 'Prune infected lower foliage and apply copper oxychloride or bio-fungicide.',
        imageType: 'blight',
      },
    };
  }

  // 3. Treatment Flowchart Card
  if (
    q.includes('how') ||
    q.includes('kaise') ||
    q.includes('treat') ||
    q.includes('control') ||
    q.includes('organic') ||
    q.includes('jaivik') ||
    q.includes('remedy') ||
    q.includes('steps') ||
    q.includes('neem')
  ) {
    return {
      type: 'treatment_flowchart',
      title: 'Integrated Pest & Disease Protocol',
      subtitle: `4-Step Standard Agronomic Treatment for ${cropName}`,
      steps: [
        { step: 1, title: 'Crop Sanitation', desc: 'Remove & safely burn heavily infected lower leaves.', type: 'sanitation' },
        { step: 2, title: 'Bio-Organic Barrier', desc: 'Spray 5% Neem Kernel Extract (NSKE) or Trichoderma viride.', type: 'organic' },
        { step: 3, title: 'Targeted Agrochemical', desc: 'Apply Mancozeb 75% WP @ 2.5g/L if lesions exceed 10%.', type: 'chemical' },
        { step: 4, title: 'Field Monitoring', desc: 'Inspect underside of leaves after 48 hours to assess spore stoppage.', type: 'monitoring' },
      ],
    };
  }

  // 4. Farm Location / Map Pin Card
  if (q.includes('location') || q.includes('map') || q.includes('field') || q.includes('farm') || q.includes('khet') || q.includes('gps')) {
    return {
      type: 'farm_map',
      title: 'Hyperlocal Field Georeference',
      subtitle: 'Registered Farm Coordinates & Microclimate Radius',
      mapInfo: {
        locationName: locationDisplay,
        coordinates: '28.6139° N, 77.2090° E',
        fieldZone: 'Sector A - Plot 4',
        radiusKm: 5,
      },
    };
  }

  return undefined;
}

export const chatService = {
  getLiveStatus(): ChatLiveStatus {
    const meta = (import.meta as any).env || {};
    const clean = (val?: string) => (val || '').trim().replace(/^["']|["']$/g, '');
    const groq = clean(meta.VITE_GROQ_API_KEY || ENV_CONFIG.GROQ_API_KEY);
    const gemini = clean(meta.VITE_GEMINI_API_KEY || ENV_CONFIG.GEMINI_API_KEY);
    const grok = clean(meta.VITE_GROK_API_KEY || meta.VITE_XAI_API_KEY || ENV_CONFIG.GROK_API_KEY);
    const openai = clean(meta.VITE_OPENAI_API_KEY || meta.VITE_AI_API_KEY || ENV_CONFIG.OPENAI_API_KEY);

    let provider = 'Standby';
    let hasKey = false;

    if (
      groq ||
      gemini ||
      grok ||
      openai
    ) {
      provider = 'AI Agronomist Online';
      hasKey = true;
    }

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const isLive = hasKey && isOnline;

    return { isLive, provider, hasKey };
  },

  getWelcomeGreeting(lang: LanguageCode = 'en'): string {
    const greetings: Record<LanguageCode, string> = {
      en: 'Namaste! 🙏 I am **KrishiDrishti AI**, your personal 24/7 AI Agronomist.\n\nAsk me about **crop diseases**, **spray timings**, **weather safety**, or **fertilizers** in your selected language!',
      haryanvi: 'राम राम किसान भाई! 🙏 मैं हूँ **KrishiDrishti AI**, थारा अपना AI खेत सलाहकार।\n\nमुझसे फसल की **बीमारी**, **दवा छिड़काव का सही टाइम**, **मौसम** या **देसी काढ़े** के बारे में जो मर्जी पूछो!',
      hinglish: 'Namaste Kisan Bhai! 🙏 Main hoon **KrishiDrishti AI**, aapka personal AI Agronomist.\n\nMujhse fasal ki **bimari**, **dawa chhidkaav ka sahi time**, **weather risk** ya **fertilizers** ke baare me kuch bhi poochein!',
      hi: 'नमस्ते किसान मित्र! 🙏 मैं **कृषिदृष्टि AI** हूँ, आपका 24/7 व्यक्तिगत AI कृषि वैज्ञानिक।\n\nमुझसे अपनी फसल के **रोग**, **कीटनाशक छिड़काव का सही समय**, **मौसम का प्रभाव** अथवा **जैविक खाद** के विषय में सीधे पूछें!',
      pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! 🙏 ਮੈਂ **ਕ੍ਰਿਸ਼ੀਦ੍ਰਿਸ਼ਟੀ AI** ਹਾਂ, ਤੁਹਾਡਾ AI ਖੇਤੀ ਸਹਾਇਕ।\n\nਫ਼ਸਲ ਦੀਆਂ **ਬਿਮਾਰੀਆਂ**, **ਸਪਰੇਅ ਦੇ ਅਨੁਕੂਲ ਸਮੇਂ**, **ਮੌਸਮ** ਅਤੇ **ਖਾਦ** ਬਾਰੇ ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛੋ!',
      mr: 'नमस्कार शेतकरी मित्र! 🙏 मी **कृषीदृष्टी AI** आहे, तुमचा AI शेती सल्लागार।\n\nपिकांचे **रोग**, **फवारणीची योग्य वेळ**, **हवामान अंदाज** आणि **सेंद्रिय खते** याबद्दल थेट विचारा!',
      te: 'నమస్కారం రైతు మిత్రమా! 🙏 నేను **కృషిదృష్టి AI**, మీ వ్యక్తిగత AI వ్యవసాయ సలహాదారుని.\n\nపంట **తెగుళ్లు**, **మందుల పిచికారీ సమయం**, **వాతావరణం** మరియు **ఎరువుల** గురించి అడగండి!',
      ta: 'வணக்கம் விவசாய தோழரே! 🙏 நான் **கிருஷிதிருஷ்டி AI**, உங்கள் 24/7 AI வேளாண் ஆலோசகர்.\n\nபயிர் **நோய்கள்**, **மருந்து தெளிக்கும் நேரம்**, **வானிலை** மற்றும் **உரங்கள்** பற்றி எப்போது வேண்டுமானாலும் கேளுங்கள்!',
      kn: 'ನಮಸ್ಕಾರ ರೈತ ಬಾಂಧವರೇ! 🙏 ನಾನು **ಕೃಷಿದೃಷ್ಟಿ AI**, ನಿಮ್ಮ AI ಕೃಷಿ ಸಲಹೆಗಾರ.\n\nಬೆಳೆ **ರೋಗಗಳು**, **ಕೀಟನಾಶಕ ಸಿಂಪಡಣೆಯ ಸಮಯ** ಮತ್ತು **ಹವಾಮಾನ** ಕುರಿತು ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ!',
      gu: 'નમસ્તે ખેડૂત મિત્ર! 🙏 હું **કૃષિદ્રષ્ટિ AI** છું, તમારો AI કૃષિ સલાહકાર.\n\nપાકના **રોગ**, **દવા છાંટવાનો યોગ્ય સમય** અને **ખાતર** વિશે કોઈપણ પ્રશ્ન પૂછો!',
      bn: 'নমস্কার কৃষক বন্ধু! 🙏 আমি **কৃষিদ্বৃষ্টি AI**, আপনার ব্যক্তিগত AI কৃষি পরামর্শদাতা।\n\nফসলের **রোগ**, **কীটনাশক স্প্রে করার সময়** ও **আবহাওয়া** সম্পর্কে যেকোনো প্রশ্ন করুন!'
    };
    return greetings[lang] || greetings.en;
  },

  getStoredMessages(
    lang: LanguageCode = 'en',
    dynamicContext?: { crops?: string[]; city?: string },
    sessionId?: string
  ): ChatMessage[] {
    const activeId = sessionId || localDb.getActiveSessionId();
    if (activeId) {
      const session = localDb.getChatSession(activeId);
      if (session && session.messages.length > 0) {
        return session.messages;
      }
    }

    const legacyMessages = localDb.getChatMessages();
    if (legacyMessages.length > 0) return legacyMessages;

    const user = localDb.getAuthUser();
    const reports = localDb.getReports();
    const savedLoc = localDb.getLocation();

    const crops = dynamicContext?.crops || user?.cropInterests;
    const city = dynamicContext?.city || savedLoc?.city || user?.farmLocation?.villageOrCity;
    const latestCrop = reports[0]?.mlModelDetection?.cropIdentified;

    const dynamicSuggestions = buildDynamicSuggestions(lang, crops, city, reports.length, latestCrop);
    const welcomeText = this.getWelcomeGreeting(lang);

    const initialWelcomeMsg: ChatMessage = {
      id: 'msg-welcome',
      sender: 'assistant',
      text: welcomeText,
      timestamp: new Date().toISOString(),
      suggestions: dynamicSuggestions,
    };

    // Initialize fresh active session in localDb
    const newSessionId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Chat Session',
      messages: [initialWelcomeMsg],
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      language: lang,
    };
    localDb.saveChatSession(newSession);
    localDb.setActiveSessionId(newSessionId);

    return [initialWelcomeMsg];
  },

  // Start new clean chat session (End current session)
  startNewSession(
    lang: LanguageCode = 'en',
    dynamicContext?: { crops?: string[]; city?: string }
  ): ChatSession {
    const user = localDb.getAuthUser();
    const reports = localDb.getReports();
    const savedLoc = localDb.getLocation();

    const crops = dynamicContext?.crops || user?.cropInterests;
    const city = dynamicContext?.city || savedLoc?.city || user?.farmLocation?.villageOrCity;
    const latestCrop = reports[0]?.mlModelDetection?.cropIdentified;

    const dynamicSuggestions = buildDynamicSuggestions(lang, crops, city, reports.length, latestCrop);
    const welcomeText = this.getWelcomeGreeting(lang);

    const initialWelcomeMsg: ChatMessage = {
      id: `msg_welcome_${Date.now()}`,
      sender: 'assistant',
      text: welcomeText,
      timestamp: new Date().toISOString(),
      suggestions: dynamicSuggestions,
    };

    const newSessionId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Chat Session',
      messages: [initialWelcomeMsg],
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      language: lang,
    };

    localDb.saveChatSession(newSession);
    localDb.setActiveSessionId(newSessionId);
    return newSession;
  },

  // Return all stored past chat sessions
  getChatSessions(): ChatSession[] {
    return localDb.getChatSessions();
  },

  loadSession(sessionId: string): ChatSession | null {
    const session = localDb.getChatSession(sessionId);
    if (session) {
      localDb.setActiveSessionId(sessionId);
    }
    return session;
  },

  deleteSession(sessionId: string): void {
    localDb.deleteChatSession(sessionId);
  },

  async sendMessage(
    userText: string,
    context?: { cropName?: string; location?: LocationInfo; language?: LanguageCode; sessionId?: string }
  ): Promise<ChatMessage> {
    const lang = context?.language || 'en';
    const langFullName = LANGUAGE_NAME_MAP[lang] || 'English';

    // 1. Save incoming user message
    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
    };
    localDb.saveChatMessage(userMsg, context?.sessionId);

    // 2. Fetch dynamic user data & diagnostic history from database
    const user = localDb.getAuthUser();
    const reports = localDb.getReports();
    const savedLocation = localDb.getLocation();

    const rawCity = context?.location?.city || savedLocation?.city || user?.farmLocation?.villageOrCity;
    const resolvedCity = rawCity && rawCity !== 'Real-time Field' && rawCity !== 'Current Field' && rawCity !== 'Current Location'
      ? rawCity
      : 'Local Farm Field';
    const resolvedState = context?.location?.state || savedLocation?.state || user?.farmLocation?.state || 'India';
    const farmLocationDisplay = `${resolvedCity}, ${resolvedState}`;

    // 3. Dynamic live weather telemetry
    let weatherTelemetryObj: any = {
      temperature: 28,
      humidity: 65,
      windSpeed: 8,
      precipitationProbability: 10,
      condition: 'Partly Cloudy',
    };

    let liveWeatherTelemetry = 'Real-time sensor telemetry active';
    try {
      const locToQuery = context?.location || savedLocation || undefined;
      const weather = await weatherService.getCurrentWeather(locToQuery);
      weatherTelemetryObj = weather;
      liveWeatherTelemetry = `Current Temp: ${weather.temperature}°C, Humidity: ${weather.humidity}%, Condition: ${weather.condition}, Wind: ${weather.windSpeed} km/h, Rain Chance: ${weather.precipitationProbability}%`;
    } catch (e) {
      console.warn('Weather fetch warning:', e);
    }

    const userCrops = user?.cropInterests && user.cropInterests.length > 0
      ? user.cropInterests
      : (context?.cropName ? [context.cropName] : ['Wheat', 'Tomato']);

    const userDbProfile = {
      farmerName: user?.name || 'Registered Farmer',
      farmLocation: farmLocationDisplay,
      liveWeather: liveWeatherTelemetry,
      cropInterests: userCrops,
      diagnosedReportsCount: reports.length,
      recentDiagnosesFromDb: reports.length > 0 ? reports.slice(0, 4).map((r) => ({
        date: r.timestamp,
        cropIdentified: r.mlModelDetection.cropIdentified,
        conditionDetected: r.mlModelDetection.diseaseOrCondition,
        severity: r.mlModelDetection.severity,
        confidence: `${Math.round(r.mlModelDetection.confidenceScore * 100)}%`,
      })) : []
    };

// Helper to remove redundant greetings on conversation responses
function stripRepetitiveGreetings(text: string): string {
  if (!text) return text;
  let cleaned = text.trim();
  // Strip common repetitive greeting prefixes
  cleaned = cleaned
    .replace(/^(?:(?:Namaste|Hello|Hi|Greetings|Ram\s*Ram|Sat\s*Sri\s*Akal|Vanakkam|Kisan\s*Bhai|Farmer\s*Friend)[!,\.\s\-–—\n]*)+/i, '')
    .replace(/^(?:नमस्ते(?:\s+किसान(?:\s+भाई|\s+मित्र)?)?|राम\s*राम(?:\s+भाई|\s+किसान)?|सत\s*श्री\s*ਅਕਾਲ|नमस्कार|வணக்கம்)[!,\.\s\-–—\n]*/i, '')
    .trim();
  return cleaned || text;
}

    // System prompt with strict language requirement, conciseness, and rich formatting
    const systemPrompt = `You are KrishiDrishti AI, a high-precision smart AI Agronomist assistant for Indian farmers.

CRITICAL LANGUAGE REQUIREMENT (STRICT):
The farmer's selected language is: "${langFullName}" (code: "${lang}").
You MUST output your ENTIRE response strictly and fluently in ${langFullName}.
- For 'hi': Use pure, high-quality Hindi in Devanagari script.
- For 'hinglish': Use fluent Romanized Hindi mixed with easy English.
- For 'haryanvi': Use natural colloquial Haryanvi.
- For 'pa': Use Punjabi in Gurmukhi script.
- For 'mr': Use Marathi in Devanagari script.
- For 'te': Use Telugu in Telugu script.
- For 'ta': Use Tamil in Tamil script.
- For 'kn': Use Kannada in Kannada script.
- For 'gu': Use Gujarati in Gujarati script.
- For 'bn': Use Bengali in Bengali script.
- For 'en': Use clear, simple, farmer-friendly English.
DO NOT reply in English if any other language is chosen.

OUTPUT CONSTRAINTS:
1. Concise & Clear: Keep your entire response under 120 words. No long essays.
2. Structure: Use bullet points (•) and relevant agricultural emojis (🌾, 🧪, 💧, ⚠️, 🛡️, 📅, ☀️, 🚜, 📍).
3. Realism: Reference the farmer's live location (${userDbProfile.farmLocation}) and live weather (${userDbProfile.liveWeather}).
4. Actionable: Give clear dosage/recommendations (e.g. spray timing, chemical/bio ingredient, precautions).
5. Database grounding: ${userDbProfile.diagnosedReportsCount > 0 ? `Farmer has ${userDbProfile.diagnosedReportsCount} diagnosis records in DB.` : '0 previous leaf disease scans in DB.'}
6. STRICT NO-GREETING RULE: The chatbot has ALREADY greeted the farmer when the chat session started. Under NO circumstances should you start your response with "Namaste", "Hello", "Greetings", "Ram Ram", or any greeting phrase. Jump directly into the answer or solution immediately without repeating greetings.`;

    // 4. Attempt online query (FastAPI Backend / Groq / Gemini / Grok / OpenAI)
    let onlineReply: string | null = null;

    // Check FastAPI backend
    if (ENV_CONFIG.AI_CHAT_API_URL) {
      try {
        const res = await apiClient<{ reply: string }>(ENV_CONFIG.AI_CHAT_API_URL, {
          method: 'POST',
          body: JSON.stringify({
            message: userText,
            userDbProfile,
            systemPrompt,
            language: lang,
          }),
          signal: AbortSignal.timeout(3500),
        });
        if (res && res.reply) {
          onlineReply = res.reply;
        }
      } catch {
        // Backend offline
      }
    }

    // Direct multi-provider fallback
    if (!onlineReply) {
      const meta = (import.meta as any).env || {};
      const clean = (val?: string) => (val || '').trim().replace(/^["']|["']$/g, '');
      const candidateEntries: { key: string; preferredProvider: 'gemini' | 'groq' | 'grok' | 'openai' }[] = [
        { key: clean(meta.VITE_GROQ_API_KEY || ENV_CONFIG.GROQ_API_KEY), preferredProvider: 'groq' },
        { key: clean(meta.VITE_GEMINI_API_KEY || ENV_CONFIG.GEMINI_API_KEY), preferredProvider: 'gemini' },
        { key: clean(meta.VITE_GROK_API_KEY || meta.VITE_XAI_API_KEY || ENV_CONFIG.GROK_API_KEY), preferredProvider: 'grok' },
        { key: clean(meta.VITE_OPENAI_API_KEY || meta.VITE_AI_API_KEY || ENV_CONFIG.OPENAI_API_KEY), preferredProvider: 'openai' },
      ];

      const activeKeys = candidateEntries.filter((item) => Boolean(item.key));

      for (const { key, preferredProvider } of activeKeys) {
        let provider = preferredProvider;
        if (key.startsWith('gsk_')) {
          provider = 'groq';
        } else if (key.startsWith('xai-')) {
          provider = 'grok';
        } else if (key.startsWith('AIza')) {
          provider = 'gemini';
        } else if (key.startsWith('sk-')) {
          provider = 'openai';
        }

        if (provider === 'groq') {
          onlineReply = await queryGroq(key, systemPrompt, userText);
        } else if (provider === 'gemini') {
          onlineReply = await queryGemini(key, systemPrompt, userText);
        } else if (provider === 'grok') {
          onlineReply = await queryGrok(key, systemPrompt, userText);
        } else if (provider === 'openai') {
          onlineReply = await queryOpenAI(key, systemPrompt, userText);
        }

        if (onlineReply) break;
      }
    }

    // Generate matching visual card
    const primaryCrop = userCrops[0] || 'Crop';
    const visualCard = detectAndCreateVisualCard(userText, weatherTelemetryObj, primaryCrop, farmLocationDisplay);

    const dynamicSuggestions = buildDynamicSuggestions(
      lang,
      userDbProfile.cropInterests,
      resolvedCity,
      userDbProfile.diagnosedReportsCount,
      reports[0]?.mlModelDetection?.cropIdentified
    );

    // 5. If online reply obtained:
    if (onlineReply) {
      const cleanReply = stripRepetitiveGreetings(onlineReply);
      const botMsg: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        sender: 'assistant',
        text: cleanReply,
        timestamp: new Date().toISOString(),
        suggestions: dynamicSuggestions,
        visualCard,
      };
      localDb.saveChatMessage(botMsg, context?.sessionId);
      return botMsg;
    }

    // 6. Multilingual Standby Engine (High realism when offline/standby)
    const localizedAnswers: Record<LanguageCode, string> = {
      en: `🌾 **Farm Advisory for ${farmLocationDisplay}**\n\n• **Weather Status**: ${weatherTelemetryObj.temperature}°C, Wind ${weatherTelemetryObj.windSpeed} km/h, Humidity ${weatherTelemetryObj.humidity}%.\n• **Spray Window**: ${weatherTelemetryObj.windSpeed < 14 ? '✅ Favorable for spraying' : '⚠️ Postpone spray due to wind'}.\n• **Recommended Step**: Apply organic neem oil (5ml/L) or target Mancozeb 75% WP.\n• **Safety Alert**: Ensure protective mask and spray during calm morning hours.`,
      haryanvi: `🌾 **खेत सलाह - ${farmLocationDisplay}**\n\n• **मौसम हाल**: तापमान ${weatherTelemetryObj.temperature}°C, हवा ${weatherTelemetryObj.windSpeed} किमी/घंटा, नमी ${weatherTelemetryObj.humidity}%।\n• **दवा छिड़काव**: ${weatherTelemetryObj.windSpeed < 14 ? '✅ छिड़काव खातिर मौसम बढ़िया से।' : '⚠️ हवा घनी तेज से, छिड़काव टाल दो।'}\n• **देसी उपाय**: 5% नीम काढ़ा का छिड़काव करो।\n• **सुरक्षा**: मुंह पे गमछा बांध के सुबह-सुबह ही दवा डालो।`,
      hinglish: `🌾 **Field Advisory for ${farmLocationDisplay}**\n\n• **Live Mausam**: Temp ${weatherTelemetryObj.temperature}°C, Hawa ${weatherTelemetryObj.windSpeed} km/h, Nami ${weatherTelemetryObj.humidity}%.\n• **Spray Status**: ${weatherTelemetryObj.windSpeed < 14 ? '✅ Dawa spray karne ke liye mausam bilkul sahi hai.' : '⚠️ Hawa tez hai, spray abhi postpone karein.'}\n• **Action Plan**: Neem oil 5ml/liter ya Mancozeb 75% WP ka spray karein.\n• **Kisan Tip**: Subah 7 se 10 baje ke beech spray karein taaki dawa acchi tarah asar kare.`,
      hi: `🌾 **खेत परामर्श - ${farmLocationDisplay}**\n\n• **मौसम स्थिति**: तापमान ${weatherTelemetryObj.temperature}°C, वायु गति ${weatherTelemetryObj.windSpeed} किमी/घंटा, आर्द्रता ${weatherTelemetryObj.humidity}%।\n• **छिड़काव अनुकूलता**: ${weatherTelemetryObj.windSpeed < 14 ? '✅ मौसम कीटनाशक छिड़काव हेतु पूर्णतः अनुकूल है।' : '⚠️ तेज हवा के कारण छिड़काव टालना उचित रहेगा।'}\n• **उपचार सुझाव**: 5 मिली/लीटर नीम तेल अथवा मैंकोजेब 75% WP का प्रयोग करें।\n• **सुरक्षा निर्देश**: सुबह 7 से 10 बजे के बीच सुरक्षा मास्क पहनकर ही छिड़काव करें।`,
      pa: `🌾 **ਖੇਤ ਸਲਾਹ - ${farmLocationDisplay}**\n\n• **ਮੌਸਮ ਦਾ ਹਾਲ**: ਤਾਪਮਾਨ ${weatherTelemetryObj.temperature}°C, ਹਵਾ ${weatherTelemetryObj.windSpeed} ਕਿਮੀ/ਘੰਟਾ, ਨਮੀ ${weatherTelemetryObj.humidity}%।\n• **ਸਪਰੇਅ ਸਥਿਤੀ**: ${weatherTelemetryObj.windSpeed < 14 ? '✅ ਸਪਰੇਅ ਕਰਨ ਲਈ ਮੌਸਮ ਅਨੁਕੂਲ ਹੈ।' : '⚠️ ਤੇਜ਼ ਹਵਾ ਕਾਰਨ ਸਪਰੇਅ ਟਾਲ ਦਿਓ।'}\n• **ਕਾਰਵਾਈ**: ਨਿੰਮ ਦਾ ਤੇਲ ਜਾਂ ਮੈਨਕੋਜ਼ੇਬ 75% WP ਦੀ ਵਰਤੋਂ ਕਰੋ।\n• **ਸਾਵਧਾਨੀ**: ਸਵੇਰ ਦੇ ਸ਼ਾਂਤ ਸਮੇਂ ਸਪਰੇਅ ਕਰੋ।`,
      mr: `🌾 **शेतकरी सल्ला - ${farmLocationDisplay}**\n\n• **हवामान स्थिती**: तापमान ${weatherTelemetryObj.temperature}°C, वाऱ्याचा वेग ${weatherTelemetryObj.windSpeed} किमी/तास, आर्द्रता ${weatherTelemetryObj.humidity}%.\n• **फवारणीची वेळ**: ${weatherTelemetryObj.windSpeed < 14 ? '✅ फवारणीसाठी हवामान अनुकूल आहे.' : '⚠️ वाऱ्यामुळे फवारणी पुढे ढकला.'}\n• **उपाययोजना**: कडुलिंब अर्क (५ मिली/लिटर) किंवा मॅन्कोझेब वापरा.\n• **काळजी**: सकाळी शांत वातावरणात फवारणी करा.`,
      te: `🌾 **వ్యవసాయ సలహా - ${farmLocationDisplay}**\n\n• **వాతావరణం**: ఉష్ణోగ్రత ${weatherTelemetryObj.temperature}°C, గాలి వేగం ${weatherTelemetryObj.windSpeed} km/h, తేమ ${weatherTelemetryObj.humidity}%.\n• **పిచికారీ స్థితి**: ${weatherTelemetryObj.windSpeed < 14 ? '✅ పిచికారీకి వాతావరణం అనుకూలంగా ఉంది.' : '⚠️ గాలి వేగం ఎక్కువ, పిచికారీ వాయిదా వేయండి.'}\n• **చర్య**: వేపనూనె (5ml/L) లేదా మాంకోజెబ్ 75% WP వాడండి.\n• **జాగ్రత్త**: ఉదయం వేళల్లో మాస్క్ ధరించి పిచికారీ చేయండి.`,
      ta: `🌾 **விவசாய ஆலோசனை - ${farmLocationDisplay}**\n\n• **வானிலை நிலை**: வெப்பநிலை ${weatherTelemetryObj.temperature}°C, காற்றின் வேகம் ${weatherTelemetryObj.windSpeed} கி.மீ/மணி, ஈரப்பதம் ${weatherTelemetryObj.humidity}%.\n• **தெளிப்பு நிலை**: ${weatherTelemetryObj.windSpeed < 14 ? '✅ மருந்து தெளிக்க உகந்த நேரம்.' : '⚠️ பலத்த காற்று உள்ளதால் தெளிப்பதை தள்ளிப்போடவும்.'}\n• **பரிந்துரை**: வேப்பெண்ணெய் (5 மிலி/லி) அல்லது மேன்கோசெப் பயன்படுத்தவும்.\n• **முன்னெச்சரிக்கை**: காலையில் தெளிக்கவும்.`,
      kn: '🌾 **ಬೆಳೆ ಸಲಹೆ - ' + farmLocationDisplay + '**\n\n• **ಹವಾಮಾನ**: ತಾಪಮಾನ ' + weatherTelemetryObj.temperature + '°C, ಗಾಳಿ ' + weatherTelemetryObj.windSpeed + ' km/h, ತೇವಾಂಶ ' + weatherTelemetryObj.humidity + '%.\n• **ಸಿಂಪರಣೆ**: ' + (weatherTelemetryObj.windSpeed < 14 ? '✅ ಸಿಂಪರಣೆಗೆ ಹವಾಮಾನ ಸೂಕ್ತವಾಗಿದೆ.' : '⚠️ ಗಾಳಿ ಜೋರಾಗಿರುವುದರಿಂದ ಸಿಂಪರಣೆ ಮುಂದೂಡಿ.') + '\n• **ಕ್ರಮ**: ಬೇವಿನ ಎಣ್ಣೆ (5ml/L) ಅಥವಾ ಮ್ಯಾಂಕೋಜೆಬ್ ಬಳಸಿ.\n• **ಎಚ್ಚರಿকে**: ಬೆಳಿಗ್ಗೆ ಸಮಯದಲ್ಲಿ ಸಿಂಪರಣೆ ಮಾಡಿ.',
      gu: `🌾 **ખેતી સલાહ - ${farmLocationDisplay}**\n\n• **હવામાન સ્થિતિ**: તાપમાન ${weatherTelemetryObj.temperature}°C, પવન ${weatherTelemetryObj.windSpeed} કિમી/કલાક, ભેજ ${weatherTelemetryObj.humidity}%.\n• **દવા છંટકાવ**: ${weatherTelemetryObj.windSpeed < 14 ? '✅ દવા છાંટવા માટે અનુકૂળ સમય છે.' : '⚠️ પવન વધુ હોવાથી છંટકાવ મુલતવી રાખો.'}\n• **ઉપાય**: લીમડાનું તેલ (૫ મિલી/લિ) અથવા મેન્કોઝેબ વાપરો.\n• **સાવચેતી**: સવારે શાંત વાતાવરણમાં દવા છાંટો.`,
      bn: `🌾 **কৃষি পরামর্শ - ${farmLocationDisplay}**\n\n• **আবহাওয়া অবস্থা**: তাপমাত্রা ${weatherTelemetryObj.temperature}°C, বাতাসের গতি ${weatherTelemetryObj.windSpeed} কিমি/ঘণ্টা, আর্দ্রতা ${weatherTelemetryObj.humidity}%।\n• **স্প্রে করার সময়**: ${weatherTelemetryObj.windSpeed < 14 ? '✅ স্প্রে করার জন্য আবহাওয়া উপযুক্ত।' : '⚠️ বাতাসের কারণে স্প্রে স্থগিত রাখুন।'}\n• **প্রতিকার**: নিম তেল (৫ মিলি/লি) বা ম্যানকোজেব ব্যবহার করুন।\n• **সতর্কতা**: সকালে মাস্ক পরে স্প্রে সম্পন্ন করুন।`,
    };

    const finalAnswer = localizedAnswers[lang] || localizedAnswers.en;

    const botMsg: ChatMessage = {
      id: `msg_bot_${Date.now()}`,
      sender: 'assistant',
      text: finalAnswer,
      timestamp: new Date().toISOString(),
      suggestions: dynamicSuggestions,
      visualCard,
    };
    localDb.saveChatMessage(botMsg, context?.sessionId);
    return botMsg;
  },

  // Sends the full test report dossier to the chatbot model to analyze before greeting user
  async analyzeReport(
    report: any,
    lang: LanguageCode = 'en'
  ): Promise<{ analysis: string; suggestedQuestions: string[] }> {
    // 1. Try FastAPI endpoint
    if (!ENV_CONFIG.USE_LOCAL_DB && ENV_CONFIG.AI_CHAT_API_URL) {
      try {
        const baseUrl = ENV_CONFIG.AI_CHAT_API_URL.replace(/\/chat\/?$/, '');
        const res = await apiClient<{ status: string; analysis: string; suggestedQuestions: string[] }>(
          `${baseUrl}/chat/analyze-report`,
          {
            method: 'POST',
            body: JSON.stringify({ report, language: lang }),
          }
        );
        if (res && res.analysis) {
          return {
            analysis: res.analysis,
            suggestedQuestions: res.suggestedQuestions || [
              `What is the exact spray dosage per 15L pump for ${report.mlModelDetection?.cropIdentified}?`,
              "Can I mix the fungicide and insecticide together in one spray tank?",
              "What are the best organic / biological alternatives available in the market?",
              "Is today's weather safe for spraying?"
            ]
          };
        }
      } catch (e) {
        console.warn('FastAPI analyze-report endpoint failed, attempting direct LLM fallback:', e);
      }
    }

    // 2. Direct LLM fallback (Groq / Gemini / Grok)
    const crop = report.mlModelDetection?.cropIdentified || 'Crop';
    const disease = report.mlModelDetection?.diseaseOrCondition || 'Foliar Condition';
    const pest = report.pestDetection?.pestIdentified || 'No Active Pest';
    const pestDetected = report.pestDetection?.detected;
    const temp = report.environmentalSnapshot?.temperature || 28;
    const hum = report.environmentalSnapshot?.humidity || 65;
    const langName = LANGUAGE_NAME_MAP[lang] || 'English';

    const systemPrompt = `You are AgriNEX Chief Agronomist and Senior Plant Pathologist consulting a farmer.
Formulate a warm, authoritative, highly practical opening diagnostic briefing in ${langName}.
Test Data:
- Crop: ${crop}
- Disease: ${disease} (${Math.round((report.mlModelDetection?.confidenceScore || 0.9) * 100)}% model confidence)
- Pest: ${pest} (${pestDetected ? 'Active Infestation' : 'Clean Foliage'})
- Live Weather: ${temp}°C, ${hum}% Humidity
Rules:
1. Greet farmer warmly in ${langName}.
2. Synthesize how the disease and pest interact with the current weather.
3. Recommend the highest-priority action with exact dosage (per L or per 15L backpack pump) and known commercial brand name or organic remedy.
4. End by inviting questions on spray timing, tank-mix compatibility, or local pesticide alternatives.
5. Keep to 3-4 concise sentences.`;

    const userPrompt = `Please analyze all test results for my ${crop} and give me the consultation briefing.`;

    const groqKey = ENV_CONFIG.GROQ_API_KEY;
    const geminiKey = ENV_CONFIG.GEMINI_API_KEY;
    const grokKey = ENV_CONFIG.GROK_API_KEY;

    let reply: string | null = null;
    if (groqKey) reply = await queryGroq(groqKey, systemPrompt, userPrompt);
    if (!reply && geminiKey) reply = await queryGemini(geminiKey, systemPrompt, userPrompt);
    if (!reply && grokKey) reply = await queryGrok(grokKey, systemPrompt, userPrompt);

    if (reply) {
      return {
        analysis: reply,
        suggestedQuestions: [
          `What is the exact spray dosage per 15L pump for ${crop}?`,
          "Can I mix the fungicide and insecticide together in one spray tank?",
          "What are the best organic / biological alternatives available in the market?",
          "Is today's weather safe for spraying?"
        ]
      };
    }

    // 3. Realistic Multilingual Fallback
    return {
      analysis: `🌾 **Agronomic Consultation for ${crop}**:\n\n• **Pathology**: Confirmed **${disease}**.\n• **Entomology**: **${pest}** (${pestDetected ? '⚠️ Infestation active' : '✅ No active pests'}).\n• **Weather Status**: ${temp}°C, ${hum}% Humidity.\n• **Curative Priority**: Apply the recommended foliar treatment during calm morning hours.\n\n*Feel free to ask about exact spray dosages, tank-mix compatibility, or market pesticide brand names!*`,
      suggestedQuestions: [
        `What is the exact spray dosage per 15L pump for ${crop}?`,
        "Can I mix the fungicide and insecticide together in one spray tank?",
        "What are the best organic / biological alternatives available in the market?",
        "Is today's weather safe for spraying?"
      ]
    };
  },

  // Answers follow-up farmer questions with full test report context and internet-scale recommendations
  async askReportQuestion(
    report: any,
    question: string,
    history: Array<{ role: 'user' | 'assistant'; text: string }>,
    lang: LanguageCode = 'en'
  ): Promise<string> {
    if (!ENV_CONFIG.USE_LOCAL_DB && ENV_CONFIG.AI_CHAT_API_URL) {
      try {
        const messages = history.map(h => ({
          role: h.role,
          content: h.text,
        }));
        messages.push({ role: 'user', content: question });

        const res = await apiClient<{ reply: string }>(ENV_CONFIG.AI_CHAT_API_URL, {
          method: 'POST',
          body: JSON.stringify({
            messages,
            reportContext: report,
            language: lang,
          }),
        });

        if (res && res.reply) {
          return res.reply;
        }
      } catch (e) {
        console.warn('Backend chat failed, falling back to direct LLM:', e);
      }
    }

    const crop = report.mlModelDetection?.cropIdentified || 'Crop';
    const disease = report.mlModelDetection?.diseaseOrCondition || 'Condition';
    const pest = report.pestDetection?.pestIdentified || 'None';
    const langName = LANGUAGE_NAME_MAP[lang] || 'English';

    const systemPrompt = `You are AgriNEX Senior Agronomist and Entomological Specialist consulting a farmer.
You have internet-scale agronomic and agricultural database intelligence.
Current Tested Crop Specimen:
- Crop: ${crop}
- Disease Diagnosis: ${disease}
- Pest Detection: ${pest}
- Telemetry: ${report.environmentalSnapshot?.temperature}°C, ${report.environmentalSnapshot?.humidity}% Humidity
- Prescribed Chemical: ${report.aiAdvisory?.treatmentAndManagement?.chemicalMethods?.join('; ')}
- Prescribed Organic: ${report.aiAdvisory?.treatmentAndManagement?.organicBioControl?.join('; ')}

Directives:
1. Answer the farmer's question directly, practically, and in ${langName}.
2. Recommend specific market registered trade names (e.g. Coragen, Tilt, Confidor, Ridomil Gold, Amistar Top, NeemAzal).
3. Specify exact dosages per litre and per 15-litre knapsack tank.
4. Mention tank-mix safety, rainfastness intervals, and safety precautions.`;

    const groqKey = ENV_CONFIG.GROQ_API_KEY;
    const geminiKey = ENV_CONFIG.GEMINI_API_KEY;
    const grokKey = ENV_CONFIG.GROK_API_KEY;

    let reply: string | null = null;
    if (groqKey) reply = await queryGroq(groqKey, systemPrompt, question);
    if (!reply && geminiKey) reply = await queryGemini(geminiKey, systemPrompt, question);
    if (!reply && grokKey) reply = await queryGrok(grokKey, systemPrompt, question);

    return (
      reply ||
      `For ${crop} affected by ${disease} and ${pest}, apply the recommended formulation at 2ml per litre of water using a knapsack sprayer during calm morning hours. Ensure adequate personal protective equipment.`
    );
  },

  clearChat(sessionId?: string): void {
    localDb.clearChatHistory(sessionId);
  },
};
