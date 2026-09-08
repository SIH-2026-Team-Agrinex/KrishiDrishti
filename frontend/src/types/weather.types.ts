export interface CurrentWeather {
  temperature: number; // Celsius
  feelsLike: number;
  humidity: number; // %
  windSpeed: number; // km/h
  windDirection: string;
  rainfall: number; // mm
  precipitationProbability: number; // %
  pressure: number; // hPa
  uvIndex: number;
  visibility: number; // km
  cloudCover: number; // %
  condition: string;
  conditionCode: string;
  icon: string;
  sunrise: string;
  sunset: string;
  lastUpdated: string;
}

export interface HourlyForecast {
  time: string;
  temp: number;
  rainChance: number;
  icon: string;
  condition: string;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  maxTemp: number;
  minTemp: number;
  rainChance: number;
  condition: string;
  icon: string;
}

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface WeatherAdvisory {
  overallRisk: RiskLevel;
  headline: string;
  sprayingRecommendation: {
    status: 'FAVORABLE' | 'CAUTION' | 'UNFAVORABLE';
    reason: string;
    optimalWindow?: string;
  };
  irrigationRecommendation: {
    status: 'DELAY' | 'RECOMMENDED' | 'NORMAL';
    reason: string;
    amount?: string;
  };
  fertilizationRecommendation: {
    status: 'PROCEED' | 'HOLD' | 'SPLIT_DOSE';
    reason: string;
  };
  diseaseRiskFactors: {
    pestRisk: RiskLevel;
    fungalRisk: RiskLevel;
    weatherRisk: RiskLevel;
    summary: string;
  };
  preventiveMeasures: string[];
}

export interface LocationInfo {
  latitude: number;
  longitude: number;
  accuracy?: number;
  city?: string;
  state?: string;
  country?: string;
  isCustomLocation?: boolean;
}
