import apiClient from './client';
import type { Match, TableAssignment } from '@/types/match';
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

export async function getEventTables(
  eventId: string,
): Promise<TableAssignment[]> {
  const { data } = await apiClient.get<TableAssignment[]>(
    `/events/${eventId}/tables`,
  );
  return data;
}

export async function assignTables(
  eventId: string,
): Promise<TableAssignment[]> {
  const { data } = await apiClient.post<TableAssignment[]>(
    `/events/${eventId}/assign-tables`,
  );
  return data;
}

export async function getMyTable(
  eventId: string,
): Promise<TableAssignment> {
  const { data } = await apiClient.get<TableAssignment>(
    `/events/${eventId}/my-table`,
  );
  return data;
}

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
