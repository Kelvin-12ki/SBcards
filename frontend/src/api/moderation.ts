import apiClient from './client';
import type {
  ChatsOverview,
  CreateReportInput,
  PaginatedReports,
  Report,
  ReportMessageWindow,
  ReportsFilter,
  UpdateReportInput,
} from '@/types/moderation';
import type { Message } from '@/types/messaging';

/** Empty strings are dropped so they never reach `forbidNonWhitelisted`. */
function cleanParams(filter: object): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined || value === null || value === '') continue;
    params[key] = value;
  }
  return params;
}

/**
 * Report rows and message windows come back from `.lean()` queries, which
 * carry the raw `_id` and no `id` virtual — normalise here so the rest of the
 * app can keep using `id` like every hydrated document.
 */
function normaliseReport(raw: any): Report {
  return { ...(raw as Report), id: String(raw.id ?? raw._id) };
}

function normaliseMessage(raw: any): Message {
  return { ...(raw as Message), id: String(raw.id ?? raw._id) };
}

/** File a report. 409 means this reporter already has an open one. */
export async function createReport(input: CreateReportInput): Promise<void> {
  await apiClient.post('/reports', input);
}

export async function getReports(
  filter: ReportsFilter = {},
): Promise<PaginatedReports> {
  const { data } = await apiClient.get<any>('/admin/reports', {
    params: cleanParams(filter),
  });
  return {
    ...data,
    items: (data.items || []).map(normaliseReport),
  };
}

export async function updateReport(
  id: string,
  input: UpdateReportInput,
): Promise<Report> {
  const { data } = await apiClient.patch<any>(
    `/admin/reports/${id}`,
    input,
  );
  return normaliseReport(data);
}

/**
 * Conversation context around a reported message. Every call is written to
 * the admin audit log, so this is fetched on demand rather than preloaded.
 */
export async function getReportMessages(
  id: string,
  before?: string,
): Promise<ReportMessageWindow> {
  const { data } = await apiClient.get<any>(
    `/admin/reports/${id}/messages`,
    { params: cleanParams({ before }) },
  );
  return {
    reportedMessageId: String(data.reportedMessageId),
    messages: (data.messages || []).map(normaliseMessage),
  };
}

export async function getChatsOverview(
  days?: number,
): Promise<ChatsOverview> {
  const { data } = await apiClient.get<ChatsOverview>(
    '/admin/chats/overview',
    { params: cleanParams({ days }) },
  );
  return data;
}
