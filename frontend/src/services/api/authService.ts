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
      } catch (err: any) {
        // Always enforce authentication: if backend returned 401/400 or invalid credentials, immediately reject login
        if (err?.status || err?.message) {
          throw err;
        }
        console.warn('FastAPI backend connection error:', err);
        throw new Error('Could not connect to authentication server. Please verify backend is running.');
      }
    }

    const existing = localDb.getAuthUser();
    if (existing && !existing.isGuest && (existing.email === credentials.identifier || existing.phone === credentials.identifier)) {
      const token = `jwt_simulated_${Date.now()}`;
      localDb.setAuthUser(existing, token);
      return { user: existing, token };
    }

    throw new Error('Invalid credentials. Please verify your mobile number or email, or create a new account.');
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
      } catch (err: any) {
        if (err?.status === 400 || err?.message?.includes('already exists')) {
          throw err;
        }
        console.warn('FastAPI backend unreachable, falling back to local storage auth:', err);
      }
    }

    await new Promise((res) => setTimeout(res, 300));
    const dynamicLoc = getDynamicFarmLocation(data.farmLocation);
    const user: User = {
      id: `usr_${Date.now()}`,
      name: data.name,
      email: data.identifier.includes('@') ? data.identifier : `${data.identifier}@krishidrishti.in`,
      phone: !data.identifier.includes('@') ? data.identifier : undefined,
      preferredLanguage: data.preferredLanguage || 'en',
      farmLocation: dynamicLoc,
      cropInterests: data.cropInterests || [],
      createdAt: new Date().toISOString(),
      isGuest: false,
    };
    const token = `jwt_simulated_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localDb.setAuthUser(user, token);
    return { user, token };
  },

  async guestLogin(): Promise<{ user: User; token: string }> {
    // Each device gets its own distinct guest profile saved purely in local browser storage
    const guestUser = localDb.getOrCreateGuestProfile();
    const token = `jwt_guest_local_${Date.now()}`;
    localDb.setAuthUser(guestUser, token);
    return { user: guestUser, token };
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const current = localDb.getAuthUser();
    if (current?.isGuest) {
      const updated = localDb.updateGuestProfile(updates);
      return updated;
    }

    if (!ENV_CONFIG.USE_LOCAL_DB) {
      try {
        const response = await apiClient<{ user: User }>(`${ENV_CONFIG.AUTH_API_URL}/update`, {
          method: 'POST',
          body: JSON.stringify({ id: userId, ...updates }),
        });
        localDb.setAuthUser(response.user, localDb.getAuthToken());
        return response.user;
      } catch (err) {
        console.warn('Backend user profile update failed, updating local copy:', err);
      }
    }

    const merged = { ...current, ...updates } as User;
    localDb.setAuthUser(merged, localDb.getAuthToken());
    return merged;
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
