import apiClient from './client';
import type {
  AuthEventStats,
  AuthEventsFilter,
  DevicesFilter,
  PaginatedAuthEvents,
  PaginatedDevices,
} from '@/types/security';

/** Empty strings are dropped so they never reach `forbidNonWhitelisted`. */
function cleanParams(
  filter: object,
): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined || value === null || value === '') continue;
    params[key] = value;
  }
  return params;
}

export async function getAuthEvents(
  filter: AuthEventsFilter = {},
): Promise<PaginatedAuthEvents> {
  const { data } = await apiClient.get<PaginatedAuthEvents>(
    '/admin/security/auth-events',
    { params: cleanParams(filter) },
  );
  return data;
}

export async function getAuthEventStats(): Promise<AuthEventStats> {
  const { data } = await apiClient.get<AuthEventStats>(
    '/admin/security/auth-events/stats',
  );
  return data;
}

export async function getDevices(
  filter: DevicesFilter = {},
): Promise<PaginatedDevices> {
  const { data } = await apiClient.get<PaginatedDevices>(
    '/admin/security/devices',
    { params: cleanParams(filter) },
  );
  return data;
}
