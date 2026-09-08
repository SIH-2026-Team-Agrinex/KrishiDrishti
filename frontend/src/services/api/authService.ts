import { User, LoginCredentials, SignupData } from '../../types/auth.types';
import { localDb } from '../db/localDb';
import { apiClient, ENV_CONFIG } from './apiClient';

export function getDynamicFarmLocation(customCity?: string) {
  const saved = localDb.getLocation();
  const city = customCity?.trim() || (saved?.city && saved.city !== 'Real-time Field' ? saved.city : 'Current Location');
  const state = saved?.state || 'India';
  const lat = saved?.latitude || 20.5937;
  const lon = saved?.longitude || 78.9629;
  return {
    villageOrCity: city,
    state,
    lat,
    lon,
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    if (!ENV_CONFIG.USE_LOCAL_DB) {
      try {
        const response = await apiClient<{ user: User; token: string }>(`${ENV_CONFIG.AUTH_API_URL}/login`, {
          method: 'POST',
          body: JSON.stringify(credentials),
        });
        localDb.setAuthUser(response.user, response.token);
        return response;
      } catch (err) {
        console.warn('FastAPI backend unreachable, falling back to LocalDB auth mode.', err);
      }
    }

    // Local DB / Simulated auth response with dynamic location
    await new Promise((res) => setTimeout(res, 600));
    const dynamicLoc = getDynamicFarmLocation();
    const user: User = {
      id: 'usr-farmer-2026',
      name: credentials.identifier.split('@')[0] || 'Farmer User',
      email: credentials.identifier.includes('@') ? credentials.identifier : `${credentials.identifier}@krishidrishti.in`,
      phone: '+91 98765 43210',
      preferredLanguage: 'en',
      farmLocation: dynamicLoc,
      cropInterests: ['Wheat', 'Rice / Paddy', 'Mustard', 'Cotton'],
      createdAt: new Date().toISOString(),
    };
    const token = `jwt_simulated_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localDb.setAuthUser(user, token);
    return { user, token };
  },

  async signup(data: SignupData): Promise<{ user: User; token: string }> {
    if (!ENV_CONFIG.USE_LOCAL_DB) {
      try {
        const response = await apiClient<{ user: User; token: string }>(`${ENV_CONFIG.AUTH_API_URL}/signup`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
        localDb.setAuthUser(response.user, response.token);
        return response;
      } catch (err) {
        console.warn('FastAPI backend unreachable, falling back to LocalDB auth mode.', err);
      }
    }

    await new Promise((res) => setTimeout(res, 700));
    const dynamicLoc = getDynamicFarmLocation(data.farmLocation);
    const user: User = {
      id: `usr_${Date.now()}`,
      name: data.name,
      email: data.identifier.includes('@') ? data.identifier : `${data.identifier}@krishidrishti.in`,
      phone: !data.identifier.includes('@') ? data.identifier : undefined,
      preferredLanguage: data.preferredLanguage || 'en',
      farmLocation: dynamicLoc,
      cropInterests: data.cropInterests || ['Wheat', 'Rice / Paddy'],
      createdAt: new Date().toISOString(),
    };
    const token = `jwt_simulated_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localDb.setAuthUser(user, token);
    return { user, token };
  },

  async guestLogin(): Promise<{ user: User; token: string }> {
    await new Promise((res) => setTimeout(res, 400));
    const token = `jwt_guest_demo_${Date.now()}`;
    const dynamicLoc = getDynamicFarmLocation();
    const guestUser: User = {
      id: 'usr-guest-2026',
      name: 'Guest Farmer',
      email: 'guest.farmer@krishidrishti.in',
      phone: '+91 98765 43210',
      preferredLanguage: 'en',
      farmLocation: dynamicLoc,
      cropInterests: ['Wheat', 'Rice / Paddy', 'Mustard'],
      createdAt: new Date().toISOString(),
    };
    localDb.setAuthUser(guestUser, token);
    return { user: guestUser, token };
  },

  async logout(): Promise<void> {
    localDb.setAuthUser(null, null);
  },

  getCurrentUser(): User | null {
    return localDb.getAuthUser();
  },

  getToken(): string | null {
    return localDb.getAuthToken();
  }
};
