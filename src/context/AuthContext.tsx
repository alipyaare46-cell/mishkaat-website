import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  admin: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, admin: AdminUser) => void;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mishkaat_admin_token'));
  const [isLoading, setIsLoading] = useState(true);

  const refreshMe = async () => {
    const savedToken = localStorage.getItem('mishkaat_admin_token');
    if (!savedToken) {
      setAdmin(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setAdmin(res.admin);
      setToken(savedToken);
    } catch {
      localStorage.removeItem('mishkaat_admin_token');
      setAdmin(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();
  }, []);

  const login = (newToken: string, newAdmin: AdminUser) => {
    localStorage.setItem('mishkaat_admin_token', newToken);
    setToken(newToken);
    setAdmin(newAdmin);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('mishkaat_admin_token');
      setToken(null);
      setAdmin(null);
    }
  };

  return (
    <AuthContext.Provider value={{ admin, token, isLoading, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
