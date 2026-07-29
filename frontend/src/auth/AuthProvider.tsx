import React, { createContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { auth } from '@/utils/firebase';
import apiClient from '@/api/client';
import * as authApi from '@/api/auth';
import type { User } from '@/types/user';

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps { children: ReactNode; }

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        if (!cancelled) { setToken(storedToken); try { setUser(JSON.parse(storedUser!)); } catch {} }
        // Refresh user from API BEFORE marking loading complete (picks up role/status changes)
        try {
          const freshUser = await authApi.getCurrentUser();
          if (!cancelled) {
            localStorage.setItem('user', JSON.stringify(freshUser));
            setUser(freshUser);
          }
        } catch { /* token may be expired, use cached user */ }
        if (!cancelled) setLoading(false);
        return;
      }

      if (auth) {
        try {
          const { onAuthStateChanged } = await import('firebase/auth');
          const unsub = onAuthStateChanged(auth, async (fbUser: any) => {
            if (fbUser) {
              // Skip if we already have a valid token (user just logged in via login())
              const existingToken = localStorage.getItem('accessToken');
              if (existingToken) {
                if (!cancelled) setLoading(false);
                return;
              }
              try {
                const { getIdToken } = await import('firebase/auth');
                const idToken = await getIdToken(fbUser);
                const { data } = await apiClient.post<{ accessToken: string; user: User }>('/auth/verify', { idToken });
                if (!cancelled) {
                  localStorage.setItem('accessToken', data.accessToken);
                  localStorage.setItem('user', JSON.stringify(data.user));
                  setToken(data.accessToken);
                  setUser(data.user);
                }
              } catch { /* backend not reachable or token invalid */ }
            }
            if (!cancelled) setLoading(false);
          });
          unsubRef.current = unsub;
          return;
        } catch { /* Firebase module failed */ }
      }

      if (!cancelled) setLoading(false);
    }

    init();
    return () => { cancelled = true; if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; } };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await authApi.login(email, password);
    localStorage.setItem('accessToken', r.accessToken);
    localStorage.setItem('user', JSON.stringify(r.user));
    setUser(r.user);
    setToken(r.accessToken);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const r = await authApi.loginWithGoogle();
    localStorage.setItem('accessToken', r.accessToken);
    localStorage.setItem('user', JSON.stringify(r.user));
    setUser(r.user);
    setToken(r.accessToken);
  }, []);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    const r = await authApi.register(email, password, displayName);
    localStorage.setItem('accessToken', r.accessToken);
    localStorage.setItem('user', JSON.stringify(r.user));
    setUser(r.user);
    setToken(r.accessToken);
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null); setToken(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authApi.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(freshUser));
      setUser(freshUser);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
