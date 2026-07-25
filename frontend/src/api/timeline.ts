import apiClient from './client';
import type { Activity } from '@/types/timeline';

interface PaginatedResponse {
  activities: Activity[];
  total: number;
  page: number;
  limit: number;
}

export async function getUserFeed(page?: number, limit?: number): Promise<Activity[]> {
  const { data } = await apiClient.get<PaginatedResponse>('/timeline/feed', { params: { page, limit } });
  return data.activities || [];
}

export async function getEventFeed(eventId: string, page?: number, limit?: number): Promise<Activity[]> {
  const { data } = await apiClient.get<PaginatedResponse>(`/timeline/event/${eventId}`, { params: { page, limit } });
  return data.activities || [];
}

export async function getConnectionFeed(page?: number, limit?: number): Promise<Activity[]> {
  const { data } = await apiClient.get<PaginatedResponse>('/timeline/connections', { params: { page, limit } });
  return data.activities || [];
}
