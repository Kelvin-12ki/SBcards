import apiClient from './client';
import type { EventAnalytics } from '@/types/analytics';

export async function getEventAnalytics(eventId: string): Promise<EventAnalytics> {
  const { data } = await apiClient.get<EventAnalytics>(`/events/${eventId}/analytics`);
  return data;
}
