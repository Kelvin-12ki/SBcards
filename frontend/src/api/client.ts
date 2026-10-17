import axios from 'axios';
import { getFriendlyErrorMessage } from '@/utils/errorHandler';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5177',
  timeout: 120000, // 120s — Render free tier cold starts can take 30-60s
  headers: {
    'Content-Type': 'application/json',
  },
});

const DEVICE_ID_KEY = 'sbcards_device_id';

/**
 * Stable per-browser id used by the backend's auth-event log to tell an
 * existing device from a new one. Generated once and reused; deliberately
 * absent when storage is unavailable rather than regenerated, so a locked-down
 * browser does not look like a stream of fresh devices.
 */
function getDeviceId(): string | null {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

// Request interceptor: attach Authorization Bearer token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const deviceId = getDeviceId();
    if (deviceId) {
      config.headers['x-device-id'] = deviceId;
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
