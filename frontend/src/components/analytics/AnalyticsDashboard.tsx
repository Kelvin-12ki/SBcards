import React from 'react';
import { cn } from '@/utils/helpers';
import type { EventAnalytics } from '@/types/analytics';

export interface AnalyticsDashboardProps {
  analytics: EventAnalytics;
  className?: string;
}

/* ─── Stat Card ─── */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, accent }) => (
  <div className="card-magical rounded-xl p-4 transition-all duration-300 hover-glow-magical">
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
          accent,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-display text-2xl font-extrabold tracking-tight text-text-primary">
          {value}
        </p>
        <p className="text-xs text-text-secondary">{label}</p>
      </div>
    </div>
  </div>
);

/* ─── Horizontal Bar Chart ─── */
interface BarItem {
  label: string;
  value: number;
  color: string;
}

const BarChart: React.FC<{ items: BarItem[]; maxValue?: number }> = ({ items, maxValue }) => {
  const max = maxValue ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-text-primary truncate mr-2">{item.label}</span>
            <span className="text-xs text-text-secondary">{item.value}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', item.color)}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-sm text-text-secondary text-center py-4">No data available</p>
      )}
    </div>
  );
};

/* ─── Simple Timeline Chart (vertical bars) ─── */
const TimelineChart: React.FC<{ data: { date: string; count: number }[] }> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.count), 1);
  const labelCount = 5;

  if (data.length === 0) {
    return <p className="text-sm text-text-secondary text-center py-4">No connection data yet</p>;
  }

  return (
    <div className="relative h-48">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-[10px] text-text-tertiary">
        {Array.from({ length: labelCount + 1 }).map((_, i) => (
          <span key={i}>{Math.round((max / labelCount) * (labelCount - i))}</span>
        ))}
      </div>
      {/* Bars */}
      <div className="ml-12 h-full flex items-end gap-[3px] overflow-x-auto pb-6">
        {data.map((d) => {
          const pct = (d.count / max) * 100;
          return (
            <div
              key={d.date}
              className="group relative flex flex-1 flex-col items-center min-w-[20px]"
            >
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-neon-cyan/60 to-neon-cyan transition-all duration-300 hover:from-neon-cyan hover:to-neon-blue"
                style={{ height: `${Math.max(pct, 2)}%` }}
                title={`${d.date}: ${d.count} connections`}
              />
              <span className="absolute -bottom-5 text-[9px] text-text-tertiary whitespace-nowrap overflow-hidden text-ellipsis max-w-[40px]">
                {formatShortDate(d.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ─── Networking Heatmap ─── */
const HeatmapGrid: React.FC<{ data: { hour: number; count: number }[] }> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.count), 1);
  const grid: { hour: number; count: number; pct: number }[] = [];
  for (let h = 0; h < 24; h++) {
    const found = data.find((d) => d.hour === h);
    grid.push({ hour: h, count: found?.count ?? 0, pct: found ? (found.count / max) : 0 });
  }

  if (data.length === 0) {
    return <p className="text-sm text-text-secondary text-center py-4">No networking data yet</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-12 gap-1">
        {grid.map((cell) => (
          <div
            key={cell.hour}
            className="group relative aspect-square rounded"
            style={{
              backgroundColor: `rgba(0, 245, 255, ${cell.pct * 0.8})`,
            }}
            title={`${cell.hour}:00 — ${cell.count} connections`}
          >
            {/* Show hour label on first of each group */}
            {cell.hour % 2 === 0 && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-text-tertiary">
                {cell.hour}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-2 text-[10px] text-text-tertiary">
        <span>Less</span>
        <div className="flex gap-0.5">
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <div
              key={v}
              className="h-3 w-3 rounded"
              style={{ backgroundColor: `rgba(0, 245, 255, ${v * 0.8})` }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

/* ─── Main Dashboard ─── */
const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ analytics, className }) => {
  const {
    totalAttendees,
    activeAttendees,
    connectionsMade,
    averageMatchScore,
    sessionAttendance,
    topIndustries,
    companiesRepresented,
    connectionTimeline,
    networkingHeatmap,
    exhibitorStats,
  } = analytics;

  const industryBars: BarItem[] = topIndustries.map((ind, i) => ({
    label: ind.industry,
    value: ind.count,
    color: [
      'bg-gradient-to-r from-neon-cyan to-neon-blue',
      'bg-gradient-to-r from-neon-pink to-neon-purple',
      'bg-gradient-to-r from-gold to-neon-pink',
      'bg-gradient-to-r from-neon-purple to-neon-cyan',
      'bg-gradient-to-r from-aurora-green to-aurora-teal',
      'bg-gradient-to-r from-aurora-blue to-aurora-purple',
    ][i % 6],
  }));

  return (
    <div className={cn('space-y-6', className)}>
      {/* ── Stat Cards Grid ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="Total Attendees"
          value={totalAttendees}
          accent="bg-neon-cyan/15 text-neon-cyan"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <StatCard
          label="Active Now"
          value={activeAttendees}
          accent="bg-success/15 text-success"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Connections"
          value={connectionsMade}
          accent="bg-gold/15 text-gold"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.27a4.5 4.5 0 00-4.555-4.555m3.313 13.313l-1.757 1.757a4.5 4.5 0 01-6.364-6.364l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757" />
            </svg>
          }
        />
        <StatCard
          label="Avg Match Score"
          value={`${Math.round(averageMatchScore * 100)}%`}
          accent="bg-neon-purple/15 text-neon-purple"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
        />
        <StatCard
          label="Session Attendance"
          value={sessionAttendance}
          accent="bg-neon-blue/15 text-neon-blue"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
        />
        <StatCard
          label="Companies"
          value={companiesRepresented}
          accent="bg-neon-pink/15 text-neon-pink"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          }
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Industries */}
        <div className="card-magical rounded-xl p-5">
          <h3 className="mb-4 font-display text-base font-bold text-gradient-magical">
            Top Industries
          </h3>
          <BarChart items={industryBars} />
        </div>

        {/* Connection Timeline */}
        <div className="card-magical rounded-xl p-5">
          <h3 className="mb-4 font-display text-base font-bold text-gradient-magical">
            Connection Timeline
          </h3>
          <TimelineChart data={connectionTimeline} />
        </div>
      </div>

      {/* ── Second Row ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Networking Heatmap */}
        <div className="card-magical rounded-xl p-5">
          <h3 className="mb-4 font-display text-base font-bold text-gradient-magical">
            Networking Heatmap (24h)
          </h3>
          <HeatmapGrid data={networkingHeatmap} />
        </div>

        {/* Exhibitor Stats */}
        <div className="card-magical rounded-xl p-5">
          <h3 className="mb-4 font-display text-base font-bold text-gradient-magical">
            Exhibitor Stats
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="font-display text-2xl font-extrabold text-neon-cyan">
                {exhibitorStats.totalExhibitors}
              </p>
              <p className="text-xs text-text-secondary">Exhibitors</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl font-extrabold text-gold">
                {exhibitorStats.totalVisitors}
              </p>
              <p className="text-xs text-text-secondary">Visitors</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl font-extrabold text-neon-pink">
                {exhibitorStats.totalLeads}
              </p>
              <p className="text-xs text-text-secondary">Leads</p>
            </div>
          </div>
          {exhibitorStats.totalExhibitors > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Avg Visitors/Exhibitor</span>
                <span className="font-semibold text-text-primary">
                  {(exhibitorStats.totalVisitors / exhibitorStats.totalExhibitors).toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Avg Leads/Exhibitor</span>
                <span className="font-semibold text-text-primary">
                  {(exhibitorStats.totalLeads / exhibitorStats.totalExhibitors).toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Conversion Rate</span>
                <span className="font-semibold text-text-primary">
                  {exhibitorStats.totalVisitors > 0
                    ? `${((exhibitorStats.totalLeads / exhibitorStats.totalVisitors) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
