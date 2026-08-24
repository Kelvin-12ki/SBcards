import apiClient from './client';
import type {
  EventTable,
  CheckInRecord,
  CheckInResult,
  TableAttendee,
  MyAssignment,
  SetupTablesPayload,
} from '@/types/table';

// ── Table setup (organizer) ──

export async function setupTables(
  eventId: string,
  payload: SetupTablesPayload,
): Promise<EventTable[]> {
  const { data } = await apiClient.patch<EventTable[]>(
    `/events/${eventId}/tables`,
    payload,
  );
  return data;
}

export async function getEventTables(eventId: string): Promise<EventTable[]> {
  const { data } = await apiClient.get<EventTable[]>(
    `/events/${eventId}/tables`,
  );
  return data;
}

// ── Check-in ──

/** Check yourself in. Pass a userId to check someone else in (organizer only). */
export async function checkIn(
  eventId: string,
  userId?: string,
  method?: 'qr' | 'manual',
): Promise<CheckInResult> {
  const { data } = await apiClient.post<CheckInResult>(
    `/events/${eventId}/check-in`,
    { userId, method },
  );
  return data;
}

export async function checkOut(
  eventId: string,
  userId: string,
): Promise<void> {
  await apiClient.delete(`/events/${eventId}/check-in/${userId}`);
}

export async function getCheckIns(eventId: string): Promise<CheckInRecord[]> {
  const { data } = await apiClient.get<CheckInRecord[]>(
    `/events/${eventId}/check-ins`,
  );
  return data;
}

/**
 * Checked-in attendees with profile detail. Note the path: the backend's
 * `/events/:id/attendees` belongs to the events module (visible participants),
 * so the table-matching view lives at `table-attendees`.
 */
export async function getTableAttendees(
  eventId: string,
): Promise<TableAttendee[]> {
  const { data } = await apiClient.get<TableAttendee[]>(
    `/events/${eventId}/table-attendees`,
  );
  return data;
}

// ── Assignment ──

export async function assignTables(eventId: string): Promise<EventTable[]> {
  const { data } = await apiClient.post<EventTable[]>(
    `/events/${eventId}/assign-tables`,
  );
  return data;
}

export async function rotateTables(eventId: string): Promise<EventTable[]> {
  const { data } = await apiClient.post<EventTable[]>(
    `/events/${eventId}/rotate`,
  );
  return data;
}

export async function getMyAssignment(
  eventId: string,
): Promise<MyAssignment | null> {
  const { data } = await apiClient.get<MyAssignment | null>(
    `/events/${eventId}/my-assignment`,
  );
  return data;
}
