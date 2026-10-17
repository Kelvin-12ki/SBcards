import React, { useCallback, useEffect, useState } from 'react';
import { getReports, getReportMessages, updateReport } from '@/api/moderation';
import type {
  PaginatedReports,
  Report,
  ReportMessageWindow,
  ReportsFilter,
  ReportStatus,
  ReportTargetType,
} from '@/types/moderation';
import {
  REPORT_REASONS,
  REPORT_REASON_LABELS,
  REPORT_STATUSES,
  REPORT_STATUS_LABELS,
} from '@/types/moderation';
import { showApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';
import { cn } from '@/utils/helpers';

const PAGE_SIZE = 20;

const TARGET_LABELS: Record<string, string> = {
  message: 'Message',
  user: 'User',
  conversation: 'Conversation',
};

const STATUS_STYLES: Record<ReportStatus, string> = {
  open: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  reviewing: 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  dismissed: 'bg-surface-3 text-text-tertiary border-border-subtle',
};

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function userName(report: Report, which: 'owner' | 'reporter'): string {
  const user = which === 'owner' ? report.targetOwner : report.reporter;
  if (user) return user.displayName || user.email || user.id;
  const id = which === 'owner' ? report.targetOwnerId : report.reporterId;
  return id || '—';
}

const AdminReportsPage: React.FC = () => {
  const [reports, setReports] = useState<PaginatedReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReportsFilter>({
    page: 1,
    limit: PAGE_SIZE,
  });

  // Detail panel: the selected report plus its message window (fetched on
  // demand because every fetch is recorded in the admin audit log).
  const [selected, setSelected] = useState<Report | null>(null);
  const [window_, setWindow] = useState<ReportMessageWindow | null>(null);
  const [windowLoading, setWindowLoading] = useState(false);
  const [note, setNote] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getReports(filters)
      .then((data) => {
        if (!cancelled) setReports(data);
      })
      .catch((err) => {
        if (!cancelled) showApiError(err, 'Failed to load reports.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const patch = useCallback((next: Partial<ReportsFilter>) => {
    setFilters((prev) => ({ ...prev, ...next, page: next.page ?? 1 }));
  }, []);

  const closeDetail = useCallback(() => {
    setSelected(null);
    setWindow(null);
    setNote('');
  }, []);

  const openDetail = useCallback(
    (report: Report) => {
      setSelected(report);
      setNote(report.resolutionNote || '');
      setWindow(null);
      if (report.targetType === 'message') {
        setWindowLoading(true);
        getReportMessages(report.id)
          .then(setWindow)
          .catch((err) => showApiError(err, 'Could not load message context.'))
          .finally(() => setWindowLoading(false));
      }
    },
    [],
  );

  const dispose = useCallback(
    async (status: ReportStatus) => {
      if (!selected || acting) return;
      setActing(true);
      try {
        const updated = await updateReport(selected.id, {
          status,
          resolutionNote: note.trim() || undefined,
        });
        setSelected(updated);
        toast.success(`Report marked ${REPORT_STATUS_LABELS[status].toLowerCase()}`);
        // Refresh the row in place so the list matches the panel.
        setReports((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((item) =>
                  item.id === updated.id ? updated : item,
                ),
              }
            : prev,
        );
      } catch (err) {
        showApiError(err, 'Could not update the report.');
      } finally {
        setActing(false);
      }
    },
    [selected, acting, note],
  );

  const totalPages = reports
    ? Math.max(1, Math.ceil(reports.total / (reports.limit || PAGE_SIZE)))
    : 1;

  if (loading && !reports) return <Spinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
        <p className="text-text-tertiary mt-1">
          Items users have flagged. Message reports open a read-only window of
          the conversation around the reported message, and every open of that
          window is recorded in the admin audit log.
        </p>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="rounded-2xl border border-gold/30 bg-surface-1 p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-text-primary">
                  {TARGET_LABELS[selected.targetType]} report
                </h2>
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-xs font-medium',
                    STATUS_STYLES[selected.status],
                  )}
                >
                  {REPORT_STATUS_LABELS[selected.status]}
                </span>
              </div>
              <p className="text-sm text-text-tertiary mt-1">
                Filed {new Date(selected.createdAt).toLocaleString()} by{' '}
                {userName(selected, 'reporter')} against{' '}
                {userName(selected, 'owner')}
              </p>
            </div>
            <button
              type="button"
              onClick={closeDetail}
              className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
            >
              Close
            </button>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface-2 p-4">
            <p className="text-xs uppercase tracking-wider text-text-tertiary mb-1">
              Reason
            </p>
            <p className="text-sm text-text-primary font-medium">
              {REPORT_REASON_LABELS[selected.reason] || selected.reason}
            </p>
            {selected.details && (
              <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap break-words">
                {selected.details}
              </p>
            )}
          </div>

          {/* Message context — only for message reports */}
          {selected.targetType === 'message' && (
            <div className="rounded-xl border border-border-subtle bg-surface-2 p-4">
              <p className="text-xs uppercase tracking-wider text-text-tertiary mb-3">
                Conversation context
              </p>
              {windowLoading ? (
                <p className="text-sm text-text-tertiary py-4 text-center">
                  Loading context…
                </p>
              ) : !window_ || window_.messages.length === 0 ? (
                <p className="text-sm text-text-tertiary py-4 text-center">
                  The reported message is no longer available.
                </p>
              ) : (
                <div className="space-y-2 max-h-[24rem] overflow-y-auto pr-1">
                  {window_.messages.map((message) => {
                    const isReported =
                      message.id === window_.reportedMessageId;
                    const mine = message.sender;
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-sm',
                          isReported
                            ? 'border-red-500/50 bg-red-500/10'
                            : 'border-border-subtle bg-surface-1',
                        )}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-xs font-medium text-gold/80 truncate">
                            {mine?.displayName || mine?.email || message.senderId}
                          </span>
                          <span className="text-[10px] text-text-tertiary flex-shrink-0">
                            {new Date(message.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-text-primary whitespace-pre-wrap break-words mt-1">
                          {message.type === 'text' || !message.type
                            ? message.content || '—'
                            : message.type === 'image'
                              ? '[image]' + (message.content ? ` ${message.content}` : '')
                              : '[card share]' + (message.content ? ` ${message.content}` : '')}
                        </p>
                        {isReported && (
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400 mt-1.5">
                            Reported message
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Disposition */}
          <div className="space-y-3">
            <label className="block">
              <span className="block text-xs text-text-tertiary mb-1">
                Resolution note (internal, optional)
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="What was decided and why"
                className="w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-gold/40"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={acting || selected.status === 'reviewing'}
                onClick={() => dispose('reviewing')}
                className="rounded-lg bg-neon-cyan/20 px-4 py-2 text-sm font-semibold text-neon-cyan hover:bg-neon-cyan/30 disabled:opacity-40 transition-colors"
              >
                Mark reviewing
              </button>
              <button
                type="button"
                disabled={acting || selected.status === 'resolved'}
                onClick={() => dispose('resolved')}
                className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-40 transition-colors"
              >
                Resolve
              </button>
              <button
                type="button"
                disabled={acting || selected.status === 'dismissed'}
                onClick={() => dispose('dismissed')}
                className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-surface-2 disabled:opacity-40 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Queue */}
      <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Queue</h2>
            <p className="text-sm text-text-tertiary">
              {reports ? `${reports.total.toLocaleString()} matching reports` : '—'}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="block text-xs text-text-tertiary mb-1">Status</span>
              <select
                value={filters.status ?? ''}
                onChange={(e) =>
                  patch({
                    status: (e.target.value || undefined) as ReportStatus | undefined,
                  })
                }
                className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary"
              >
                <option value="">All</option>
                {REPORT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {REPORT_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-xs text-text-tertiary mb-1">Type</span>
              <select
                value={filters.type ?? ''}
                onChange={(e) =>
                  patch({
                    type: (e.target.value || undefined) as ReportTargetType | undefined,
                  })
                }
                className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary"
              >
                <option value="">All</option>
                <option value="message">Message</option>
                <option value="user">User</option>
                <option value="conversation">Conversation</option>
              </select>
            </label>

            <button
              type="button"
              onClick={() => patch({ status: undefined, type: undefined })}
              className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-text-tertiary">Loading…</div>
        ) : !reports || reports.items.length === 0 ? (
          <div className="py-10 text-center text-sm text-text-tertiary">
            No reports match these filters. Nothing has been flagged yet.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-text-tertiary border-b border-border-subtle">
                    <th className="py-3 pr-4">Reported</th>
                    <th className="py-3 pr-4">Reporter</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Reason</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Filed</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.items.map((report) => (
                    <tr
                      key={report.id}
                      onClick={() => openDetail(report)}
                      className={cn(
                        'border-b border-border-subtle/60 align-top cursor-pointer transition-colors hover:bg-surface-2',
                        selected?.id === report.id && 'bg-surface-2',
                      )}
                    >
                      <td className="py-3 pr-4">
                        <span className="block text-text-primary">
                          {userName(report, 'owner')}
                        </span>
                        {report.details && (
                          <span className="block text-xs text-text-tertiary max-w-[20rem] truncate">
                            {report.details}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-text-secondary">
                        {userName(report, 'reporter')}
                      </td>
                      <td className="py-3 pr-4 text-text-secondary">
                        {TARGET_LABELS[report.targetType] || report.targetType}
                      </td>
                      <td className="py-3 pr-4 text-text-secondary">
                        {REPORT_REASON_LABELS[report.reason] || report.reason}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            'inline-block rounded-full border px-2 py-0.5 text-xs font-medium',
                            STATUS_STYLES[report.status],
                          )}
                        >
                          {REPORT_STATUS_LABELS[report.status]}
                        </span>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap text-text-secondary">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-4 mt-5">
              <p className="text-xs text-text-tertiary">
                Page {reports.page} of {totalPages} · showing {reports.items.length} of{' '}
                {reports.total.toLocaleString()}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={(filters.page ?? 1) <= 1}
                  onClick={() => patch({ page: (filters.page ?? 1) - 1 })}
                  className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={(filters.page ?? 1) >= totalPages}
                  onClick={() => patch({ page: (filters.page ?? 1) + 1 })}
                  className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reason vocabulary reference so filters make sense at a glance */}
      <div className="text-xs text-text-tertiary">
        Reasons: {REPORT_REASONS.map((r) => REPORT_REASON_LABELS[r]).join(' · ')}
      </div>
    </div>
  );
};

export default AdminReportsPage;
