import { CropAnalysisReport } from '../../types/analysis.types';
import { CurrentWeather, WeatherAdvisory } from '../../types/weather.types';

export const INITIAL_WEATHER_DATA: CurrentWeather = {
  temperature: 28.4,
  feelsLike: 31.2,
  humidity: 74,
  windSpeed: 9.6,
  windDirection: "SW",
  rainfall: 2.4,
  precipitationProbability: 35,
  pressure: 1008,
  uvIndex: 6,
  visibility: 8.5,
  cloudCover: 55,
  condition: "Partly Cloudy with Scattered Showers",
  conditionCode: "partly-cloudy-day",
  icon: "cloud-sun-rain",
  sunrise: "05:48 AM",
  sunset: "06:45 PM",
  lastUpdated: new Date().toISOString(),
};

export const INITIAL_WEATHER_ADVISORY: WeatherAdvisory = {
  overallRisk: "MODERATE",
  headline: "High humidity and mild warmth create favorable conditions for fungal spore spread.",
  sprayingRecommendation: {
    status: "CAUTION",
    reason: "Moderate wind speeds (9.6 km/h) are acceptable, but 35% rain chance in the evening may cause chemical wash-off. Complete spraying before 3:00 PM with a sticker/spreader adjuvant.",
    optimalWindow: "07:00 AM - 11:30 AM",
  },
  irrigationRecommendation: {
    status: "DELAY",
    reason: "Soil moisture is elevated following 2.4mm light showers. Delay next flood/drip cycle by 24 hours to prevent root hypoxia.",
    amount: "0 mm required today",
  },
  fertilizationRecommendation: {
    status: "SPLIT_DOSE",
    reason: "Avoid heavy broadcast granular urea before expected evening precipitation. Foliar application of micro-nutrients is recommended.",
  },
  diseaseRiskFactors: {
    pestRisk: "LOW",
    fungalRisk: "HIGH",
    weatherRisk: "MODERATE",
    summary: "Relative humidity > 70% combined with 26-29°C temperature triggers Phytophthora & Puccinia sporulation.",
  },
  preventiveMeasures: [
    "Ensure adequate field drainage to clear standing puddle water.",
    "Monitor underside of lower canopy leaves for initial necrotic flecks.",
    "Maintain air circulation by pruning dense vegetative suckers.",
  ],
};

