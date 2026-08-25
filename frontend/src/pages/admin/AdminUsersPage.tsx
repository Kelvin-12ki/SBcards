import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listUsers, banUser, suspendUser, restoreUser, type PaginatedUsers } from '@/api/admin';
import { getOrganizerRequests, reviewOrganizerRequest } from '@/api/users';
import type { User } from '@/types/user';
import { timeAgo } from '@/utils/helpers';
import { showApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

// ─── Status Badge ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    suspended: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    banned: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status}
    </span>
  );
};

// ─── Role Badge ─────────────────────────────────────────────────────────────

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gold/20 text-gold border border-gold/30">
        Admin
      </span>
    );
  }
  if (role === 'organizer') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
        Organizer
      </span>
    );
  }
  // 'attendee' and the legacy 'user' value read the same to an admin.
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-2 text-text-tertiary border border-border-subtle">
      Attendee
    </span>
  );
};

// ─── Pending organizer applications ─────────────────────────────────────────

const PendingOrganizerRequests: React.FC = () => {
  const [requests, setRequests] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRequests(await getOrganizerRequests());
    } catch (err: any) {
      showApiError(err, 'Failed to load organizer applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (userId: string, status: 'approved' | 'rejected') => {
    setActing(userId);
    try {
      await reviewOrganizerRequest(userId, status);
      toast.success(status === 'approved' ? 'User is now an organizer' : 'Application rejected');
      // Drop it locally so the queue shrinks immediately.
      setRequests((prev) => prev.filter((r) => r.id !== userId));
    } catch (err: any) {
      showApiError(err, 'Failed to review application');
      load();
    } finally {
      setActing(null);
    }
  };

  if (loading || requests.length === 0) return null;

  return (
    <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5">
      <h2 className="text-lg font-semibold text-text-primary mb-1">
        Organizer applications
        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
          {requests.length} pending
        </span>
      </h2>
      <p className="text-sm text-text-tertiary mb-4">
        Approving grants the organizer role and the ability to create events.
      </p>

      <ul className="space-y-3">
        {requests.map((r) => (
          <li
            key={r.id}
            className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-1 p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <Link
                to={`/admin/users/${r.id}`}
                className="font-medium text-text-primary hover:text-gold transition-colors"
              >
                {r.displayName || r.email}
              </Link>
              <p className="text-xs text-text-tertiary">
                {[r.organizerRequest?.jobTitle, r.organizerRequest?.company]
                  .filter(Boolean)
                  .join(' · ') || r.email}
              </p>
              {r.organizerRequest?.reason && (
                <p className="mt-1.5 text-sm text-text-secondary">
                  {r.organizerRequest.reason}
                </p>
              )}
            </div>
            <div className="flex flex-shrink-0 gap-2">
              <button
                onClick={() => review(r.id, 'approved')}
                disabled={acting === r.id}
                className="rounded-xl px-4 py-2 text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => review(r.id, 'rejected')}
                disabled={acting === r.id}
                className="rounded-xl px-4 py-2 text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ─── Users Page ─────────────────────────────────────────────────────────────

const AdminUsersPage: React.FC = () => {
  const [usersData, setUsersData] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listUsers(search, page, 20);
      setUsersData(data);
    } catch (err: any) {
      showApiError(err, 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleAction = async (userId: string, action: 'ban' | 'suspend' | 'restore') => {
    setActionLoading(userId);
    try {
      if (action === 'ban') {
        await banUser(userId);
        toast.success('User banned');
      } else if (action === 'suspend') {
        await suspendUser(userId);
        toast.success('User suspended');
      } else {
        await restoreUser(userId);
        toast.success('User restored');
      }
      fetchUsers();
    } catch (err: any) {
      showApiError(err, `Failed to ${action} user`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Users</h1>
        <p className="text-text-tertiary mt-1">Manage all registered users.</p>
      </div>

      {/* Pending organizer applications — hides itself when the queue is empty */}
      <PendingOrganizerRequests />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, company..."
            className="w-full rounded-xl border border-border-subtle bg-surface-1 pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:border-neon-cyan transition-all"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-neon-cyan/20 text-neon-cyan px-4 py-2.5 text-sm font-medium hover:bg-neon-cyan/30 transition-colors border border-neon-cyan/30"
        >
          Search
        </button>
      </form>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-surface-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider hidden sm:table-cell">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider hidden lg:table-cell">Joined</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-text-tertiary">
                  <div className="w-6 h-6 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : usersData?.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-text-tertiary">
                  No users found.
                </td>
              </tr>
            ) : (
              usersData?.data.map((user: any) => (
                <tr key={user.id || user._id} className="hover:bg-surface-2/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-surface-2 flex items-center justify-center text-xs font-medium text-text-secondary overflow-hidden">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (user.displayName?.[0] || user.email?.[0] || '?').toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{user.displayName || 'Unknown'}</p>
                        {user.company && (
                          <p className="text-xs text-text-tertiary">{user.company}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{user.email}</td>
                  <td className="px-4 py-3 hidden sm:table-cell"><RoleBadge role={user.role || 'user'} /></td>
                  <td className="px-4 py-3"><StatusBadge status={user.status || 'active'} /></td>
                  <td className="px-4 py-3 text-text-tertiary hidden lg:table-cell">{user.createdAt ? timeAgo(user.createdAt) : '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/users/${user.id || user._id}`}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
                      >
                        View
                      </Link>
                      {user.status !== 'banned' && (
                        <button
                          onClick={() => handleAction(user.id || user._id, 'ban')}
                          disabled={actionLoading === (user.id || user._id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === (user.id || user._id) ? '...' : 'Ban'}
                        </button>
                      )}
                      {user.status !== 'suspended' && user.status !== 'banned' && (
                        <button
                          onClick={() => handleAction(user.id || user._id, 'suspend')}
                          disabled={actionLoading === (user.id || user._id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-yellow-400 hover:bg-yellow-500/10 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === (user.id || user._id) ? '...' : 'Suspend'}
                        </button>
                      )}
                      {(user.status === 'banned' || user.status === 'suspended') && (
                        <button
                          onClick={() => handleAction(user.id || user._id, 'restore')}
                          disabled={actionLoading === (user.id || user._id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === (user.id || user._id) ? '...' : 'Restore'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {usersData && usersData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-tertiary">
            Showing {(usersData.page - 1) * usersData.limit + 1}-{Math.min(usersData.page * usersData.limit, usersData.total)} of {usersData.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-xl px-4 py-2 text-sm font-medium bg-surface-1 border border-border-subtle text-text-secondary hover:bg-surface-2 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(usersData.totalPages, p + 1))}
              disabled={page >= usersData.totalPages}
              className="rounded-xl px-4 py-2 text-sm font-medium bg-surface-1 border border-border-subtle text-text-secondary hover:bg-surface-2 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
