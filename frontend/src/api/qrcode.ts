import apiClient from './client';

export async function getMyQrCode(): Promise<string> {
  const { data } = await apiClient.get<{ dataUrl: string }>('/qrcode/my');
  return data.dataUrl;
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
