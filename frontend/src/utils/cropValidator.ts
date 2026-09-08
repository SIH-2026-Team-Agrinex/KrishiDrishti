/**
 * KrishiDrishti AI - Crop Specimen Validation Engine
 * 
 * Verifies that an uploaded image is an actual agricultural crop, plant, 
 * foliar specimen, or farm vegetation before proceeding to disease detection.
 * 
 * Combines:
 * 1. High-speed in-browser biological foliar spectrum & texture canvas analysis.
 * 2. Optional Vision Model verification when an online API key is configured.
 */

import { ENV_CONFIG } from '../services/api/apiClient';

export interface CropValidationResult {
  isCrop: boolean;
  confidence: number;
  reason?: string;
  detectedFeatures?: {
    vegetationRatio: number;
    foliarChlorophyllScore: number;
    organicTextureScore: number;
    nonPlantDominance: number;
  };
}

/**
 * Fast client-side biological foliar canvas classifier.
 * Inspects color spectrum, HSV vegetative distribution, foliar texture, 
 * chlorosis/necrosis lesions, and non-plant synthetic/skin signatures.
 */
export async function analyzeImageFoliarContent(file: File): Promise<CropValidationResult> {
  return new Promise((resolve) => {
    // 1. Filename heuristic check for blatant non-crop uploads
    const nameLower = file.name.toLowerCase();
    const suspiciousNonCropKeywords = [
      'screenshot', 'invoice', 'receipt', 'bill', 'avatar', 'selfie', 
      'portrait', 'car_', 'vehicle', 'dog_', 'cat_', 'meme', 'document',
      'passport', 'id_card', 'card_'
    ];
    const hasSuspiciousName = suspiciousNonCropKeywords.some((kw) => nameLower.includes(kw));

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement('canvas');
        const size = 128; // Normalized size for rapid, robust pixel classification
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          // If 2D context fails, allow through with default
          resolve({ isCrop: true, confidence: 0.8 });
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        const totalPixels = size * size;

        let plantFoliarPixels = 0;
        let chloroticNecroticPixels = 0;
        let nonPlantSkinSyntheticPixels = 0;
        let grayscalePixels = 0;

        let totalR = 0;
        let totalG = 0;
        let totalB = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          totalR += r;
          totalG += g;
          totalB += b;

          // Convert RGB to HSV
          const rNorm = r / 255;
          const gNorm = g / 255;
          const bNorm = b / 255;
          const max = Math.max(rNorm, gNorm, bNorm);
          const min = Math.min(rNorm, gNorm, bNorm);
          const delta = max - min;

          let h = 0;
          if (delta !== 0) {
            if (max === rNorm) {
              h = ((gNorm - bNorm) / delta) % 6;
            } else if (max === gNorm) {
              h = (bNorm - rNorm) / delta + 2;
            } else {
              h = (rNorm - gNorm) / delta + 4;
            }
            h = Math.round(h * 60);
            if (h < 0) h += 360;
          }

          const s = max === 0 ? 0 : delta / max;
          const v = max;

          // Detect Grayscale / Uniform metallic / Paper document
          if (s < 0.1) {
            grayscalePixels++;
            continue;
          }

          // Plant Foliar Green Signature (Healthy crop foliage, leaves, stems)
          // Green hues: 55 deg to 175 deg, moderate saturation, visible brightness
          const isGreenFoliar = h >= 55 && h <= 175 && s >= 0.15 && v >= 0.12;
          const isVegetativeIndex = g > r && g > b && (g - Math.max(r, b) > 8);

          if (isGreenFoliar || isVegetativeIndex) {
            plantFoliarPixels++;
            continue;
          }

          // Diseased Foliar Signature (Chlorosis yellowing, blight lesions, rust, spots)
          // Hues 25 deg to 55 deg with organic saturation (yellows, ochres, foliar brown)
          const isFoliarDisease = h >= 25 && h < 55 && s >= 0.25 && v >= 0.2;
          const isNecroticSpot = h >= 18 && h < 35 && s >= 0.2 && s <= 0.75 && v >= 0.15 && v <= 0.7;

          if (isFoliarDisease || isNecroticSpot) {
            chloroticNecroticPixels++;
            continue;
          }

          // Detect Non-Plant / Human Skin or Synthetic Non-Crop Tones
          // Human skin tones typically cluster around 0 - 25 deg or 345 - 360 deg
          const isHumanSkin = (h <= 24 || h >= 340) && r > g && g > b && (r - g > 15) && s >= 0.15 && s <= 0.65;
          // Synthetic neon or cyan/purple non-plant colors
          const isSyntheticNonPlant = (h > 185 && h < 320 && s > 0.4);

          if (isHumanSkin || isSyntheticNonPlant) {
            nonPlantSkinSyntheticPixels++;
          }
        }

        const foliarRatio = (plantFoliarPixels + chloroticNecroticPixels) / totalPixels;
        const skinSyntheticRatio = nonPlantSkinSyntheticPixels / totalPixels;
        const grayscaleRatio = grayscalePixels / totalPixels;

        // Texture variance check
        const avgR = totalR / totalPixels;
        const avgG = totalG / totalPixels;
        const avgB = totalB / totalPixels;
        let varianceSum = 0;
        for (let i = 0; i < data.length; i += 4) {
          varianceSum += Math.abs(data[i] - avgR) + Math.abs(data[i + 1] - avgG) + Math.abs(data[i + 2] - avgB);
        }
        const textureScore = varianceSum / (totalPixels * 3);

        const detectedFeatures = {
          vegetationRatio: Math.round(foliarRatio * 100) / 100,
          foliarChlorophyllScore: Math.round((plantFoliarPixels / totalPixels) * 100) / 100,
          organicTextureScore: Math.round(textureScore * 100) / 100,
          nonPlantDominance: Math.round(skinSyntheticRatio * 100) / 100,
        };

        // DECISION LOGIC:
        // A valid crop leaf/plant image requires:
        // 1. Minimum foliar ratio >= 12% (healthy greens or diseased yellow/brown foliage)
        // 2. Must not be overwhelmingly dominated by human skin / synthetic neon (> 45% non-plant with < 8% foliar)
        // 3. Must not be purely grayscale / plain text document (> 85% grayscale with < 5% foliar)
        // 4. Must not have suspicious non-crop filename unless foliar ratio is convincingly high (> 35%)

        const isBlatantNonCrop = 
          (hasSuspiciousName && foliarRatio < 0.35) ||
          (skinSyntheticRatio > 0.40 && foliarRatio < 0.10) ||
          (grayscaleRatio > 0.85 && foliarRatio < 0.05) ||
          (foliarRatio < 0.10);

        if (isBlatantNonCrop) {
          let reason = 'The uploaded image does not contain recognizable crop leaves, plant foliage, or agricultural specimens.';
          if (skinSyntheticRatio > 0.35) {
            reason = 'The uploaded image appears to be a portrait/photo with non-agricultural content. Please upload a clear photo of a crop leaf.';
          } else if (grayscaleRatio > 0.8) {
            reason = 'The uploaded image appears to be a document or screenshot. Please upload a colored photo of a crop specimen.';
          }

          resolve({
            isCrop: false,
            confidence: Math.round((1 - foliarRatio) * 100) / 100,
            reason,
            detectedFeatures,
          });
        } else {
          resolve({
            isCrop: true,
            confidence: Math.min(0.99, Math.round((0.55 + foliarRatio * 0.4) * 100) / 100),
            detectedFeatures,
          });
        }
      } catch (err) {
        // Fallback: don't block user on unexpected canvas errors
        resolve({ isCrop: true, confidence: 0.75 });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        isCrop: false,
        confidence: 0.9,
        reason: 'Unable to read image file. Please upload a valid, uncorrupted image of a crop.',
      });
    };

    img.src = objectUrl;
  });
}

