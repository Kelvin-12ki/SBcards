import apiClient from './client';
import type { Session } from '@/types/session';

export async function createSession(eventId: string, data: Partial<Session>): Promise<Session> {
  const { data: result } = await apiClient.post<Session>(`/events/${eventId}/sessions`, data);
  return result;
}

export async function getEventSessions(eventId: string): Promise<Session[]> {
  const { data } = await apiClient.get<Session[]>(`/events/${eventId}/sessions`);
  return data;
}

export async function getSession(id: string): Promise<Session> {
  const { data } = await apiClient.get<Session>(`/sessions/${id}`);
  return data;
}

export async function updateSession(id: string, data: Partial<Session>): Promise<Session> {
  const { data: result } = await apiClient.patch<Session>(`/sessions/${id}`, data);
  return result;
}

export async function deleteSession(id: string): Promise<void> {
  await apiClient.delete(`/sessions/${id}`);
}

export async function checkinSession(id: string): Promise<void> {
  await apiClient.post(`/sessions/${id}/checkin`);
}

export async function getSessionAttendees(id: string): Promise<any[]> {
  const { data } = await apiClient.get(`/sessions/${id}/attendees`);
  return data;
}

export async function getEventSchedule(eventId: string): Promise<Session[]> {
  const { data } = await apiClient.get<Session[]>(`/events/${eventId}/schedule`);
  return data;
}
