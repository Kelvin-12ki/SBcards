import apiClient from './client';
import type { Event, EventParticipation, EventParticipant } from '@/types/event';

export interface EventQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export async function getEvents(
  params?: EventQueryParams,
): Promise<Event[]> {
  const { data } = await apiClient.get<Event[]>('/events', { params });
  return data;
}

export async function getEvent(id: string): Promise<Event> {
  const { data } = await apiClient.get<Event>(`/events/${id}`);
  return data;
}

export async function createEvent(
  eventData: Partial<Event>,
): Promise<Event> {
  const { data } = await apiClient.post<Event>('/events', eventData);
  return data;
}

export async function updateEvent(
  id: string,
  eventData: Partial<Event>,
): Promise<Event> {
  const { data } = await apiClient.patch<Event>(`/events/${id}`, eventData);
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  await apiClient.delete(`/events/${id}`);
}

export async function joinEvent(
  id: string,
  cardId: string,
): Promise<EventParticipation> {
  const { data } = await apiClient.post<EventParticipation>(
    `/events/${id}/join`,
    { cardId },
  );
  return data;
}

export async function leaveEvent(id: string): Promise<void> {
  await apiClient.delete(`/events/${id}/leave`);
}

export async function toggleVisibility(id: string): Promise<EventParticipation> {
  const { data } = await apiClient.patch<EventParticipation>(
    `/events/${id}/visibility`,
  );
  return data;
}

export async function getAttendees(
  id: string,
): Promise<EventParticipation[]> {
  const { data } = await apiClient.get<EventParticipation[]>(
    `/events/${id}/attendees`,
  );
  return data;
}

export async function getParticipants(id: string): Promise<EventParticipant[]> {
  const { data } = await apiClient.get<EventParticipant[]>(
    `/events/${id}/participants`,
  );
  return data;
}

export async function activateEvent(id: string): Promise<Event> {
  const { data } = await apiClient.post<Event>(`/events/${id}/activate`);
  return data;
}

export async function checkParticipation(
  id: string,
): Promise<EventParticipation | null> {
  const { data } = await apiClient.get<EventParticipation | null>(
    `/events/${id}/participation`,
  );
  return data;
}
