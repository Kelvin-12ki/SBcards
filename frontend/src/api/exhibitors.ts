import apiClient from './client';
import type { Exhibitor } from '@/types/exhibitor';

export async function createExhibitor(eventId: string, data: Partial<Exhibitor>): Promise<Exhibitor> {
  const { data: result } = await apiClient.post<Exhibitor>(`/events/${eventId}/exhibitors`, data);
  return result;
}

export async function getEventExhibitors(eventId: string): Promise<Exhibitor[]> {
  const { data } = await apiClient.get<Exhibitor[]>(`/events/${eventId}/exhibitors`);
  return data;
}

export async function getExhibitor(id: string): Promise<Exhibitor> {
  const { data } = await apiClient.get<Exhibitor>(`/exhibitors/${id}`);
  return data;
}

export async function updateExhibitor(id: string, data: Partial<Exhibitor>): Promise<Exhibitor> {
  const { data: result } = await apiClient.patch<Exhibitor>(`/exhibitors/${id}`, data);
  return result;
}

export async function deleteExhibitor(id: string): Promise<void> {
  await apiClient.delete(`/exhibitors/${id}`);
}

export async function recordVisit(id: string): Promise<void> {
  await apiClient.post(`/exhibitors/${id}/visit`);
}

export async function recordLead(id: string): Promise<void> {
  await apiClient.post(`/exhibitors/${id}/lead`);
}
