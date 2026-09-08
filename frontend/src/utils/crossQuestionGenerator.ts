import { CrossQuestionRequest, CrossQuestionItem } from '../types/analysis.types';
import { LanguageCode } from './translations';

export const getLocalizedCrossQuestions = (
  crop: string = 'Crop',
  lang: LanguageCode = 'en'
): CrossQuestionRequest => {
  const cName = crop || 'Crop';

  switch (lang) {
    case 'hi':
      return {
        cropName: cName,
        reason: `AI मॉडल आपकी अपलोड की गई फोटो और लक्षणों का विश्लेषण कर रहा है। सटीक निदान (Accuracy) हेतु और भ्रम दूर करने के लिए कृपया 2 त्वरित प्रश्नों के उत्तर दें:`,
        questions: [
          {
            id: 'q_symptom_location',
            question: `यह रोग के लक्षण पौधे पर सबसे पहले कहाँ दिखाई दिए?`,
            whyAsking: `पत्ती की स्थिति से कवक (Fungus) बनाम पोषक तत्व की कमी का अंतर स्पष्ट होता है।`,
            options: [
              'निचली पुरानी पत्तियों पर (Lower old leaves)',
              'ऊपरी नई कोपलों पर (Upper young leaves)',
              'तने या शाखाओं के जोड़ों पर (Stem / Joint)',
              'पूरे पौधे पर एक समान फैलाव (Whole plant evenly)'
            ]
          },
          {
            id: 'q_spot_appearance',
            question: `पत्तियों पर धब्बों या बनावट का स्वरूप कैसा है?`,
            whyAsking: `धब्बों के छल्ले और सतह से रोगाणु (Pathogen) की सही प्रजाति ज्ञात होती है।`,
            options: [
              'भूरे/काले गोल छल्ले (Concentric target rings)',
              'पत्ती के नीचे सफेद/धूसर चूर्ण जैसी फफूंद (Fuzzy/Powdery coating)',
              'गीले पानी जैसे तैलीय धब्बे (Water-soaked oily spots)',
              'केवल पीलापन व शिराएं हरी (Interveinal chlorosis / Yellowing)'
            ]
          },
          {
            id: 'q_water_regime',
            question: `पिछले 5-7 दिनों में खेत में पानी या सिंचाई की क्या स्थिति रही है?`,
            whyAsking: `अत्यधिक नमी जड़ सड़न व फफूंद को बढ़ावा देती है।`,
            options: [
              'हाल ही में भारी बारिश या जलभराव हुआ',
              'सामान्य नियमित सिंचाई की गई',
              'खेत में सूखा या पानी की कमी रही है'
            ]
          }
        ]
      };

    case 'hinglish':
      return {
        cropName: cName,
        reason: `AI model aapki uploaded photo aur symptoms ko analyse kar raha hai. 100% accurate diagnosis ke liye please in 2-3 quick sawalon ka answer karein:`,
        questions: [
          {
            id: 'q_symptom_location',
            question: `Yeh lakshan paudhe par sabse pehle kahan dikhe?`,
            whyAsking: `Leaf location se fungal disease aur nutrient deficiency ka exact fark pata chalta hai.`,
            options: [
              'Neeche ki purani pattiyon par (Lower old leaves)',
              'Upar ki nayi pattiyon par (Upper young leaves)',
              'Tane / Stem ke paas',
              'Poore paudhe par ek saath (Whole plant)'
            ]
          },
          {
            id: 'q_spot_appearance',
            question: `Pattiyon par dhabbe ya texture kaisa dikh raha hai?`,
            whyAsking: `Spot pattern se exact pathogen (blight, rust ya mildew) confirm hota hai.`,
            options: [
              'Bhoore / Kale gol chhalle (Concentric target rings)',
              'Patti ke peeche safed powder ya fafundi (Powdery / Downy mold)',
              'Paani jaise geele tel ke dhabbe (Water-soaked spots)',
              'Pattiya pili hain par nasein hari hain (Chlorosis / Yellowing)'
            ]
          },
          {
            id: 'q_water_regime',
            question: `Pichhle 5-7 dino mein khet mein paani ya sinchai ki sthiti?`,
            whyAsking: `Excess moisture se root rot aur fungal spores tezi se badhte hain.`,
            options: [
              'Bhari baarish ya paani bhara hua tha',
              'Normal schedule par sinchai hui',
              'Khet me sookha ya paani ki kami thi'
            ]
          }
        ]
      };

    case 'haryanvi':
      return {
        cropName: cName,
        reason: `AI मॉडल थारी फोटो और लक्षण जांच रह्या सै। पक्का और सही इलाज खातिर इन 2-3 बात का जवाब दो:`,
        questions: [
          {
            id: 'q_symptom_location',
            question: `या बीमारी पौधे पे सबते पहले कित दिखी थी?`,
            whyAsking: `पत्ती की जगह ते बीमारी और खाद की कमी का फर्क बेरा लागै सै।`,
            options: [
              'तले की पुरानी पत्तियां पे (Lower old leaves)',
              'ऊपर की नयी कोपलां पे (Upper new leaves)',
              'तने या डांगरां के जोड़ पे',
              'सारे पौधे पे एक बार में (Whole plant)'
            ]
          },
          {
            id: 'q_spot_appearance',
            question: `पत्तियां पे निशान केसे दिख रहे सैं?`,
            whyAsking: `निशान देख के सही रोगाणु का पक्का बेरा लागै सै।`,
            options: [
              'काले/भूरे गोल गोल छल्ले (Target rings)',
              'पत्ती के पाछै सफेद चूरा या जाला (Powdery mold)',
              'गीले तेल जैसे धब्बे (Water-soaked spots)',
              'पत्ती पीली सैं पर नसें हरी सैं (Yellowing)'
            ]
          },
          {
            id: 'q_water_regime',
            question: `पिछले 5-7 दिनां में खेत में पाणी की के हालत थी?`,
            whyAsking: `घणे पाणी ते जड़ गलन और फफूंद घणी फैलै सै।`,
            options: [
              'घणा पाणी भर गया था या भारी बारिश थी',
              'नॉर्मल पाणी दिया था',
              'खेत में सूखा या पाणी की कमी थी'
            ]
          }
        ]
      };

    case 'pa':
      return {
        cropName: cName,
        reason: `AI ਮਾਡਲ ਤੁਹਾਡੀ ਫੋਟੋ ਦੀ ਜਾਂਚ ਕਰ ਰਿਹਾ ਹੈ। ਬਿਲਕੁਲ ਸਹੀ ਰਿਪੋਰਟ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਇਹਨਾਂ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ ਦਿਓ:`,
        questions: [
          {
            id: 'q_symptom_location',
            question: `ਇਹ ਲੱਛਣ ਬੂਟੇ 'ਤੇ ਸਭ ਤੋਂ ਪਹਿਲਾਂ ਕਿੱਥੇ ਦਿਖਾਈ ਦਿੱਤੇ?`,
            whyAsking: `ਪੱਤਿਆਂ ਦੀ ਸਥਿਤੀ ਤੋਂ ਬਿਮਾਰੀ ਦੀ ਸਹੀ ਪਛਾਣ ਹੁੰਦੀ ਹੈ।`,
            options: [
              'ਹੇਠਲੇ ਪੁਰਾਣੇ ਪੱਤਿਆਂ ਤੇ (Lower leaves)',
              'ਉੱਪਰਲੇ ਨਵੇਂ ਪੱਤਿਆਂ ਤੇ (Upper leaves)',
              'ਤਣੇ ਦੇ ਜੋੜਾਂ ਤੇ (Stem)',
              'ਪੂਰੇ ਬੂਟੇ ਤੇ ਇਕਸਾਰ (Whole plant)'
            ]
          },
          {
            id: 'q_spot_appearance',
            question: `ਪੱਤਿਆਂ ਤੇ ਧੱਬਿਆਂ ਦੀ ਬਣਤਰ ਕਿਹੋ ਜਿਹੀ ਹੈ?`,
            whyAsking: `ਧੱਬਿਆਂ ਦੇ ਰੂਪ ਤੋਂ ਉੱਲੀ ਜਾਂ ਬੈਕਟੀਰੀਆ ਦਾ ਪਤਾ ਲੱਗਦਾ ਹੈ।`,
            options: [
              'ਭੂਰੇ/ਕਾਲੇ ਗੋਲ ਚੱਕਰ (Concentric rings)',
              'ਪੱਤੇ ਦੇ ਹੇਠਾਂ ਚਿੱਟਾ ਪਾਊਡਰ ਜਾਂ ਉੱਲੀ (Powdery mold)',
              'ਪਾਣੀ ਵਰਗੇ ਤੇਲੀਆ ਧੱਬੇ (Water-soaked spots)',
              'ਪੱਤੇ ਪੀਲੇ ਪੈ ਰਹੇ ਹਨ (Yellowing)'
            ]
          },
          {
            id: 'q_water_regime',
            question: `ਖੇਤ ਵਿੱਚ ਸਿੰਚਾਈ ਜਾਂ ਮੀਂਹ ਦੀ ਕੀ ਸਥਿਤੀ ਰਹੀ ਹੈ?`,
            whyAsking: `ਜ਼ਿਆਦਾ ਨਮੀ ਨਾਲ ਬਿਮਾਰੀ ਤੇਜ਼ੀ ਨਾਲ ਫੈਲਦੀ ਹੈ।`,
            options: [
              'ਖੇਤ ਵਿੱਚ ਪਾਣੀ ਖੜ੍ਹਾ ਸੀ ਜਾਂ ਭਾਰੀ ਮੀਂਹ ਪਿਆ',
              'ਆਮ ਸਮੇਂ ਸਿਰ ਸਿੰਚਾਈ ਕੀਤੀ ਗਈ',
              'ਖੇਤ ਵਿੱਚ ਪਾਣੀ ਦੀ ਘਾਟ ਜਾਂ ਸੋਕਾ ਰਿਹਾ'
            ]
          }
        ]
      };

    case 'mr':
      return {
        cropName: cName,
        reason: `AI मॉडेल तुमच्या पिकाच्या फोटोचे अचूक विश्लेषण करत आहे. खात्रीशीर निदानासाठी कृपया खालील प्रश्नांची उत्तरे द्या:`,
        questions: [
          {
            id: 'q_symptom_location',
            question: `हे रोगलक्षण झाडावर सर्वप्रथम कुठे आढळले?`,
            whyAsking: `पानांच्या स्थानावरून रोगाचा प्रकार स्पष्ट होतो.`,
            options: [
              'खालच्या जुन्या पानांवर (Lower leaves)',
              'वरच्या कोवळ्या पानांवर (Upper leaves)',
              'खोडावर किंवा फांद्यांवर (Stem)',
              'संपूर्ण झाडावर एकसारखे (Whole plant)'
            ]
          },
          {
            id: 'q_spot_appearance',
            question: `पानावरील डागांचे स्वरूप कसे आहे?`,
            whyAsking: `डागांच्या लक्षणांवरून बुरशीचा अचूक प्रकार समजतो.`,
            options: [
              'तपकिरी/काळे गोल कडे असलेले डाग (Target rings)',
              'पानाच्या मागे पांढरी बुरशी किंवा पावडर (Powdery mold)',
              'तेलकट किंवा पाण्यासारखे ठिपके (Water-soaked)',
              'पाने पिवळी पडत आहेत (Yellowing)'
            ]
          },
          {
            id: 'q_water_regime',
            question: `गेल्या काही दिवसांत शेतात पाणी किंवा ओलाव्याची स्थिती कशी आहे?`,
            whyAsking: `जास्त ओलावा बुरशीजन्य रोगांना कारणीभूत ठरतो.`,
            options: [
              'शेतात जास्त पाणी साचले होते किंवा अतिवृष्टी',
              'नेहमीप्रमाणे वेळेवर पाणी दिले',
              'शेतात पाण्याची कमतरता किंवा कोरडेपणा होता'
            ]
          }
        ]
      };

    case 'te':
      return {
        cropName: cName,
        reason: `ఖచ్చితమైన తెగులు నిర్ధారణ కోసం దయచేసి క్రింది ప్రశ్నలకు సమాధానం ఇవ్వండి:`,
        questions: [
          {
            id: 'q_symptom_location',
            question: `మొక్కపై ఈ లక్షణాలు మొదట ఎక్కడ కనిపించాయి?`,
            whyAsking: `ఆకుల స్థానం ద్వారా తెగులు రకం స్పష్టమవుతుంది.`,
            options: [
              'క్రింది పాత ఆకులపై (Lower leaves)',
              'పై లేత ఆకులపై (Upper leaves)',
              'కాండంపై (Stem)',
              'మొక్క మొత్తం ఒకేసారి (Whole plant)'
            ]
          },
          {
            id: 'q_spot_appearance',
            question: `ఆకులపై మచ్చల తీరు ఎలా ఉంది?`,
            whyAsking: `మచ్చల రకాన్ని బట్టి శిలీంధ్రం గుర్తించబడుతుంది.`,
            options: [
              'గుండ్రటి నల్లని లేదా గోధుమ రంగు వలయాలు (Target rings)',
              'ఆకు అడుగున తెల్లటి బూజు లేదా పొడి (Powdery mold)',
              'నీటి మచ్చల వంటి నూనె మచ్చలు (Water-soaked)',
              'ఆకులు పసుపు రంగులోకి మారడం (Yellowing)'
            ]
          }
        ]
      };

    case 'ta':
      return {
        cropName: cName,
        reason: `துல்லியமான பயிர் நோய் கண்டறிதலுக்கு பின்வரும் கேள்விகளுக்கு பதிலளிக்கவும்:`,
        questions: [
          {
            id: 'q_symptom_location',
            question: `பயிரில் இந்த அறிகுறிகள் முதலில் எங்கு தோன்றின?`,
            whyAsking: `இலை அமைப்பின் மூலம் நோய் தெளிவுபடுத்தப்படுகிறது.`,
            options: [
              'கீழ் பழைய இலைகளில் (Lower leaves)',
              'மேல் புதிய தளிர்களில் (Upper leaves)',
              'தண்டில் (Stem)',
              'செடி முழுவதும் ஒரே நேரத்தில் (Whole plant)'
            ]
          },
          {
            id: 'q_spot_appearance',
            question: `இலைகளில் புள்ளிகள் எவ்வாறு உள்ளன?`,
            whyAsking: `புள்ளிகளின் வடிவம் பூஞ்சை வகையை உறுதிப்படுத்துகிறது.`,
            options: [
              'வட்ட வடிவ கரும் புள்ளிகள் (Concentric rings)',
              'இலையின் அடியில் வெள்ளை பூஞ்சை (Powdery mold)',
              'எண்ணெய் போன்ற நீர் புள்ளிகள் (Water-soaked)',
              'இலைகள் மஞ்சள் நிறமாதல் (Yellowing)'
            ]
          }
        ]
      };

    case 'kn':
      return {
        cropName: cName,
        reason: `ನಿಖರವಾದ ರೋಗ ಪತ್ತೆಗಾಗಿ ದಯವಿಟ್ಟು ಈ ಕೆಳಗಿನ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ:`,
        questions: [
          {
            id: 'q_symptom_location',
            question: `ಈ ರೋಗಲಕ್ಷಣಗಳು ಗಿಡದಲ್ಲಿ ಮೊದಲು ಎಲ್ಲಿ ಕಾಣಿಸಿಕೊಂಡವು?`,
            whyAsking: `ಎಲೆಗಳ ಸ್ಥಾನದಿಂದ ರೋಗದ ಮೂಲ ತಿಳಿಯುತ್ತದೆ.`,
            options: [
              'ಕೆಳಗಿನ ಹಳೆಯ ಎಲೆಗಳಲ್ಲಿ (Lower leaves)',
              'ಮೇಲಿನ ಹೊಸ ಚಿಗುರುಗಳಲ್ಲಿ (Upper leaves)',
              'ಕಾಂಡದ ಮೇಲೆ (Stem)',
              'ಇಡೀ ಗಿಡದಲ್ಲಿ ಒಟ್ಟಿಗೆ (Whole plant)'
            ]
          },
          {
            id: 'q_spot_appearance',
            question: `ಎಲೆಗಳ ಮೇಲಿನ ಕಲೆಗಳು ಹೇಗಿವೆ?`,
            whyAsking: `ಕಲೆಗಳ ಆಕಾರದಿಂದ ಶಿಲೀಂಧ್ರ ಪತ್ತೆಯಾಗುತ್ತದೆ.`,
            options: [
              'ಕಂದು/ಕಪ್ಪು ದುಂಡಗಿನ ವೃತ್ತಗಳು (Target rings)',
              'ಎಲೆಯ ಕೆಳಗೆ ಬಿಳಿ ಪುಡಿ ಅಥವಾ ಬೂజు (Powdery mold)',
              'ಎಣ್ಣೆಯಂಥ ನೀರಿನ ಚುಕ್ಕೆಗಳು (Water-soaked)',
              'ಎಲೆಗಳು ಹಳದಿಯಾಗುತ್ತಿವೆ (Yellowing)'
            ]
          }
        ]
      };

    case 'gu':
      return {
        cropName: cName,
        reason: `ચોક્કસ રોગ નિદાન માટે કૃપા કરીને નીચેના પ્રશ્નોના જવાબ આપો:`,
        questions: [
          {
            id: 'q_symptom_location',
            question: `આ રોગના લક્ષણો છોડ પર સૌથી પહેલા ક્યાં દેખાયા?`,
            whyAsking: `પાનની સ્થિતિથી રોગની સાચી ઓળખ થાય છે.`,
            options: [
              'નીચેના જૂના પાન પર (Lower leaves)',
              'ઉપરના નવા પાન પર (Upper leaves)',
              'થડ અથવા ડાળી પર (Stem)',
              'આખા છોડ પર એકસાથે (Whole plant)'
            ]
          },
          {
            id: 'q_spot_appearance',
            question: `પાન પર ડાઘ કેવા દેખાય છે?`,
            whyAsking: `ડાઘના પ્રકારથી ફૂગની સાચી જાત ખબર પડે છે.`,
            options: [
              'કથ્થઈ/કાળા ગોળ ચક્રો (Concentric rings)',
              'પાનની નીચે સફેદ પાવડર કે ફૂગ (Powdery mold)',
              'તેલ જેવા પાણીના ડાઘ (Water-soaked)',
              'પાન પીળા પડી રહ્યા છે (Yellowing)'
            ]
          }
        ]
      };

    case 'bn':
      return {
        cropName: cName,
        reason: `সঠিক রোগ নির্ণয়ের জন্য অনুগ্রহ করে নিচের প্রশ্নগুলির উত্তর দিন:`,
        questions: [
          {
            id: 'q_symptom_location',
            question: `এই রোগের লক্ষণগুলি গাছে প্রথম কোথায় দেখা গিয়েছিল?`,
            whyAsking: `পাতার অবস্থান দেখে রোগের সঠিক প্রকৃতি নির্ধারণ করা যায়।`,
            options: [
              'নিচের পুরোনো পাতায় (Lower leaves)',
              'উপরের কচি পাতায় (Upper leaves)',
              'কাণ্ড বা ডালে (Stem)',
              'পুরো গাছে একসাথে (Whole plant)'
            ]
          },
          {
            id: 'q_spot_appearance',
            question: `পাতার দাগগুলি দেখতে কেমন?`,
            whyAsking: `দাগের প্যাটার্ন দেখে ছত্রাকের সঠিক প্রজাতি শনাক্ত করা যায়।`,
            options: [
              'বাদামী/কালো গোলাকার রিং (Target rings)',
              'পাতার নিচে সাদা গুঁড়ো বা ছত্রাক (Powdery mold)',
              'তেলাক্ত জলের মতো দাগ (Water-soaked)',
              'পাতা হলুদ হয়ে যাওয়া (Yellowing)'
            ]
          }
        ]
      };

    default:
      return {
        cropName: cName,
        reason: `The AI Agronomist is analyzing your uploaded photo and field notes. To ensure 100% diagnostic accuracy and rule out lookalike pathogens, please answer these quick field observations:`,
        questions: [
          {
            id: 'q_symptom_location',
            question: `Where did these foliar symptoms first appear on the plant?`,
            whyAsking: `Symptom origin helps distinguish fungal pathogens from systemic nutrient deficiencies.`,
            options: [
              'On lower, older leaves (Acropetal spread)',
              'On upper young shoots and fresh foliage',
              'Around the stem collar or petiole joints',
              'Evenly distributed across the entire canopy'
            ]
          },
          {
            id: 'q_spot_appearance',
            question: `What is the primary visual appearance of the foliar lesions?`,
            whyAsking: `Lesion morphology confirms whether it is Alternaria, Cercospora, Downy Mildew, or Bacterial Blight.`,
            options: [
              'Dark concentric target-board rings with yellow halos',
              'Fuzzy white or greyish powdery sporulation on underside',
              'Water-soaked, angular oily lesions restricted by veins',
              'General interveinal chlorosis (yellowing with green veins)'
            ]
          },
          {
            id: 'q_water_regime',
            question: `What has been the recent soil moisture and watering regime?`,
            whyAsking: `Prolonged surface wetness dramatically accelerates fungal spore germination.`,
            options: [
              'Heavy rainfall or standing water in the plot',
              'Normal regular irrigation schedule',
              'Dry spell or deficit moisture stress'
            ]
          }
        ]
      };
  }
};
