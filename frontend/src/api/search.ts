import apiClient from './client';
import type { SearchResponse, SearchFilters } from '@/types/search';

export async function globalSearch(query: string): Promise<SearchResponse> {
  const { data } = await apiClient.get('/search', { params: { q: query } });
  // Backend returns { users, cards, events, sessions, exhibitors, organizations }
  // Frontend expects { query, results: { users, cards, ... }, totalCount }
  const results = data.results || data; // handle both shapes
  const groups = results.users ? results : data;
  const allResults = [
    ...(groups.users || []),
    ...(groups.cards || []),
    ...(groups.events || []),
    ...(groups.sessions || []),
    ...(groups.exhibitors || []),
    ...(groups.organizations || []),
  ];
  return {
    query: query,
    results: {
      users: groups.users || [],
      cards: groups.cards || [],
      events: groups.events || [],
      sessions: groups.sessions || [],
      exhibitors: groups.exhibitors || [],
      organizations: groups.organizations || [],
    },
    totalCount: allResults.length,
  };
}

export async function searchPeople(query: string, filters?: SearchFilters): Promise<any[]> {
  const { data } = await apiClient.get('/search/people', { params: { q: query, ...filters } });
  return data;
}

export async function searchEvents(query: string, filters?: SearchFilters): Promise<any[]> {
  const { data } = await apiClient.get('/search/events', { params: { q: query, ...filters } });
  return data;
}

export async function searchCompanies(query: string): Promise<any[]> {
  const { data } = await apiClient.get('/search/companies', { params: { q: query } });
  return data;
}