export const SAMPLE_SEED_REPORTS: CropAnalysisReport[] = [
  {
    id: "rep-tomato-blight-01",
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    userInputs: {
      providedCropName: "Tomato",
      additionalInfo: "Dark brown water-soaked lesions appeared on lower leaves after continuous rains.",
      imageUrls: [
        "https://images.unsplash.com/photo-1592417817098-8f3d6ef23a65?w=800&auto=format&fit=crop&q=80"
      ],
      locationName: "Local Farm Field - Plot A",
    },
    environmentalSnapshot: {
      temperature: 26.2,
      humidity: 82,
      rainProbability: 60,
      condition: "Overcast with Intermittent Rain",
      recordedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    // SEPARATION: Manual ML Model Output
    mlModelDetection: {
      cropIdentified: "Tomato (Solanum lycopersicum)",
      isCropAutoDetected: false,
      diseaseOrCondition: "Late Blight",
      scientificName: "Phytophthora infestans",
      confidenceScore: 0.964,
      severity: "Severe",
      affectedPart: "Leaves",
      boundingBoxes: [
        { x: 18, y: 22, width: 34, height: 42, label: "Necrotic Lesion (96%)", confidence: 0.96 },
        { x: 58, y: 44, width: 28, height: 32, label: "Sporangia Halo (94%)", confidence: 0.94 }
      ],
      heatmapAvailable: true,
    },
    pestDetection: {
      pestIdentified: "Cotton Whitefly",
      rawClass: "cotton_whitefly",
      scientificName: "Bemisia tabaci",
      confidenceScore: 0.884,
      detected: true,
      status: "INFESTATION_DETECTED",
      threatLevel: "Moderate",
      description: "Whitefly nymphs and adults feeding on leaf phloem sap, secreting sticky honeydew and vectoring viral pathogens.",
      symptoms: ["Chlorotic yellow specks on leaf surfaces", "Slight leaf curling", "Honeydew droplet presence on lower leaves"],
      managementTips: ["Install yellow sticky traps @ 10-12 per acre", "Spray 5% Neem Seed Kernel Extract (NSKE)", "Diafenthiuron 50% WP @ 1.25g/L if population exceeds ETL"],
      topCandidates: [
        { pest: "Cotton Whitefly", confidence: 0.884, scientificName: "Bemisia tabaci" },
        { pest: "Aphids", confidence: 0.082, scientificName: "Aphis gossypii" },
        { pest: "Mites", confidence: 0.024, scientificName: "Tetranychus urticae" }
      ],
      boundingBoxes: [
        { x: 42, y: 36, width: 26, height: 26, label: "Whitefly Colony (88%)", confidence: 0.884 }
      ]
    },
    // SEPARATION: AI Advisory Layer
    aiAdvisory: {
      executiveSummary: "Confirmed Late Blight infection at active sporulation stage. High humidity (82%) is accelerating lesion expansion across leaf petioles.",
      whyHappening: "Phytophthora infestans zoospores germinate rapidly in cool, saturated microclimates (18-24°C with leaf wetness > 6 hours).",
      environmentalCorrelation: "Recent rainfall and 82% humidity provided optimal free moisture for secondary spore dispersal via wind-driven rain droplets.",
      overallRiskLevel: "CRITICAL",
      immediateActions: [
        {
          id: "act-1",
          title: "Foliar Fungicide Application",
          description: "Spray Cymoxanil 8% + Mancozeb 64% WP @ 2.5 g/L or Metalaxyl-M + Mancozeb @ 2 g/L targeting both upper and lower leaf surfaces.",
          urgency: "IMMEDIATE",
          category: "Chemical",
          dosageOrMethod: "2.5 g per Litre of water (500L spray volume per hectare)",
        },
        {
          id: "act-2",
          title: "Infected Foliage Rogueing",
          description: "Carefully prune severely blighted lower leaves into sealed bags and bury outside the field boundary. Do not compost.",
          urgency: "IMMEDIATE",
          category: "Cultural / Physical",
        },
        {
          id: "act-3",
          title: "Halt Overhead Sprinklers",
          description: "Switch immediately to root-zone drip irrigation to minimize canopy moisture duration.",
          urgency: "NEXT_24_48_HOURS",
          category: "Cultural / Physical",
        }
      ],
      treatmentAndManagement: {
        chemicalMethods: [
          "Curative: Dimethomorph 50% WP @ 1 g/L or Famoxadone + Cymoxanil @ 1 g/L.",
          "Preventive buffer: Mancozeb 75% WP @ 2 g/L on adjacent uninfected plots."
        ],
        organicBioControl: [
          "Apply Trichoderma viride / harzianum @ 5g/L foliar spray during evening hours.",
          "Copper oxychloride 50% WP @ 2.5 g/L for protective organic barrier."
        ],
        culturalPractices: [
          "Widen row spacing to facilitate sun penetration and rapid leaf drying.",
          "Install straw or plastic mulch to inhibit soil-borne zoospore splash."
        ]
      },
      preventiveMeasures: [
        "Use certified blight-resistant hybrid cultivars in upcoming planting seasons.",
        "Implement 3-year crop rotation avoiding Solanaceous crops (Potato, Brinjal, Chilli)."
      ],
      monitoringChecklist: [
        "Inspect stems for dark oily girdling lesions every 48 hours.",
        "Check adjacent row tomatoes within 10-meter radius.",
        "Assess spray efficacy after 5 days for lesion margin desiccation."
      ],
      followUpWindowDays: 5,
      farmerAdvisoryNote: "Act immediately within 24 hours. If left untreated under ongoing cloudy conditions, late blight can cause 80-100% crop loss in 7 to 10 days.",
    },
    language: "en",
    status: "COMPLETED",
  },
  {
    id: "rep-wheat-rust-02",
    timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
    userInputs: {
      providedCropName: "Wheat",
      additionalInfo: "Yellow powdery stripes along leaf veins noticed across 2 acres.",
      imageUrls: [
        "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80"
      ],
      locationName: "Local Farm Field - Plot B",
    },
    environmentalSnapshot: {
      temperature: 21.5,
      humidity: 78,
      rainProbability: 20,
      condition: "Morning Mist and Cool Breeze",
      recordedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    mlModelDetection: {
      cropIdentified: "Wheat (Triticum aestivum)",
      isCropAutoDetected: true,
      diseaseOrCondition: "Stripe / Yellow Rust",
      scientificName: "Puccinia striiformis",
      confidenceScore: 0.981,
      severity: "Moderate",
      affectedPart: "Leaves",
      boundingBoxes: [
        { x: 30, y: 20, width: 40, height: 60, label: "Pustular Stripe (98%)", confidence: 0.98 }
      ],
      heatmapAvailable: true,
    },
    pestDetection: {
      pestIdentified: "No Active Pest Detected",
      scientificName: "Clean Foliage / No Parasitic Entomology",
      confidenceScore: 0.956,
      detected: false,
      status: "NO_PEST_DETECTED",
      threatLevel: "Low",
      description: "Neural pest detection model evaluated specimen across 18 target pest classes and found clean vegetative tissue with zero active insect infestation.",
      symptoms: ["No insect boreholes, feeding marks, or frass deposits", "Normal vegetative tissue intact"],
      managementTips: ["Continue weekly field scouting for early aphid appearance during earhead emergence", "Conserve predatory coccinellid ladybugs"],
      topCandidates: [
        { pest: "No Pest Detected", confidence: 0.956, scientificName: "Clean Plant Foliage" },
        { pest: "Wheat Aphid", confidence: 0.032, scientificName: "Rhopalosiphum padi" },
        { pest: "Wheat Mite", confidence: 0.012, scientificName: "Petrobia latens" }
      ],
      boundingBoxes: []
    },
    aiAdvisory: {
      executiveSummary: "Early-stage Yellow Stripe Rust detected on wheat flag leaves. Favorable cool temperatures (15-22°C) make rapid intervention critical.",
      whyHappening: "Windborne urediniospores travel from foot-hill pockets and germinate during morning dew/mist periods.",
      environmentalCorrelation: "Current 21.5°C temperature and high morning relative humidity (78%) are the classic epidemiological threshold for Puccinia proliferation.",
      overallRiskLevel: "HIGH",
      immediateActions: [
        {
          id: "act-w1",
          title: "Systemic Triazole Spray",
          description: "Spray Propiconazole 25% EC (Tilt) @ 1 ml/L or Tebuconazole 25.9% EC @ 1 ml/L in 200 Litres of water per acre.",
          urgency: "IMMEDIATE",
          category: "Chemical",
          dosageOrMethod: "200 ml Propiconazole dissolved in 200L water per acre",
        },
        {
          id: "act-w2",
          title: "Stop Excessive Nitrogen Top-Dressing",
          description: "Avoid surplus urea fertilizer which creates soft succulent tissue vulnerable to rust penetration.",
          urgency: "IMMEDIATE",
          category: "Nutritional",
        }
      ],
      treatmentAndManagement: {
        chemicalMethods: [
          "Propiconazole 25% EC @ 1 ml/L or Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L."
        ],
        organicBioControl: [
          "Pseudomonas fluorescens 0.5% WP foliar spray @ 5g/L."
        ],
        culturalPractices: [
          "Avoid late sowing of wheat in yellow-rust prone agro-climatic zones."
        ]
      },
      preventiveMeasures: [
        "Sow certified rust-resistant wheat varieties (HD-2967, HD-3086, DBW-187, DBW-222).",
        "Eradicate wild alternate weed hosts along canal bunds."
      ],
      monitoringChecklist: [
        "Check flag leaf and second leaf for fresh yellow powdery lines.",
        "Perform field surveillance in grid patterns every 3 days."
      ],
      followUpWindowDays: 7,
      farmerAdvisoryNote: "One timely spray of Propiconazole protects the flag leaf which contributes up to 50% of the final grain filling weight.",
    },
    language: "en",
    status: "COMPLETED",
  }
];

export const DEMO_PREDICTIVE_MODELS_DB = [
  {
    crop: "Tomato",
    conditions: [
      {
        name: "Late Blight",
        scientific: "Phytophthora infestans",
        confidenceRange: [0.92, 0.98],
        severity: "Severe" as const,
        affectedPart: "Leaves" as const,
        chemical: "Cymoxanil 8% + Mancozeb 64% WP @ 2.5g/L or Dimethomorph 50% WP @ 1g/L",
        organic: "Trichoderma viride @ 5g/L + Copper Oxychloride 50% WP @ 2.5g/L",
        immediate: "Spray systemic fungicide within 24 hours, prune necrotic lower branches, avoid overhead water."
      },
      {
        name: "Early Blight",
        scientific: "Alternaria solani",
        confidenceRange: [0.89, 0.96],
        severity: "Moderate" as const,
        affectedPart: "Leaves" as const,
        chemical: "Chlorothalonil 75% WP @ 2g/L or Azoxystrobin 23% SC @ 1ml/L",
        organic: "Neem oil 10,000 ppm @ 3ml/L + Bacillus subtilis @ 5g/L",
        immediate: "Remove concentric-ring infected leaves, apply protective spray."
      },
      {
        name: "Healthy Plant",
        scientific: "Optimal Vigour",
        confidenceRange: [0.96, 0.99],
        severity: "Mild" as const,
        affectedPart: "Whole Plant" as const,
        chemical: "No chemical required. Maintain balanced NPK 19:19:19 fertigation.",
        organic: "Vermicompost tea + Seaweed extract foliar spray for boosted immunity.",
        immediate: "Continue routine monitoring and irrigation scheduling."
      }
    ]
  },
  {
    crop: "Rice / Paddy",
    conditions: [
      {
        name: "Rice Blast",
        scientific: "Magnaporthe oryzae",
        confidenceRange: [0.91, 0.97],
        severity: "Severe" as const,
        affectedPart: "Leaves" as const,
        chemical: "Tricyclazole 75% WP @ 0.6g/L or Isoprothiolane 40% EC @ 1.5ml/L",
        organic: "Pseudomonas fluorescens @ 10g/L seedling dip & foliar spray",
        immediate: "Drain excess standing water temporarily, apply Tricyclazole immediately."
      },
      {
        name: "Bacterial Leaf Blight",
        scientific: "Xanthomonas oryzae pv. oryzae",
        confidenceRange: [0.88, 0.95],
        severity: "Severe" as const,
        affectedPart: "Leaves" as const,
        chemical: "Streptocycline 90:10 @ 6g/acre + Copper Oxychloride @ 500g/acre",
        organic: "Fresh cow dung supernatant extract spray (20%)",
        immediate: "Reduce nitrogen application, avoid water flow from infected to healthy plots."
      }
    ]
  },
  {
    crop: "Cotton",
    conditions: [
      {
        name: "Cotton Leaf Curl Virus (CLCuV)",
        scientific: "Begomovirus / Whitefly vector",
        confidenceRange: [0.93, 0.98],
        severity: "Critical" as const,
        affectedPart: "Leaves" as const,
        chemical: "Control vector Whitefly using Diafenthiuron 50% WP @ 1.2g/L or Pyriproxyfen 10% EC @ 2ml/L",
        organic: "Yellow sticky traps (15-20 traps/acre) + Neem seed kernel extract (5%)",
        immediate: "Install yellow traps immediately to trap whiteflies and apply vector control spray."
      }
    ]
  },
  {
    crop: "Wheat",
    conditions: [
      {
        name: "Yellow / Stripe Rust",
        scientific: "Puccinia striiformis",
        confidenceRange: [0.94, 0.99],
        severity: "Moderate" as const,
        affectedPart: "Leaves" as const,
        chemical: "Propiconazole 25% EC (Tilt) @ 1ml/L or Tebuconazole 25.9% EC @ 1ml/L",
        organic: "Bio-agent Pseudomonas fluorescens 0.5% WP @ 5g/L",
        immediate: "Apply Propiconazole within 48 hours to protect flag leaf photosynthesis."
      }
    ]
  }
];
