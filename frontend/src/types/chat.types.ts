export interface VisualCardData {
  type: 'weather_spray' | 'crop_disease' | 'treatment_flowchart' | 'farm_map';
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'danger' | 'info';
  };
  metrics?: Array<{
    label: string;
    value: string;
    icon?: string;
    alert?: boolean;
  }>;
  steps?: Array<{
    step: number;
    title: string;
    desc: string;
    type?: 'sanitation' | 'organic' | 'chemical' | 'monitoring';
  }>;
  diseaseInfo?: {
    cropName: string;
    diseaseName: string;
    severity: 'Low' | 'Moderate' | 'High' | 'Critical';
    symptoms: string[];
    immediateAction: string;
    imageType?: 'blight' | 'rust' | 'mildew' | 'pest' | 'general';
  };
  mapInfo?: {
    locationName: string;
    coordinates: string;
    fieldZone: string;
    radiusKm: number;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  suggestions?: string[];
  attachedContext?: {
    cropName?: string;
    weatherSnippet?: string;
  };
  visualCard?: VisualCardData;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  lastActive: string;
  language?: string;
}

