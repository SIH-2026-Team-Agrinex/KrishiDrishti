import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, LoginCredentials, SignupData } from '../types/auth.types';
import { authService } from '../services/api/authService';

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
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
  };

  const updateUserPreferences = (updated: Partial<User>) => {
    if (!user) return;
    const newUser = { ...user, ...updated };
    setUser(newUser);
    if (token) {
      authService.login({ identifier: newUser.email }).catch(() => {});
      // Also directly persist to localDb so modified user state is never overwritten
      import('../services/db/localDb').then(({ localDb }) => {
        localDb.setAuthUser(newUser, token);
      });
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
