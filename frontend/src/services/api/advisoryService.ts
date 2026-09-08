import { CurrentWeather, WeatherAdvisory } from '../../types/weather.types';
import { apiClient, ENV_CONFIG } from './apiClient';
import { LanguageCode } from '../../utils/translations';

export const advisoryService = {
  async getWeatherAdvisory(weather: CurrentWeather, cropContext?: string, lang: LanguageCode = 'en'): Promise<WeatherAdvisory> {
    if (!ENV_CONFIG.USE_LOCAL_DB && ENV_CONFIG.AI_ADVISORY_API_URL) {
      try {
        const remoteData = await apiClient<any>(`${ENV_CONFIG.AI_ADVISORY_API_URL}/weather-advisory`, {
          method: 'POST',
          body: JSON.stringify({ weather, cropContext, language: lang }),
        });
        if (
          remoteData &&
          remoteData.sprayingRecommendation?.status &&
          remoteData.fertilizationRecommendation?.status &&
          remoteData.irrigationRecommendation?.status
        ) {
          return remoteData as WeatherAdvisory;
        }
      } catch (err) {
        console.warn('Backend advisory endpoint error, computing contextual advisory:', err);
      }
    }

    const isRainingOrWet = weather.rainfall > 0 || weather.precipitationProbability > 50;
    const isHighHumidity = weather.humidity > 70;
    const isHighWind = weather.windSpeed > 15;

    let overallRisk: WeatherAdvisory['overallRisk'] = 'LOW';
    if (isRainingOrWet && isHighHumidity) overallRisk = 'CRITICAL';
    else if (isHighHumidity || isHighWind) overallRisk = 'HIGH';
    else if (weather.humidity > 60) overallRisk = 'MODERATE';

    // Multilingual Advisory Generators
    const getLocalizedContent = (l: LanguageCode) => {
      switch (l) {
        case 'haryanvi':
          return {
            headline: isRainingOrWet
              ? 'Meenh aur nami ki chetavani: dawa chhidkan abhi rok do aur khet mein pani nikalan ka rasta kholo.'
              : isHighWind
              ? 'Ghani tez hawa chal rahi se: dawa ka spray na karo, hawa mein dawa ud ke bekar jaavegi.'
              : isHighHumidity
              ? 'Hawa mein nami ghani zyada se: pattiyan pe fafundi aur rog phailan ka poora khatra se.'
              : 'Fasal dekhbhal, inspection aur sinchai khatir mausam ekdam sahi se.',
            sprayReason: isHighWind
              ? `Hawa ki raftaar (${weather.windSpeed} km/h) safe limit (>15 km/h) te zyada se, spray bekar jaavega.`
              : isRainingOrWet
              ? `Meenh aawan ki sambhavna (${weather.precipitationProbability}%) se, dawa dhul sakti se.`
              : 'Hawa shaant se aur aakash saaf se. Subah 06:30 AM te 10:30 AM tak spray ka sabte badhiya time se.',
            sprayWindow: isRainingOrWet ? '24 ghante khatir taal do' : '07:00 AM - 11:00 AM',
            irrigationReason: isRainingOrWet
              ? 'Meenh aawan karke mitti mein paryapt nami bani hui se.'
              : weather.temperature > 32
              ? 'Tez dhoop karke halki sinchai ki zaroorat se.'
              : 'Mitti mein nami theek thaak se. Niyamit chakkar chalao.',
            fertReason: isRainingOrWet
              ? 'Bhaari meenh te pehle Urea / Khad na daalo, pani gail beh jaavegi.'
              : 'Khad aur NPK poshan daalan khatir khet ka haal sahi se.',
            summary: `Tapman ${weather.temperature}°C aur Nami ${weather.humidity}% rog ke khatre pe asar daal rahe hain.`,
          };

        case 'hinglish':
          return {
            headline: isRainingOrWet
              ? 'Nami aur barish ka alert: dawa ka chhidkaav abhi taal dein aur khet mein pani nikaasi ka rasta khula rakhein.'
              : isHighWind
              ? 'Tez hawa chal rahi hai: dawa ka spray na karein taki hawa se dawa bekar na fail jaye.'
              : isHighHumidity
              ? 'Hawa mein nami (humidity) zyada hai: pattiyo par fungus aur rog phailne ka khatra hai.'
              : 'Fasal ki dekhbhal, inspection aur sinchai ke liye mausam bilkul sahi hai.',
            sprayReason: isHighWind
              ? `Hawa ki gati (${weather.windSpeed} km/h) safe limit (>15 km/h) se zyada hai, spray bekar ho sakta hai.`
              : isRainingOrWet
              ? `Barish (${weather.precipitationProbability}%) se dawa dhulne ka khatra hai.`
              : 'Hawa shaant hai aur mausam saaf hai. Subah 06:30 AM se 10:30 AM tak spray ka behtareen samay hai.',
            sprayWindow: isRainingOrWet ? '24 ghante ke liye taal dein' : '07:00 AM - 11:00 AM',
            irrigationReason: isRainingOrWet
              ? 'Barish ki wajah se mitti mein paryapt nami maujood hai.'
              : weather.temperature > 32
              ? 'Tez dhoop ki wajah se halki drip sinchai ki zaroorat hai.'
              : 'Mitti mein nami sahi santulan mein hai. Niyamit cycle follow karein.',
            fertReason: isRainingOrWet
              ? 'Tez barish se pehle Urea/Nitrogen na dalein taki pani ke sath beh na jaye.'
              : 'Khaad aur NPK poshan dene ke liye mitti ki sthiti anukool hai.',
            summary: `Tapman ${weather.temperature}°C aur Nami ${weather.humidity}% bimari ke khatre ko prabhavit kar rahe hain.`,
          };

        case 'hi':
          return {
            headline: isRainingOrWet
              ? 'अधिक नमी एवं वर्षा की चेतावनी: रासायनिक छिड़काव स्थगित करें एवं जल निकासी सुनिश्चित करें।'
              : isHighWind
              ? 'तेज़ हवा की स्थिति: कीटनाशक छिड़काव से बचें ताकि दवा व्यर्थ न उड़े।'
              : isHighHumidity
              ? 'हवा में अत्यधिक नमी दर्ज: पत्तियों पर फफूंद रोग फैलने की उच्च संभावना।'
              : 'फसल निरीक्षण, सामान्य देखभाल एवं पोषण प्रबंधन हेतु मौसम अनुकूल है।',
            sprayReason: isHighWind
              ? `हवा की गति (${weather.windSpeed} km/h) सुरक्षित सीमा (>15 km/h) से अधिक है, जिससे स्प्रे व्यर्थ हो सकता है।`
              : isRainingOrWet
              ? `वर्षा की संभावना (${weather.precipitationProbability}%) के कारण दवा धुलने का जोखिम है।`
              : 'हवा शांत एवं आकाश साफ है। प्रातः 06:30 AM से 10:30 AM के मध्य छिड़काव हेतु उत्तम समय उपलब्ध है।',
            sprayWindow: isRainingOrWet ? '24 घंटे स्थगित करें' : '07:00 AM - 11:00 AM',
            irrigationReason: isRainingOrWet
              ? 'वर्षा के कारण मिट्टी में पर्याप्त नमी उपलब्ध है।'
              : weather.temperature > 32
              ? 'तीव्र धूप एवं वाष्पोत्सर्जन के कारण हल्की ड्रिप सिंचाई अनुशंसित है।'
              : 'मिट्टी में नमी का स्तर सामान्य है। नियमित सिंचाई चक्र का पालन करें।',
            fertReason: isRainingOrWet
              ? 'भारी वर्षा से पूर्व यूरिया/नाइट्रोजन का छिड़काव न करें ताकि पोषक तत्व बह न जाएं।'
              : 'उर्वरक एवं NPK पोषण देने हेतु अनुकूल परिस्थितियां हैं।',
            summary: `तापमान ${weather.temperature}°C एवं आर्द्रता ${weather.humidity}% रोग विस्तार के प्रमुख कारक हैं।`,
          };

        case 'pa':
          return {
            headline: isRainingOrWet
              ? 'ਮੀਂਹ ਅਤੇ ਵੱਧ ਨਮੀ ਦਾ ਅਲਰਟ: ਸਪਰੇਅ ਫਿਲਹਾਲ ਰੋਕੋ ਅਤੇ ਪਾਣੀ ਨਿਕਾਸੀ ਦਾ ਪ੍ਰਬੰਧ ਰੱਖੋ।'
              : isHighWind
              ? 'ਤੇਜ਼ ਹਵਾਵਾਂ ਕਾਰਨ ਕੀਟਨਾਸ਼ਕ ਸਪਰੇਅ ਨਾ ਕਰੋ।'
              : isHighHumidity
              ? 'ਹਵਾ ਵਿੱਚ ਵੱਧ ਨਮੀ: ਫ਼ਸਲ ਉੱਤੇ ਉੱਲੀ ਦਾ ਖ਼ਤਰਾ ਵਧ ਸਕਦਾ ਹੈ।'
              : 'ਖੇਤ ਦੀ ਦੇਖਭਾਲ ਅਤੇ ਖਾਦ ਪਾਉਣ ਲਈ ਮੌਸਮ ਅਨੁਕੂਲ ਹੈ।',
            sprayReason: isHighWind
              ? `ਹਵਾ ਦੀ ਗਤੀ (${weather.windSpeed} km/h) ਸੁਰੱਖਿਅਤ ਸੀਮਾ ਤੋਂ ਵੱਧ ਹੈ।`
              : isRainingOrWet
              ? `ਮੀਂਹ (${weather.precipitationProbability}%) ਨਾਲ ਦਵਾਈ ਧੁਲ ਸਕਦੀ ਹੈ।`
              : 'ਮੌਸਮ ਸਾਫ਼ ਹੈ, ਸਵੇਰੇ 07:00 AM ਤੋਂ 11:00 AM ਸਪਰੇਅ ਕਰੋ।',
            sprayWindow: isRainingOrWet ? '24 ਘੰਟੇ ਲਈ ਰੋਕੋ' : '07:00 AM - 11:00 AM',
            irrigationReason: isRainingOrWet ? 'ਮੀਂਹ ਕਾਰਨ ਖੇਤ ਵਿੱਚ ਕਾਫੀ ਨਮੀ ਹੈ।' : 'ਸਧਾਰਨ ਸਿੰਚਾਈ ਚੱਕਰ ਚਲਾਓ।',
            fertReason: isRainingOrWet ? 'ਮੀਂਹ ਤੋਂ ਪਹਿਲਾਂ ਯੂਰੀਆ ਨਾ ਪਾਓ।' : 'ਖਾਦ ਪਾਉਣ ਲਈ ਸਹੀ ਸਮਾਂ ਹੈ।',
            summary: `ਤਾਪਮਾਨ ${weather.temperature}°C ਅਤੇ ਨਮੀ ${weather.humidity}% ਮੌਸਮੀ ਜੋਖਮ ਬਣਾਉਂਦੇ ਹਨ।`,
          };

        case 'mr':
          return {
            headline: isRainingOrWet
              ? 'पाऊस आणि अधिक आर्द्रतेचा इशारा: फवारणी पुढे ढकला आणि शेतातील पाणी निचरा खुला ठेवा.'
              : isHighWind
              ? 'वेगवान वाऱ्यामुळे औषध फवारणी टाळा.'
              : isHighHumidity
              ? 'हवेतील आर्द्रता वाढल्यामुळे पिकावर बुरशीजन्य रोगांचा प्रादुर्भाव होऊ शकतो.'
              : 'पिकांची निगा व खत व्यवस्थापनासाठी हवामान अनुकूल आहे.',
            sprayReason: isHighWind
              ? `वाऱ्याचा वेग (${weather.windSpeed} km/h) मर्यादेपेक्षा जास्त आहे.`
              : isRainingOrWet
              ? `पावसामुळे (${weather.precipitationProbability}%) औषध वाहून जाण्याची शक्यता.`
              : 'सकाळी 07:00 AM ते 11:00 AM फवारणीसाठी योग्य वेळ.',
            sprayWindow: isRainingOrWet ? '24 तास पुढे ढकला' : '07:00 AM - 11:00 AM',
            irrigationReason: isRainingOrWet ? 'मातीत पुरेशी ओलावा आहे.' : 'नियमित सिंचन चालू ठेवा.',
            fertReason: isRainingOrWet ? 'पावसापूर्वी युरिया खत टाकू नका.' : 'खत देण्यासाठी पोषक वातावरण.',
            summary: `तापमान ${weather.temperature}°C आणि आर्द्रता ${weather.humidity}% रोग प्रसारास कारणीभूत.`,
          };

        case 'te':
          return {
            headline: isRainingOrWet
              ? 'వర్షం మరియు అధిక తేమ హెచ్చరిక: మందుల పిచికారీని వాయిదా వేయండి మరియు నీటి పారుదల చూసుకోండి.'
              : isHighWind
              ? 'వేగంగా గాలులు వీస్తున్నందున మందుల పిచికారీ చేయవద్దు.'
              : isHighHumidity
              ? 'వాతావరణంలో తేమ శాతం పెరిగింది: శిలీంధ్రాల తెగుళ్లు వ్యాపించే ప్రమాదం ఉంది.'
              : 'పంట సంరక్షణ మరియు ఎరువుల నిర్వహణకు వాతావరణం అనుకూలంగా ఉంది.',
            sprayReason: isHighWind
              ? `గాలి వేగం (${weather.windSpeed} km/h) పిచికారీ పరిమితి కంటే ఎక్కువ.`
              : isRainingOrWet
              ? `వర్షం (${weather.precipitationProbability}%) వల్ల మందు కొట్టుకుపోయే ప్రమాదం ఉంది.`
              : 'వాతావరణం అనుకూలం, ఉదయం 07:00 AM నుండి 11:00 AM వరకు పిచికారీ చేయవచ్చు.',
            sprayWindow: isRainingOrWet ? '24 గంటలు వాయిదా వేయండి' : '07:00 AM - 11:00 AM',
            irrigationReason: isRainingOrWet ? 'వర్షం వల్ల భూమిలో సరిపడా తేమ ఉంది.' : 'సాధారణ నీటిపారుదల షెడ్యూల్ పాటించండి.',
            fertReason: isRainingOrWet ? 'వర్షానికి ముందు యూరియా వేయవద్దు.' : 'ఎరువులు వేయడానికి అనుకూల సమయం.',
            summary: `ఉష్ణోగ్రత ${weather.temperature}°C మరియు తేమ ${weather.humidity}% తెగుళ్ల ప్రభావం చూపుతున్నాయి.`,
          };

        case 'en':
        default:
          return {
            headline: isRainingOrWet
              ? 'High moisture & rain alert: postpone chemical sprays and ensure field trenches are open.'
              : isHighWind
              ? 'Gusty wind conditions: avoid foliar misting to prevent off-target chemical drift.'
              : isHighHumidity
              ? 'Elevated relative humidity detected: high risk of fungal spore germination in canopy.'
              : 'Optimal weather conditions for routine field maintenance, crop scouting, and fertigation.',
            sprayReason: isHighWind
              ? `Current wind speed (${weather.windSpeed} km/h) exceeds safe spraying limits (>15 km/h) causing spray drift.`
              : isRainingOrWet
              ? `Rainfall probability (${weather.precipitationProbability}%) threatens to wash off pesticide active ingredients.`
              : 'Calm winds and clear sky. Ideal spray window available between 06:30 AM and 10:30 AM.',
            sprayWindow: isRainingOrWet ? 'Postpone by 24h' : '07:00 AM - 11:00 AM',
            irrigationReason: isRainingOrWet
              ? 'Adequate precipitation detected. Root zone moisture is saturated.'
              : weather.temperature > 32
              ? 'High evapotranspiration due to warm sun. Light afternoon drip irrigation recommended.'
              : 'Standard soil moisture balance. Follow standard scheduled cycle.',
            fertReason: isRainingOrWet
              ? 'Do not broadcast urea/nitrogen before heavy showers to prevent nitrate runoff leaching.'
              : 'Favorable soil uptake conditions for micro-nutrients and NPK fertigation.',
            summary: `Temperature ${weather.temperature}°C & Humidity ${weather.humidity}% are key determinants for disease pressure.`,
          };
      }
    };

    const loc = getLocalizedContent(lang);

    return {
      overallRisk,
      headline: loc.headline,
      sprayingRecommendation: {
        status: isRainingOrWet || isHighWind ? 'UNFAVORABLE' : isHighHumidity ? 'CAUTION' : 'FAVORABLE',
        reason: loc.sprayReason,
        optimalWindow: loc.sprayWindow,
      },
      irrigationRecommendation: {
        status: isRainingOrWet ? 'DELAY' : weather.temperature > 32 ? 'RECOMMENDED' : 'NORMAL',
        reason: loc.irrigationReason,
        amount: isRainingOrWet ? '0 mm' : '15-20 mm equivalent via drip',
      },
      fertilizationRecommendation: {
        status: isRainingOrWet ? 'HOLD' : 'PROCEED',
        reason: loc.fertReason,
      },
      diseaseRiskFactors: {
        pestRisk: isHighWind ? 'LOW' : 'MODERATE',
        fungalRisk: isHighHumidity ? 'HIGH' : 'LOW',
        weatherRisk: overallRisk,
        summary: loc.summary,
      },
      preventiveMeasures: [
        'Clear drainage channels to prevent stagnant waterlogging.',
        'Scout bottom 1/3rd of the plant canopy for early lesion symptoms.',
        'Use recommended surfactant/spreader if spraying is necessary.'
      ],
    };
  }
};
