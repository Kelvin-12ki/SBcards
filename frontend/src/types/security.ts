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
