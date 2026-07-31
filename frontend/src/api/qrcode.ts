import apiClient from './client';
import { cacheSet, cacheGet, CACHE_KEYS } from '@/utils/offlineCache';

export async function getMyQrCode(): Promise<string> {
  try {
    const { data } = await apiClient.get<{ dataUrl: string }>('/qrcode/my');
    await cacheSet(CACHE_KEYS.MY_QRCODE, data.dataUrl);
    return data.dataUrl;
  } catch (err) {
    if (!navigator.onLine) {
      const cached = await cacheGet<string>(CACHE_KEYS.MY_QRCODE);
      if (cached) return cached;
    }
    throw err;
  }
}

export async function getUserQrCode(userId: string): Promise<string> {
  const { data } = await apiClient.get<{ dataUrl: string }>(`/qrcode/${userId}`);
  return data.dataUrl;
}

export async function reportQrScan(scannedUserId: string, eventId?: string): Promise<any> {
  const { data } = await apiClient.post('/qrcode/scan', { scannedUserId, eventId });
  return data;
}

export async function getMyScans(): Promise<any[]> {
  const { data } = await apiClient.get('/qrcode/scans');
  return data;
}
