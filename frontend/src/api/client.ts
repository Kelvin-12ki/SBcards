import axios from 'axios';
import { getFriendlyErrorMessage } from '@/utils/errorHandler';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5177',
  timeout: 120000, // 120s — Render free tier cold starts can take 30-60s
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Authorization Bearer token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: on 401, clear token and redirect to /login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't clear auth or redirect for auth endpoint calls
      const requestUrl = error.config?.url || '';
      if (!requestUrl.includes('/auth/verify') && !requestUrl.includes('/auth/me')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    // Attach friendly message to the error object for catch blocks to use
    (error as any).friendlyMessage = getFriendlyErrorMessage(error);
    return Promise.reject(error);
  },
);

export default apiClient;
