import { CurrentWeather, RiskLevel } from './weather.types';

export interface BoundingBox {
  x: number; // percentage 0-100
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

export interface ManualMLModelOutput {
  cropIdentified: string;
  isCropAutoDetected: boolean;
  diseaseOrCondition: string;
  scientificName?: string;
  confidenceScore: number; // e.g. 0.942
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  affectedPart: 'Leaves' | 'Stem' | 'Fruit' | 'Root' | 'Whole Plant';
  boundingBoxes?: BoundingBox[];
  heatmapAvailable?: boolean;
}

export interface PestCandidate {
  pest: string;
  confidence: number;
  scientificName?: string;
}

export interface PestDetectionOutput {
  pestIdentified: string;
  rawClass?: string;
  scientificName?: string;
  confidenceScore: number; // 0.0 - 1.0
  detected: boolean;
  status: 'INFESTATION_DETECTED' | 'NO_PEST_DETECTED' | 'POSSIBLE_ACTIVITY';
  threatLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  description: string;
  symptoms?: string[];
  managementTips?: string[];
  topCandidates?: PestCandidate[];
  boundingBoxes?: BoundingBox[];
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  urgency: 'IMMEDIATE' | 'NEXT_24_48_HOURS' | 'LONG_TERM';
  category: 'Chemical' | 'Organic' | 'Cultural / Physical' | 'Nutritional';
  dosageOrMethod?: string;
}

export interface AIAdvisoryOutput {
  executiveSummary: string;
  whyHappening: string;
  environmentalCorrelation: string;
  overallRiskLevel: RiskLevel;
  immediateActions: ActionItem[];
  treatmentAndManagement: {
    chemicalMethods: string[];
    organicBioControl: string[];
    culturalPractices: string[];
  };
  preventiveMeasures: string[];
  monitoringChecklist: string[];
  followUpWindowDays: number;
  farmerAdvisoryNote: string;
}

export interface CrossQuestionItem {
  id: string;
  question: string;
  whyAsking: string;
  options: string[];
}

export interface CrossQuestionRequest {
  cropName: string;
  reason: string;
  questions: CrossQuestionItem[];
}

export interface AnalysisInputPayload {
  images: File[] | string[];
  video?: File | string | null;
  cropName?: string;
  additionalInfo?: string;
  soilMoistureObserved?: string;
  pesticideHistory?: string;
  crossQuestionAnswers?: Record<string, string>;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
  };
  language: string;
}

export interface CropAnalysisReport {
  id: string;
  timestamp: string;
  userId?: string;
  userInputs: {
    providedCropName?: string;
    additionalInfo?: string;
    imageUrls: string[];
    videoUrl?: string;
    locationName?: string;
    crossQuestionAnswers?: Record<string, string>;
  };
  environmentalSnapshot: {
    temperature: number;
    humidity: number;
    rainProbability: number;
    condition: string;
    recordedAt: string;
  };
  // SECTION 21 Separation: ML Model Output vs AI Advisory Output
  mlModelDetection: ManualMLModelOutput;
  pestDetection?: PestDetectionOutput;
  aiAdvisory: AIAdvisoryOutput;
  language: string;
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED';
}

export type AnalysisStage = 
  | 'idle'
  | 'uploading'
  | 'environmental_sync'
  | 'ml_analyzing'
  | 'cross_questioning'
  | 'ai_reasoning'
  | 'generating_report'
  | 'completed'
  | 'failed';
