import { apiClient, ENV_CONFIG } from './apiClient';

export interface DistrictTelemetry {
  name: string;
  tests: number;
  top_disease: string;
  top_pest: string;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  temperature: number;
  humidity: number;
  disease_intensity: number;
  pest_intensity: number;
  overall_intensity: number;
}

export interface StateTelemetry {
  id: string; // ISO Code e.g. "IN-MH"
  name: string;
  capital: string;
  total_tests: number;
  live_tests_conducted: number;
  disease_intensity: number;
  pest_intensity: number;
  overall_intensity: number;
  dominant_disease: string;
  dominant_pest: string;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  weather: {
    temperature: number;
    humidity: number;
    rain_risk: number;
    description: string;
  };
  districts: DistrictTelemetry[];
  district_count: number;
}

export interface HeatmapAnalyticsResponse {
  status: string;
  timestamp: string;
  summary: {
    total_field_tests: number;
    verified_db_tests: number;
    total_states_monitored: number;
    critical_zones_count: number;
    high_risk_zones_count: number;
    national_avg_humidity: number;
    highest_threat_crop: string;
  };
  states: StateTelemetry[];
}

export const analyticsService = {
  async getHeatmapAnalytics(): Promise<HeatmapAnalyticsResponse> {
    try {
      const data = await apiClient<HeatmapAnalyticsResponse>(
        `${ENV_CONFIG.API_BASE_URL}/analytics/heat-map`
      );
      return data;
    } catch (err) {
      console.warn('Backend analytics endpoint unreachable, generating local fallback telemetry:', err);
      return getFallbackTelemetry();
    }
  },
};

function getFallbackTelemetry(): HeatmapAnalyticsResponse {
  return {
    status: 'fallback',
    timestamp: new Date().toISOString(),
    summary: {
      total_field_tests: 0,
      verified_db_tests: 0,
      total_states_monitored: 36,
      critical_zones_count: 0,
      high_risk_zones_count: 0,
      national_avg_humidity: 76,
      highest_threat_crop: 'Awaiting Tests',
    },
    states: [
      {
        id: 'IN-MH',
        name: 'Maharashtra',
        capital: 'Mumbai',
        total_tests: 0,
        live_tests_conducted: 0,
        disease_intensity: 0,
        pest_intensity: 0,
        overall_intensity: 0,
        dominant_disease: 'No disease reports logged',
        dominant_pest: 'No pest reports logged',
        risk_level: 'LOW',
        weather: {
          temperature: 31.4,
          humidity: 78,
          rain_risk: 45,
          description: 'Humid / Tropical Warm',
        },
        district_count: 5,
        districts: [
          { name: 'Nagpur', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 32, humidity: 72, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
          { name: 'Nashik', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 28, humidity: 80, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
          { name: 'Pune', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 29, humidity: 76, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
          { name: 'Amravati', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 33, humidity: 70, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
          { name: 'Kolhapur', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 27, humidity: 84, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
        ]
      },
      {
        id: 'IN-PB',
        name: 'Punjab',
        capital: 'Chandigarh',
        total_tests: 0,
        live_tests_conducted: 0,
        disease_intensity: 0,
        pest_intensity: 0,
        overall_intensity: 0,
        dominant_disease: 'No disease reports logged',
        dominant_pest: 'No pest reports logged',
        risk_level: 'LOW',
        weather: {
          temperature: 27.2,
          humidity: 83,
          rain_risk: 55,
          description: 'Damp Morning Dew / High Spore Spread',
        },
        district_count: 4,
        districts: [
          { name: 'Ludhiana', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 26, humidity: 85, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
          { name: 'Amritsar', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 25, humidity: 87, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
          { name: 'Bathinda', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 28, humidity: 78, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
          { name: 'Patiala', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 27, humidity: 82, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
        ]
      },
      {
        id: 'IN-HR',
        name: 'Haryana',
        capital: 'Chandigarh',
        total_tests: 0,
        live_tests_conducted: 0,
        disease_intensity: 0,
        pest_intensity: 0,
        overall_intensity: 0,
        dominant_disease: 'No disease reports logged',
        dominant_pest: 'No pest reports logged',
        risk_level: 'LOW',
        weather: {
          temperature: 29.5,
          humidity: 74,
          rain_risk: 35,
          description: 'Dry Winds / Aphid Migration Threat',
        },
        district_count: 4,
        districts: [
          { name: 'Karnal', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 28, humidity: 77, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
          { name: 'Hisar', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 31, humidity: 66, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
          { name: 'Sirsa', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 30, humidity: 69, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
          { name: 'Rohtak', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 29, humidity: 72, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
        ],
      },
      {
        id: 'IN-UP',
        name: 'Uttar Pradesh',
        capital: 'Lucknow',
        total_tests: 0,
        live_tests_conducted: 0,
        disease_intensity: 0,
        pest_intensity: 0,
        overall_intensity: 0,
        dominant_disease: 'No disease reports logged',
        dominant_pest: 'No pest reports logged',
        risk_level: 'LOW',
        weather: {
          temperature: 30.1,
          humidity: 81,
          rain_risk: 50,
          description: 'Elevated Night Moisture & Fog Threat',
        },
        district_count: 4,
        districts: [
          { name: 'Meerut', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 29, humidity: 82, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
          { name: 'Agra', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 31, humidity: 76, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
          { name: 'Varanasi', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 32, humidity: 80, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
          { name: 'Bareilly', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 28, humidity: 84, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
        ]
      },
      {
        id: 'IN-DL',
        name: 'Delhi',
        capital: 'New Delhi',
        total_tests: 0,
        live_tests_conducted: 0,
        disease_intensity: 0,
        pest_intensity: 0,
        overall_intensity: 0,
        dominant_disease: 'No disease reports logged',
        dominant_pest: 'No pest reports logged',
        risk_level: 'LOW',
        weather: {
          temperature: 29.8,
          humidity: 73,
          rain_risk: 20,
          description: 'Urban Peri-Agricultural Zone',
        },
        district_count: 3,
        districts: [
          { name: 'Central Delhi', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 30, humidity: 72, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
          { name: 'North Delhi', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 29, humidity: 75, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
          { name: 'South Delhi', tests: 0, top_disease: 'None logged', top_pest: 'None logged', risk_level: 'LOW', temperature: 30, humidity: 71, disease_intensity: 0, pest_intensity: 0, overall_intensity: 0 },
        ]
      }
    ]
  };
}
