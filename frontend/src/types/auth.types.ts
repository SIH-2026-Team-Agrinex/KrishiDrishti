export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  preferredLanguage: string;
  farmLocation?: {
    villageOrCity: string;
    state: string;
    lat: number;
    lon: number;
  };
  cropInterests?: string[];
  createdAt: string;
  isGuest?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  identifier: string; // Email or phone
  password?: string;
  rememberMe?: boolean;
}

export interface SignupData {
  name: string;
  identifier: string;
  email?: string;
  phone?: string;
  password?: string;
  preferredLanguage?: string;
  farmLocation?: string;
  cropInterests?: string[];
}
