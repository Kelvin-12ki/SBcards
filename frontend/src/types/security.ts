export type AuthEventType =
  | 'login'
  | 'signup'
  | 'session_restore'
  | 'failed_login'
  | 'rate_limited'
  | 'account_disabled';

export type AuthOutcome = 'success' | 'failure';

export interface AuthEvent {
  id: string;
  userId?: string;
  firebaseUid?: string;
  email?: string;
  eventType: AuthEventType;
  outcome: AuthOutcome;
  ip?: string;
  userAgent?: string;
  os?: string;
  browser?: string;
  platform?: string;
  deviceId?: string;
  fingerprint?: string;
  credentialType?: string;
  failureReason?: string;
  intent?: string;
  stepUp: boolean;
  phone?: string;
  createdAt: string;
}

export interface PaginatedAuthEvents {
  data: AuthEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthEventStats {
  last24h: { success: number; failure: number; total: number };
  byCredentialType: { _id: string; count: number }[];
  topFailureReasons: { _id: string; count: number }[];
  topIps: { _id: string; count: number }[];
  daily: { date: string; success: number; failure: number }[];
}

/** Every field maps to an optional query param — no filter is mandatory. */
export interface AuthEventsFilter {
  outcome?: AuthOutcome;
  eventType?: AuthEventType;
  credentialType?: string;
  userId?: string;
  email?: string;
  ip?: string;
  deviceId?: string;
  failureReason?: string;
  since?: string;
  until?: string;
  page?: number;
  limit?: number;
}

/** Owner joined server-side from the user collection; null if the user is gone. */
export interface DeviceOwner {
  id?: string;
  _id?: string;
  email?: string;
  displayName?: string;
  status?: string;
  role?: string;
}

/** One row per (user, device), upserted on every successful auth. */
export interface Device {
  id: string;
  userId: string;
  deviceId: string;
  userAgent?: string;
  os?: string;
  browser?: string;
  platform?: string;
  fingerprint?: string;
  lastIp?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
  user: DeviceOwner | null;
}

export interface PaginatedDevices {
  data: Device[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Every field maps to an optional query param — no filter is mandatory. */
export interface DevicesFilter {
  userId?: string;
  os?: string;
  browser?: string;
  ip?: string;
  since?: string;
  page?: number;
  limit?: number;
}
