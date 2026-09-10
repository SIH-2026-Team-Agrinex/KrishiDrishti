import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, LoginCredentials, SignupData } from '../types/auth.types';
import { authService } from '../services/api/authService';
import { localDb } from '../services/db/localDb';
import { getRealTimeTestLocation } from './LocationContext';
import { weatherService } from '../services/api/weatherService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserPreferences: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    const storedToken = authService.getToken();
    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const res = await authService.login(credentials);
      setUser(res.user);
      setToken(res.token);
      // Refresh location & pre-fetch weather upon login
      try {
        const freshLoc = await getRealTimeTestLocation();
        await weatherService.getCurrentWeather(freshLoc);
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData) => {
    setIsLoading(true);
    try {
      const res = await authService.signup(data);
      setUser(res.user);
      setToken(res.token);
      try {
        const freshLoc = await getRealTimeTestLocation();
        await weatherService.getCurrentWeather(freshLoc);
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  const guestLogin = async () => {
    setIsLoading(true);
    try {
      const res = await authService.guestLogin();
      setUser(res.user);
      setToken(res.token);
      try {
        const freshLoc = await getRealTimeTestLocation();
        await weatherService.getCurrentWeather(freshLoc);
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
  };

  const updateUserPreferences = async (updated: Partial<User>) => {
    if (!user) return;
    try {
      const newUser = await authService.updateUser(user.id, updated);
      setUser(newUser);
    } catch {
      const newUser = { ...user, ...updated };
      setUser(newUser);
      localDb.setAuthUser(newUser, token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        signup,
        guestLogin,
        logout,
        updateUserPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => {},
      signup: async () => {},
      guestLogin: () => {},
      logout: () => {},
      updateUserPreferences: () => {},
    };
  }
  return context;
};
