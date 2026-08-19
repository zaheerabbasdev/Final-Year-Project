'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../utils/api';

// Helpers to sync an httpOnly-style cookie so the middleware can gate routes
// without touching localStorage (which is unavailable on the server).
const AUTH_COOKIE = 'kk_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function setAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
}

interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: 'customer' | 'provider' | 'admin';
  avatar?: string;
  status: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  profile?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (formData: FormData) => Promise<any>;
  verifyOtp: (email: string, otp: string) => Promise<any>;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check local storage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setAuthCookie(); // keep cookie in sync with localStorage
      } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        clearAuthCookie();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      
      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setAuthCookie();
        setToken(data.token);
        setUser(data.user);
        
        // Redirect depending on role
        if (data.user.role === 'provider') {
          router.push('/provider/dashboard');
        } else if (data.user.role === 'customer') {
          router.push('/customer/dashboard');
        } else {
          router.push('/');
        }
      }
      return data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData: FormData) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/register', formData);
      return data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/verify-otp', { email, otp });
      return data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearAuthCookie();
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  const updateUser = useCallback((updatedUser: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    }
  }, [user]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    register,
    verifyOtp,
    logout,
    updateUser,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, token, loading, logout, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