/**
 * Optional Online Vision API validation if Google Gemini, Groq, or OpenAI key is available.
 * Rapidly confirms whether an image is an agricultural crop or leaf specimen.
 */
export async function verifyCropWithOnlineVision(file: File): Promise<CropValidationResult | null> {
  const geminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || ENV_CONFIG.GEMINI_API_KEY;
  if (!geminiKey || geminiKey.startsWith('gsk_') || geminiKey.startsWith('xai-')) {
    // If no direct vision endpoint, fallback to canvas classifier
    return null;
  }

  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const base64 = res.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Analyze this image. Is this an agricultural crop, crop leaf, farm plant, tree leaf, fruit, vegetable, or agricultural farm specimen? Answer in strict JSON format: {"isCrop": true/false, "confidence": 0.0 to 1.0, "reason": "brief explanation"}'
              },
              {
                inline_data: {
                  mime_type: file.type || 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 }
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          isCrop: Boolean(parsed.isCrop),
          confidence: Number(parsed.confidence) || 0.9,
          reason: parsed.reason,
        };
      }
    }
  } catch (e) {
    // Online vision check failed/timed out, gracefully fallback to canvas classifier
  }
  return null;
}

/**
 * Main Crop Verification Entry Point:
 * Runs client-side biological foliar canvas classification (and online vision if available).
 */
