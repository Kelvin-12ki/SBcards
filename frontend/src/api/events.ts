import apiClient from './client';
import type {
  Event,
  EventParticipation,
  EventParticipant,
  EventSuggestionsResponse,
} from '@/types/event';
import { normaliseEventStatus } from '@/utils/eventStatus';

/**
 * The API stores `status` as a free string. Coerce it once at the network
 * boundary so no screen has to defend against an unknown value.
 */
const withStatus = (event: Event): Event => ({
  ...event,
  status: normaliseEventStatus(event.status),
});

const withStatuses = (events: Event[]): Event[] => events.map(withStatus);

export interface ExternalEvent {
  title: string;
  imageUrl: string;
  venue: string;
  dateString: string;
  parsedDate: string | null;
  description: string;
  eventUrl: string;
  source: string;
}

export async function getExternalEvents(): Promise<ExternalEvent[]> {
  try {
    const { data } = await apiClient.get<ExternalEvent[]>('/events/external/nairobi-guide');
    return data;
  } catch {
    return [];
  }
}

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
  return withStatuses(data);
}

export async function getEvent(id: string): Promise<Event> {
  const { data } = await apiClient.get<Event>(`/events/${id}`);
  return withStatus(data);
}

export async function createEvent(
  eventData: Partial<Event>,
): Promise<Event> {
  const { data } = await apiClient.post<Event>('/events', eventData);
  return withStatus(data);
}

export async function updateEvent(
  id: string,
  eventData: Partial<Event>,
): Promise<Event> {
  const { data } = await apiClient.patch<Event>(`/events/${id}`, eventData);
  return withStatus(data);
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

/** upcoming/draft -> active. Creator only; also sets `isActive`. */
export async function activateEvent(id: string): Promise<Event> {
  const { data } = await apiClient.post<Event>(`/events/${id}/activate`);
  return withStatus(data);
}

/** active -> completed. Creator only; clears `isActive`. */
export async function completeEvent(id: string): Promise<Event> {
  const { data } = await apiClient.post<Event>(`/events/${id}/complete`);
  return withStatus(data);
}

/** upcoming/draft/active -> cancelled. Creator only; clears `isActive`. */
export async function cancelEvent(id: string): Promise<Event> {
  const { data } = await apiClient.post<Event>(`/events/${id}/cancel`);
  return withStatus(data);
}

export async function checkParticipation(
  id: string,
): Promise<EventParticipation | null> {
  const { data } = await apiClient.get<EventParticipation | null>(
    `/events/${id}/participation`,
  );
  return data;
}

/**
 * People at this event the caller can still connect with - i.e. everyone who
 * joined and is visible, minus the caller and anyone they already have a
 * connection record with. Contact details are never returned.
 */
export async function getEventSuggestions(
  id: string,
): Promise<EventSuggestionsResponse> {
  const { data } = await apiClient.get<EventSuggestionsResponse>(
    `/events/${id}/suggestions`,
  );
  return data;
}
