import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getChatsOverview } from '@/api/moderation';
import type { ChatsOverview } from '@/types/moderation';
import { showApiError } from '@/utils/errorHandler';

const RANGE_OPTIONS = [7, 30, 90];

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-1 p-5">
      <p className="text-xs uppercase tracking-wider text-text-tertiary">{label}</p>
      <p className="text-2xl font-bold text-text-primary mt-1.5">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {hint && <p className="text-xs text-text-tertiary mt-1">{hint}</p>}
    </div>
  );
}

const AdminChatsPage: React.FC = () => {
  const [overview, setOverview] = useState<ChatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getChatsOverview(days)
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch((err) => {
        if (!cancelled) showApiError(err, 'Failed to load chat overview.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  if (loading && !overview) return <Spinner />;

  const maxDaily = overview
    ? overview.daily.reduce((max, row) => Math.max(max, row.count), 0)
    : 0;
  const change = overview?.recent.changePct ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Chat</h1>
          <p className="text-text-tertiary mt-1">
            Messaging volume and the threads carrying it. Use the report queue
            to act on anything flagged.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border-subtle overflow-hidden">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDays(option)}
                className={
                  days === option
                    ? 'px-3 py-2 text-sm font-medium bg-gold/20 text-gold'
                    : 'px-3 py-2 text-sm text-text-secondary hover:bg-surface-2 transition-colors'
                }
              >
                {option}d
              </button>
            ))}
          </div>
          <Link
            to="/admin/reports"
            className="rounded-lg bg-gold/20 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/30 transition-colors"
          >
            Reports
            {overview && overview.totals.openReports > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {overview.totals.openReports}
              </span>
            )}
          </Link>
        </div>
      </div>

      {overview && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Messages"
              value={overview.totals.messages}
              hint={`${overview.recent.last24h} in the last 24h`}
            />
            <StatCard
              label="Conversations"
              value={overview.totals.conversations}
              hint="threads with at least one message"
            />
            <StatCard
              label="Users"
              value={overview.totals.users}
              hint="registered accounts"
            />
            <StatCard
              label="Open reports"
              value={overview.totals.openReports}
              hint={
                overview.totals.openReports > 0
                  ? 'awaiting review'
                  : 'queue is clear'
              }
            />
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Daily volume
                </h2>
                <p className="text-sm text-text-tertiary">
                  Last {overview.windowDays} days · {overview.recent.last7d}{' '}
                  messages this week vs {overview.recent.prev7d} the week before
                </p>
              </div>
              <span
                className={
                  change > 0
                    ? 'text-sm font-semibold text-emerald-400'
                    : change < 0
                      ? 'text-sm font-semibold text-red-400'
                      : 'text-sm text-text-tertiary'
                }
              >
                {change > 0 ? '+' : ''}
                {change}% week over week
              </span>
            </div>

            {overview.daily.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-tertiary">
                No messages in this window.
              </p>
            ) : (
              <div className="flex items-end gap-1.5 h-40">
                {overview.daily.map((row) => {
                  const height =
                    maxDaily > 0
                      ? Math.max(4, Math.round((row.count / maxDaily) * 100))
                      : 4;
                  return (
                    <div
                      key={row._id}
                      className="group relative flex-1 min-w-0"
                      title={`${row._id}: ${row.count} messages`}
                    >
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-gold/40 to-gold group-hover:from-gold/60 to-gold transition-all"
                        style={{ height: `${height}%` }}
                      />
                      <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-surface-3 px-1.5 py-0.5 text-[10px] text-text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {row.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {overview.daily.length > 0 && (
              <div className="flex justify-between mt-2 text-[10px] text-text-tertiary">
                <span>{overview.daily[0]._id}</span>
                <span>{overview.daily[overview.daily.length - 1]._id}</span>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-1">
                Top senders
              </h2>
              <p className="text-sm text-text-tertiary mb-4">
                Most active senders in the window
              </p>
              {overview.topSenders.length === 0 ? (
                <p className="py-6 text-center text-sm text-text-tertiary">
                  No activity in this window.
                </p>
              ) : (
                <ul className="space-y-3">
                  {overview.topSenders.map((row) => (
                    <li
                      key={row.userId}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-text-primary truncate">
                          {row.user?.displayName ||
                            row.user?.email ||
                            row.userId}
                        </p>
                        {row.user?.email && (
                          <p className="text-xs text-text-tertiary truncate">
                            {row.user.email}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gold flex-shrink-0">
                        {row.messageCount.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-1">
                Busiest conversations
              </h2>
              <p className="text-sm text-text-tertiary mb-4">
                Threads with the most messages in the window
              </p>
              {overview.busiest.length === 0 ? (
                <p className="py-6 text-center text-sm text-text-tertiary">
                  No activity in this window.
                </p>
              ) : (
                <ul className="space-y-4">
                  {overview.busiest.map((row) => (
                    <li key={row.conversationId}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm text-text-primary truncate">
                          {row.participants
                            .map((p) => p.displayName || p.email || p.id)
                            .join(', ') || 'Conversation'}
                        </p>
                        <span className="text-sm font-semibold text-gold flex-shrink-0">
                          {row.messageCount.toLocaleString()}
                        </span>
                      </div>
                      {row.lastMessagePreview && (
                        <p className="text-xs text-text-tertiary truncate mt-0.5">
                          {row.lastMessagePreview}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminChatsPage;
