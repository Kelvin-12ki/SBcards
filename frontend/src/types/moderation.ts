import type { Message } from './messaging';

export type ReportTargetType = 'message' | 'user' | 'conversation';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate'
  | 'scam'
  | 'impersonation'
  | 'other';

export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export const REPORT_REASONS: ReportReason[] = [
  'spam',
  'harassment',
  'inappropriate',
  'scam',
  'impersonation',
  'other',
];

export const REPORT_STATUSES: ReportStatus[] = [
  'open',
  'reviewing',
  'resolved',
  'dismissed',
];

/** Human labels for the reason vocabulary; keys mirror the API enum. */
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam or unwanted',
  harassment: 'Harassment or bullying',
  inappropriate: 'Inappropriate content',
  scam: 'Scam or fraud',
  impersonation: 'Impersonation',
  other: 'Something else',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: 'Open',
  reviewing: 'Reviewing',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

export interface ReportUser {
  id: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  status?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  targetOwnerId?: string;
  conversationId?: string;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  resolutionNote?: string;
  handledBy?: string;
  handledAt?: string;
  createdAt: string;
  updatedAt?: string;
  reporter?: ReportUser | null;
  targetOwner?: ReportUser | null;
}

export interface PaginatedReports {
  items: Report[];
  total: number;
  page: number;
  limit: number;
}

export interface ReportsFilter {
  status?: ReportStatus;
  type?: ReportTargetType;
  page?: number;
  limit?: number;
}

export interface CreateReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}

export interface UpdateReportInput {
  status: ReportStatus;
  resolutionNote?: string;
}

/** A message as seen through the moderation window, with its author joined. */
export type ReportMessage = Message & { sender?: ReportUser | null };

export interface ReportMessageWindow {
  reportedMessageId: string;
  messages: ReportMessage[];
}

export interface ChatsOverview {
  totals: {
    conversations: number;
    messages: number;
    users: number;
    openReports: number;
  };
  recent: {
    last24h: number;
    last7d: number;
    prev7d: number;
    changePct: number;
  };
  daily: Array<{ _id: string; count: number }>;
  topSenders: Array<{
    userId: string;
    messageCount: number;
    user: ReportUser | null;
  }>;
  busiest: Array<{
    conversationId: string;
    messageCount: number;
    lastMessagePreview: string;
    participants: ReportUser[];
  }>;
  windowDays: number;
}
