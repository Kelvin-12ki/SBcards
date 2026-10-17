import React, { useCallback, useEffect, useState } from 'react';
import { getAuthEventStats, getAuthEvents } from '@/api/security';
import type {
  AuthEvent,
  AuthEventStats,
  AuthEventsFilter,
  AuthEventType,
  PaginatedAuthEvents,
} from '@/types/security';
import { showApiError } from '@/utils/errorHandler';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const EVENT_LABEL: Record<AuthEventType, string> = {
  login: 'Login',
  signup: 'Signup',
  session_restore: 'Session restore',
  failed_login: 'Failed login',
  rate_limited: 'Rate limited',
  account_disabled: 'Account disabled',
};

const PAGE_SIZE = 25;

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-1 p-5">
      <p className="text-sm font-medium text-text-tertiary">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tone ?? 'text-text-primary'}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-text-tertiary">{sub}</p>}
    </div>
  );
}

function BreakdownPanel({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { label: string; count: number }[];
  empty: string;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-1 p-5">
      <h2 className="text-sm font-semibold text-text-primary mb-3">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-text-tertiary">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="truncate text-text-secondary" title={row.label}>
                {row.label}
              </span>
              <span className="flex-shrink-0 font-semibold text-text-primary">
                {row.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const AdminSecurityPage: React.FC = () => {
  const [stats, setStats] = useState<AuthEventStats | null>(null);
  const [feed, setFeed] = useState<PaginatedAuthEvents | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const [filters, setFilters] = useState<AuthEventsFilter>({
    page: 1,
    limit: PAGE_SIZE,
  });
  const [ipInput, setIpInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    getAuthEventStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) showApiError(err, 'Failed to load security stats.');
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAuthEvents(filters)
      .then((data) => {
        if (!cancelled) setFeed(data);
      })
      .catch((err) => {
        if (!cancelled) showApiError(err, 'Failed to load auth events.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const patch = useCallback((next: Partial<AuthEventsFilter>) => {
    setFilters((prev) => ({ ...prev, ...next, page: next.page ?? 1 }));
  }, []);

  const applyTextFilters = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      patch({ ip: ipInput.trim(), email: emailInput.trim() });
    },
    [patch, ipInput, emailInput],
  );

  const failureRate =
    stats && stats.last24h.total > 0
      ? Math.round((stats.last24h.failure / stats.last24h.total) * 100)
      : 0;

  if (loading && !feed) return <Spinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Security</h1>
        <p className="text-text-tertiary mt-1">
          Authentication activity across the platform. Events are retained for
          180 days.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Logins (24h)"
          value={statsLoading ? '…' : stats?.last24h.success ?? 0}
          sub="successful sign-ins"
          tone="text-neon-cyan"
        />
        <StatTile
          label="Failures (24h)"
          value={statsLoading ? '…' : stats?.last24h.failure ?? 0}
          sub="failed, throttled or disabled"
          tone="text-red-400"
        />
        <StatTile
          label="Failure rate (24h)"
          value={statsLoading ? '…' : `${failureRate}%`}
          sub="of all attempts"
          tone={failureRate > 30 ? 'text-red-400' : 'text-green-400'}
        />
        <StatTile
          label="Attempts (24h)"
          value={statsLoading ? '…' : stats?.last24h.total ?? 0}
          sub="logins, signups and restores"
        />
      </div>

      {/* 7-day trend */}
      <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Last 7 Days
        </h2>
        <div className="h-64">
          {statsLoading || !stats ? (
            <p className="text-sm text-text-tertiary">Loading…</p>
          ) : stats.daily.length === 0 ? (
            <p className="text-sm text-text-tertiary">
              No authentication activity in the last 7 days.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.daily}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15,15,25,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="success"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ fill: '#34d399', r: 3 }}
                  name="Successful"
                />
                <Line
                  type="monotone"
                  dataKey="failure"
                  stroke="#f87171"
                  strokeWidth={2}
                  dot={{ fill: '#f87171', r: 3 }}
                  name="Failed"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid gap-6 md:grid-cols-3">
        <BreakdownPanel
          title="Top failure reasons (7d)"
          empty="No failures recorded."
          rows={(stats?.topFailureReasons ?? []).map((r) => ({
            label: r._id,
            count: r.count,
          }))}
        />
        <BreakdownPanel
          title="Top source IPs (7d)"
          empty="No IP activity recorded."
          rows={(stats?.topIps ?? []).map((r) => ({
            label: r._id,
            count: r.count,
          }))}
        />
        <BreakdownPanel
          title="Credential types (7d)"
          empty="No credential activity recorded."
          rows={(stats?.byCredentialType ?? []).map((r) => ({
            label: r._id,
            count: r.count,
          }))}
        />
      </div>

      {/* Feed */}
      <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Authentication events
            </h2>
            <p className="text-sm text-text-tertiary">
              {feed ? `${feed.total.toLocaleString()} matching events` : '—'}
            </p>
          </div>

          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={applyTextFilters}
          >
            <label className="block">
              <span className="block text-xs text-text-tertiary mb-1">
                Outcome
              </span>
              <select
                value={filters.outcome ?? ''}
                onChange={(e) =>
                  patch({ outcome: (e.target.value || undefined) as any })
                }
                className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary"
              >
                <option value="">All</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
              </select>
            </label>

            <label className="block">
              <span className="block text-xs text-text-tertiary mb-1">Type</span>
              <select
                value={filters.eventType ?? ''}
                onChange={(e) =>
                  patch({ eventType: (e.target.value || undefined) as any })
                }
                className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary"
              >
                <option value="">All</option>
                {Object.entries(EVENT_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-xs text-text-tertiary mb-1">IP</span>
              <input
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="e.g. 102.217.1.4"
                className="w-40 rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary"
              />
            </label>

            <label className="block">
              <span className="block text-xs text-text-tertiary mb-1">
                Email
              </span>
              <input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@example.com"
                className="w-52 rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary"
              />
            </label>

            <button
              type="submit"
              className="rounded-lg bg-neon-cyan/20 px-4 py-2 text-sm font-semibold text-neon-cyan hover:bg-neon-cyan/30 transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                setIpInput('');
                setEmailInput('');
                setFilters({ page: 1, limit: PAGE_SIZE });
              }}
              className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
            >
              Reset
            </button>
          </form>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-text-tertiary">
            Loading…
          </div>
        ) : !feed || feed.data.length === 0 ? (
          <div className="py-10 text-center text-sm text-text-tertiary">
            No auth events match these filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-text-tertiary border-b border-border-subtle">
                    <th className="py-3 pr-4">Time</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Account</th>
                    <th className="py-3 pr-4">Source</th>
                    <th className="py-3 pr-4">Device</th>
                    <th className="py-3 pr-4">Credential</th>
                    <th className="py-3 pr-4">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {feed.data.map((event: AuthEvent) => (
                    <tr
                      key={event.id}
                      className="border-b border-border-subtle/60 align-top"
                    >
                      <td className="py-3 pr-4 whitespace-nowrap text-text-secondary">
                        {new Date(event.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${
                            event.outcome === 'success'
                              ? 'bg-green-500/15 text-green-400'
                              : 'bg-red-500/15 text-red-400'
                          }`}
                        >
                          {EVENT_LABEL[event.eventType] ?? event.eventType}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="block text-text-primary">
                          {event.email || '—'}
                        </span>
                        {event.userId && (
                          <span className="block text-xs text-text-tertiary">
                            {event.userId}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap text-text-secondary">
                        {event.ip || '—'}
                      </td>
                      <td className="py-3 pr-4 text-text-secondary">
                        {[event.os, event.browser].filter(Boolean).join(' · ') ||
                          '—'}
                        {event.deviceId && (
                          <span
                            className="block text-xs text-text-tertiary truncate max-w-[10rem]"
                            title={event.deviceId}
                          >
                            {event.deviceId}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap text-text-secondary">
                        {event.credentialType || '—'}
                      </td>
                      <td className="py-3 pr-4">
                        {event.failureReason ? (
                          <span className="text-red-400">
                            {event.failureReason}
                          </span>
                        ) : (
                          <span className="text-text-tertiary">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-4 mt-5">
              <p className="text-xs text-text-tertiary">
                Page {feed.page} of {feed.totalPages} · showing{' '}
                {feed.data.length} of {feed.total.toLocaleString()}
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
                  disabled={(filters.page ?? 1) >= feed.totalPages}
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
    </div>
  );
};

export default AdminSecurityPage;