export async function validateCropSpecimen(file: File): Promise<CropValidationResult> {
  // 1. Run online vision check if supported and online
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    const onlineResult = await verifyCropWithOnlineVision(file);
    if (onlineResult !== null) {
      return onlineResult;
    }
  }

  // 2. High-speed biological foliar canvas analysis (works completely offline)
  return await analyzeImageFoliarContent(file);
}

/**
 * Returns localized error message across all 11 supported languages
 * when an uploaded image is rejected for not being a crop/plant specimen.
 */
export function getLocalizedCropErrorMessage(lang: string): string {
  const errorMap: Record<string, string> = {
    en: '❌ Non-crop image detected. Please change the image and upload a clear photo of a crop or plant leaf.',
    haryanvi: '❌ Yo photo fasal ya patti ka na se. Kripya photo badlo aur fasal ki patti ki saaf photo lagao.',
    hinglish: '❌ Yeh image crop ya plant leaf ki nahi hai. Kripya image change karein aur crop leaf ki clear photo upload karein.',
    hi: '❌ यह चित्र किसी फसल या पत्ती का नहीं है। कृपया चित्र बदलें और फसल या पत्ती की स्पष्ट फोटो अपलोड करें।',
    pa: '❌ ਇਹ ਫ਼ੋਟੋ ਫ਼ਸਲ ਜਾਂ ਪੱਤੇ ਦੀ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਫ਼ੋਟੋ ਬਦਲੋ ਅਤੇ ਫ਼ਸਲ ਦੇ ਪੱਤੇ ਦੀ ਸਾਫ਼ ਫ਼ੋਟੋ ਅੱਪਲੋਡ ਕਰੋ।',
    mr: '❌ हा फोटो पिकाचा किंवा पानाचा नाही. कृपया फोटो बदला आणि पिकाच्या पानाचा स्पष्ट फोटो अपलोड करा.',
    te: '❌ ఈ చిత్రం పంట లేదా ఆకుకు సంబంధించినది కాదు. దయచేసి చిత్రాన్ని మార్చి స్పష్టమైన పంట ఆకు ఫోటోను అప్‌లోడ్ చేయండి.',
    ta: '❌ இந்த படம் பயிர் அல்லது இலை தொடர்பானது அல்ல. தயவுசெய்து படத்தை மாற்றி தெளிவான பயிர் இலையின் புகைப்படத்தை பதிவேற்றவும்.',
    kn: '❌ ಈ ಚಿತ್ರವು ಬೆಳೆ ಅಥವಾ ಎಲೆಗೆ ಸಂಬಂಧಿಸಿಲ್ಲ. ದಯವಿಟ್ಟು ಚಿತ್ರವನ್ನು ಬದಲಾಯಿಸಿ ಮತ್ತು ಸ್ಪಷ್ಟವಾದ ಬೆಳೆ ಎಲೆಯ ಫೋಟೋವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.',
    gu: '❌ આ ફોટો પાક અથવા પાંદડાનો નથી. કૃપા કરીને ફોટો બદલો અને પાકના પાંદડાનો સ્પષ્ટ ફોટો અપલોડ કરો.',
    bn: '❌ এই ছবিটি কোনো ফসল বা পাতার নয়। অনুগ্রহ করে ছবি পরিবর্তন করুন এবং ফসলের পাতার স্পষ্ট ছবি আপলোড করুন।'
  };
  return errorMap[lang] || errorMap.en;
}

