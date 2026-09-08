import { localDb } from '../db/localDb';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const baseUrl = rawBaseUrl.replace(/\/+$/, '');

export const ENV_CONFIG = {
  USE_LOCAL_DB: import.meta.env.VITE_USE_LOCAL_DB === 'true',
  API_BASE_URL: baseUrl,
  AUTH_API_URL: import.meta.env.VITE_AUTH_API_URL || `${baseUrl}/auth`,
  WEATHER_API_URL: import.meta.env.VITE_WEATHER_API_URL || `${baseUrl}/weather`,
  AI_ADVISORY_API_URL: import.meta.env.VITE_AI_ADVISORY_API_URL || `${baseUrl}/advisory`,
  AI_CHAT_API_URL: import.meta.env.VITE_AI_CHAT_API_URL || `${baseUrl}/chat`,
  CROP_ANALYSIS_API_URL: import.meta.env.VITE_CROP_ANALYSIS_API_URL || `${baseUrl}/crop-analysis`,
  HISTORY_API_URL: import.meta.env.VITE_HISTORY_API_URL || `${baseUrl}/history`,
  ENABLE_LIVE_OPEN_METEO: import.meta.env.VITE_ENABLE_LIVE_OPEN_METEO_FALLBACK !== 'false',
  // Direct Online Model API Keys
  GEMINI_API_KEY: (import.meta.env.VITE_GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, ''),
  GROQ_API_KEY: (import.meta.env.VITE_GROQ_API_KEY || '').trim().replace(/^["']|["']$/g, ''),
  GROK_API_KEY: (import.meta.env.VITE_GROK_API_KEY || import.meta.env.VITE_XAI_API_KEY || '').trim().replace(/^["']|["']$/g, ''),
  OPENAI_API_KEY: (import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_AI_API_KEY || '').trim().replace(/^["']|["']$/g, ''),
};

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options;
  const token = localDb.getAuthToken();

  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += (url.includes('?') ? '&' : '?') + searchParams.toString();
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // If body is FormData, don't set Content-Type header so browser sets boundary automatically
  if (customConfig.body instanceof FormData) {
    delete defaultHeaders['Content-Type'];
  }

  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorBody.message || `HTTP Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
