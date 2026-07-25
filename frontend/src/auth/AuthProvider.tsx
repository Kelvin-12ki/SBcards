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
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  demoLogin: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps { children: ReactNode; }

const DEMO_USER: User = {
  id: 'demo-user-id',
  firebaseUid: 'demo-uid',
  email: 'demo@sbcards.app',
  displayName: 'Demo User',
  avatarUrl: '',
  createdAt: new Date().toISOString(),
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const isDemo = localStorage.getItem('demoMode') === 'true';
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (isDemo || (storedToken && storedUser)) {
        if (isDemo) {
          // Try to get a real JWT from the backend for demo mode
          try {
            const { data } = await apiClient.post<{ accessToken: string; user: User }>('/auth/demo-login');
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('accessToken', data.accessToken);
            if (!cancelled) { setToken(data.accessToken); setUser(data.user); }
          } catch {
            // Fallback to local demo user
            localStorage.setItem('user', JSON.stringify(DEMO_USER));
            localStorage.setItem('accessToken', 'demo-token');
            if (!cancelled) { setToken('demo-token'); setUser(DEMO_USER); }
          }
        } else {
          if (!cancelled) { setToken(storedToken); try { setUser(JSON.parse(storedUser!)); } catch {} }
        }
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
              if (existingToken && existingToken !== 'demo-token') {
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

  const demoLogin = useCallback(async () => {
    try {
      const { data } = await apiClient.post<{ accessToken: string; user: User }>('/auth/demo-login');
      localStorage.setItem('demoMode', 'true');
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('accessToken', data.accessToken);
      setToken(data.accessToken);
      setUser(data.user);
    } catch (err) {
      console.error('Demo login failed:', err);
      // Fallback: use local demo user with no backend access
      localStorage.setItem('demoMode', 'true');
      localStorage.setItem('user', JSON.stringify(DEMO_USER));
      localStorage.setItem('accessToken', 'demo-token');
      setToken('demo-token');
      setUser(DEMO_USER);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await authApi.login(email, password);
    localStorage.setItem('accessToken', r.accessToken);
    localStorage.setItem('user', JSON.stringify(r.user));
    setUser(r.user);
    setToken(r.accessToken);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const r = await authApi.register(email, password);
    localStorage.setItem('accessToken', r.accessToken);
    localStorage.setItem('user', JSON.stringify(r.user));
    setUser(r.user);
    setToken(r.accessToken);
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('demoMode');
    setUser(null); setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
