import apiClient from './client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalUsers: number;
  totalCards: number;
  totalConnections: number;
  totalEvents: number;
  newUsersToday: number;
  newUsersThisWeek: number;
}

export interface PaginatedUsers {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedEvents {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserDetail {
  id: string;
  firebaseUid: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  title?: string;
  company?: string;
  role: string;
  status: string;
  createdAt: string;
  cardsCount: number;
  connectionsCount: number;
  eventsJoinedCount: number;
  eventsCreatedCount: number;
  [key: string]: any;
}

export interface AnalyticsData {
  period: string;
  users: { date: string; count: number }[];
  cards: { date: string; count: number }[];
  connections: { date: string; count: number }[];
}

export interface LeaderboardData {
  metric: string;
  data: {
    userId: string;
    count: number;
    displayName?: string;
    email?: string;
    avatarUrl?: string;
  }[];
}

// ─── API Functions ──────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>('/admin/stats');
  return data;
}

export async function listUsers(
  query = '',
  page = 1,
  limit = 20,
): Promise<PaginatedUsers> {
  const { data } = await apiClient.get<PaginatedUsers>('/admin/users', {
    params: { query, page, limit },
  });
  return data;
}

export async function getUserDetail(userId: string): Promise<UserDetail> {
  const { data } = await apiClient.get<UserDetail>(`/admin/users/${userId}`);
  return data;
}

export async function banUser(userId: string): Promise<any> {
  const { data } = await apiClient.patch(`/admin/users/${userId}/ban`);
  return data;
}

export async function suspendUser(userId: string): Promise<any> {
  const { data } = await apiClient.patch(`/admin/users/${userId}/suspend`);
  return data;
}

export async function restoreUser(userId: string): Promise<any> {
  const { data } = await apiClient.patch(`/admin/users/${userId}/restore`);
  return data;
}

export async function getAllEvents(
  page = 1,
  limit = 50,
): Promise<PaginatedEvents> {
  const { data } = await apiClient.get<PaginatedEvents>('/admin/events', {
    params: { page, limit },
  });
  return data;
}

export async function createEvent(eventData: Record<string, any>): Promise<any> {
  const { data } = await apiClient.post('/admin/events', eventData);
  return data;
}

export async function updateEvent(
  id: string,
  eventData: Record<string, any>,
): Promise<any> {
  const { data } = await apiClient.patch(`/admin/events/${id}`, eventData);
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  await apiClient.delete(`/admin/events/${id}`);
}

export async function getAnalytics(period = '30d'): Promise<AnalyticsData> {
  const { data } = await apiClient.get<AnalyticsData>('/admin/analytics', {
    params: { period },
  });
  return data;
}

export async function getLeaderboard(
  metric = 'connections',
  limit = 20,
): Promise<LeaderboardData> {
  const { data } = await apiClient.get<LeaderboardData>('/admin/leaderboard', {
    params: { metric, limit },
  });
  return data;
}
