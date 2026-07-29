import React, { useEffect, useState } from 'react';
import { getAnalytics, getLeaderboard, type AnalyticsData, type LeaderboardData } from '@/api/admin';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ─── Period Selector ────────────────────────────────────────────────────────

const periodOptions = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
];

// ─── Metric Selector ────────────────────────────────────────────────────────

const metricOptions = [
  { value: 'connections', label: 'Top Connectors' },
  { value: 'cards', label: 'Card Creators' },
  { value: 'events_joined', label: 'Event Joiners' },
];

// ─── Analytics Page ─────────────────────────────────────────────────────────

const AdminAnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [leaderboardMetric, setLeaderboardMetric] = useState('connections');
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await getAnalytics(period);
        setAnalytics(data);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [period]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLeaderboardLoading(true);
        const data = await getLeaderboard(leaderboardMetric, 20);
        setLeaderboard(data);
      } catch {
        // Silently fail
      } finally {
        setLeaderboardLoading(false);
      }
    };
    fetchLeaderboard();
  }, [leaderboardMetric]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-text-tertiary mt-1">Track platform growth and activity over time.</p>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-tertiary">Period:</span>
        {periodOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              period === opt.value
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                : 'bg-surface-1 text-text-secondary border border-border-subtle hover:bg-surface-2'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* User Growth Chart */}
      <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">User Growth</h2>
        <div className="h-72">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.users || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15,15,25,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="#00d4ff" strokeWidth={2} dot={false} name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Cards & Connections Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Cards Created</h2>
          <div className="h-60">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.cards || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  />
                  <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15,15,25,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} name="Cards" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Connections Made</h2>
          <div className="h-60">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.connections || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  />
                  <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15,15,25,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Connections" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Leaderboard</h2>
          <div className="flex items-center gap-2">
            {metricOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLeaderboardMetric(opt.value)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                  leaderboardMetric === opt.value
                    ? 'bg-gold/20 text-gold border border-gold/30'
                    : 'bg-surface-2 text-text-secondary border border-border-subtle hover:bg-surface-2'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left px-3 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">#</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">User</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">{leaderboardMetric === 'connections' ? 'Connections' : leaderboardMetric === 'cards' ? 'Cards' : 'Events Joined'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {leaderboardLoading ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-text-tertiary">
                    <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : leaderboard?.data.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-text-tertiary">No data yet.</td>
                </tr>
              ) : (
                leaderboard?.data.map((item, index) => (
                  <tr key={item.userId} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-gold/20 text-gold' :
                        index === 1 ? 'bg-gray-300/20 text-gray-300' :
                        index === 2 ? 'bg-amber-700/20 text-amber-600' :
                        'bg-surface-2 text-text-tertiary'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-surface-2 flex items-center justify-center text-[10px] font-medium text-text-secondary overflow-hidden">
                          {item.avatarUrl ? (
                            <img src={item.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            (item.displayName?.[0] || item.email?.[0] || '?').toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{item.displayName || 'Unknown'}</p>
                          <p className="text-[10px] text-text-tertiary">{item.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-sm font-semibold text-text-primary">
                      {item.count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
