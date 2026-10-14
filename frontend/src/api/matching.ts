import apiClient from './client';
import type { Match, MatchResult } from '@/types/match';
import type { WhyRecommendation } from '@/types/recommendation';

/** Raw Match documents (not MatchResultDto) — see matching.service.ts. */
export async function runMatching(eventId: string): Promise<Match[]> {
  const { data } = await apiClient.post<Match[]>(
    `/events/${eventId}/match`,
  );
  return data;
}

export async function getMatches(eventId: string): Promise<MatchResult[]> {
  const { data } = await apiClient.get<MatchResult[]>(
    `/events/${eventId}/matches`,
  );
  return data;
}

// Table functions deliberately live in `api/tables.ts` only. This module
// previously carried a second, diverging copy of getEventTables/assignTables
// plus a getMyTable bound to the legacy round-unaware endpoint.

export async function getRecommendations(
  eventId: string,
  limit?: number,
): Promise<MatchResult[]> {
  const { data } = await apiClient.get<MatchResult[]>(
    `/events/${eventId}/recommendations`,
    { params: limit ? { limit } : undefined },
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
