import apiClient from './client';
import type { Connection } from '@/types/connection';

// ────────── CONNECTION REQUESTS ──────────

export async function getIncomingRequests(): Promise<Connection[]> {
  const { data } = await apiClient.get<Connection[]>('/connections/requests/incoming');
  return data;
}

export async function getOutgoingRequests(): Promise<Connection[]> {
  const { data } = await apiClient.get<Connection[]>('/connections/requests/outgoing');
  return data;
}

export async function getIncomingRequestsCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>('/connections/requests/count');
  return data.count;
}

export async function acceptRequest(connectionId: string): Promise<Connection> {
  const { data } = await apiClient.post<Connection>(`/connections/${connectionId}/accept`);
  return data;
}

export async function declineRequest(connectionId: string): Promise<Connection> {
  const { data } = await apiClient.post<Connection>(`/connections/${connectionId}/decline`);
  return data;
}

export async function cancelRequest(connectionId: string): Promise<void> {
  await apiClient.post(`/connections/${connectionId}/cancel`);
}

// ────────── CONNECTIONS ──────────

export async function getConnections(filters?: { tag?: string; status?: string; search?: string }): Promise<Connection[]> {
  const params = new URLSearchParams();
  if (filters?.tag) params.append('tag', filters.tag);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  const { data } = await apiClient.get<Connection[]>(`/connections?${params.toString()}`);
  return data;
}

export async function getFavoriteConnections(): Promise<Connection[]> {
  const { data } = await apiClient.get<Connection[]>('/connections/favorites');
  return data;
}

export async function createConnection(data: { connectedUserId: string; connectedCardId?: string; eventId?: string; source?: string; notes?: string }): Promise<Connection> {
  const { data: result } = await apiClient.post<Connection>('/connections', data);
  return result;
}

export async function getConnection(id: string): Promise<Connection> {
  const { data } = await apiClient.get<Connection>(`/connections/${id}`);
  return data;
}

export async function updateConnection(id: string, data: Partial<Connection>): Promise<Connection> {
  const { data: result } = await apiClient.patch<Connection>(`/connections/${id}`, data);
  return result;
}

export async function deleteConnection(id: string): Promise<void> {
  await apiClient.delete(`/connections/${id}`);
}

export async function toggleFavorite(id: string): Promise<Connection> {
  const { data } = await apiClient.post<Connection>(`/connections/${id}/favorite`);
  return data;
}

export async function bulkTagConnections(connectionIds: string[], tag: string): Promise<void> {
  await apiClient.post('/connections/bulk-tag', { connectionIds, tag });
}

// ────────── QR CONNECT ──────────

export async function qrConnect(scannedUserId: string): Promise<any> {
  const { data } = await apiClient.post('/connections/qr-connect', { scannedUserId });
  return data;
}
