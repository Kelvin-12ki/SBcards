import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, type DashboardStats } from '@/api/admin';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Stat Card Component ────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  link?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, link }) => {
  const CardContent = () => (
    <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-black/10 hover:-translate-y-0.5 group cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-tertiary">{label}</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{value.toLocaleString()}</p>
        </div>
        <div className={`rounded-xl p-3 ${color}`}>
          {icon}
        </div>
      </div>
      {/* Decorative gradient bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color.replace('bg-', 'from-').replace('/20', '/40')} to-transparent`} />
    </div>
  );

  if (link) {
    return (
      <Link to={link}>
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
};

// ─── Dashboard Page ─────────────────────────────────────────────────────────

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading stats</p>
          <p className="text-text-tertiary text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Mock chart data (will be replaced by real analytics endpoint)
  const chartData = [
    { name: 'Mon', users: 12, cards: 8, connections: 5 },
    { name: 'Tue', users: 19, cards: 15, connections: 10 },
    { name: 'Wed', users: 15, cards: 12, connections: 8 },
    { name: 'Thu', users: 25, cards: 20, connections: 14 },
    { name: 'Fri', users: 22, cards: 18, connections: 12 },
    { name: 'Sat', users: 18, cards: 14, connections: 9 },
    { name: 'Sun', users: 20, cards: 16, connections: 11 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-tertiary mt-1">Welcome to the admin panel. Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          color="bg-neon-cyan/20 text-neon-cyan"
          link="/admin/users"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total Cards"
          value={stats?.totalCards ?? 0}
          color="bg-neon-purple/20 text-neon-purple"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          }
        />
        <StatCard
          label="Connections"
          value={stats?.totalConnections ?? 0}
          color="bg-gold/20 text-gold"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          }
        />
        <StatCard
          label="Events"
          value={stats?.totalEvents ?? 0}
          color="bg-green-500/20 text-green-400"
          link="/admin/events"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
        />
      </div>

      {/* New Users Today/This Week */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
          <p className="text-sm font-medium text-text-tertiary">New Users Today</p>
          <p className="mt-2 text-3xl font-bold text-neon-cyan">{stats?.newUsersToday ?? 0}</p>
          <p className="mt-1 text-xs text-text-tertiary">
            {stats?.newUsersThisWeek ?? 0} new users this week
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
          <p className="text-sm font-medium text-text-tertiary">New Users This Week</p>
          <p className="mt-2 text-3xl font-bold text-gold">{stats?.newUsersThisWeek ?? 0}</p>
          <p className="mt-1 text-xs text-text-tertiary">
            vs {stats?.newUsersToday ?? 0} today
          </p>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">7-Day Activity</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15,15,25,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Line type="monotone" dataKey="users" stroke="#00d4ff" strokeWidth={2} dot={{ fill: '#00d4ff', r: 4 }} name="Users" />
              <Line type="monotone" dataKey="cards" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 4 }} name="Cards" />
              <Line type="monotone" dataKey="connections" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} name="Connections" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
