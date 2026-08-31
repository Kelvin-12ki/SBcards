import apiClient from './client';
import type { Match } from '@/types/match';
import type { Recommendation, WhyRecommendation } from '@/types/recommendation';

export async function runMatching(eventId: string): Promise<Match[]> {
  const { data } = await apiClient.post<Match[]>(
    `/events/${eventId}/match`,
  );
  return data;
}

export async function getMatches(eventId: string): Promise<Match[]> {
  const { data } = await apiClient.get<Match[]>(
    `/events/${eventId}/matches`,
  );
  return data;
}

// Table functions deliberately live in `api/tables.ts` only. This module
// previously carried a second, diverging copy of getEventTables/assignTables
// plus a getMyTable bound to the legacy round-unaware endpoint.

export async function getRecommendations(
  eventId: string,
): Promise<Recommendation[]> {
  const { data } = await apiClient.get<Recommendation[]>(
    `/events/${eventId}/recommendations`,
  );
  return data;
}

export async function getWhyRecommendation(
  eventId: string,
  targetUserId: string,
): Promise<WhyRecommendation> {
  const { data } = await apiClient.get<WhyRecommendation>(
    `/events/${eventId}/recommendations/why/${targetUserId}`,
  );
  return data;
}
