import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserDetail, banUser, suspendUser, restoreUser, type UserDetail } from '@/api/admin';
import { reviewOrganizerRequest } from '@/api/users';
import { formatDate } from '@/utils/helpers';
import { showApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

// ─── Info Row ───────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: string | number | undefined | null }> = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-border-subtle last:border-0">
    <span className="text-sm text-text-tertiary">{label}</span>
    <span className="text-sm text-text-primary font-medium">{value ?? '-'}</span>
  </div>
);

// ─── Status Badge ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    suspended: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    banned: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status}
    </span>
  );
};

// ─── User Detail Page ───────────────────────────────────────────────────────

const AdminUserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const data = await getUserDetail(userId);
        setUser(data);
      } catch (err: any) {
        showApiError(err, 'Failed to load user details');
        navigate('/admin/users');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId, navigate]);

  const handleAction = async (action: 'ban' | 'suspend' | 'restore') => {
    if (!userId) return;
    setActionLoading(true);
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
      // Refresh user data
      const data = await getUserDetail(userId);
      setUser(data);
    } catch (err: any) {
      showApiError(err, `Failed to ${action} user`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await reviewOrganizerRequest(userId, status);
      toast.success(
        status === 'approved' ? 'Approved — user is now an organizer' : 'Application rejected',
      );
      const data = await getUserDetail(userId);
      setUser(data);
    } catch (err: any) {
      showApiError(err, `Failed to ${status === 'approved' ? 'approve' : 'reject'} application`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-tertiary">User not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Users
      </button>

      {/* Profile Header */}
      <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-surface-2 flex items-center justify-center text-xl font-bold text-text-secondary overflow-hidden flex-shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (user.displayName?.[0] || user.email?.[0] || '?').toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-text-primary">{user.displayName || 'Unknown'}</h1>
              <StatusBadge status={user.status || 'active'} />
              {user.role === 'admin' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold/20 text-gold border border-gold/30">
                  Admin
                </span>
              )}
            </div>
            <p className="text-text-secondary mt-1">{user.email}</p>
            {user.company && <p className="text-text-tertiary text-sm mt-0.5">{user.company}</p>}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border-subtle bg-surface-1 p-4 text-center">
          <p className="text-2xl font-bold text-neon-cyan">{user.cardsCount ?? 0}</p>
          <p className="text-xs text-text-tertiary mt-1">Cards</p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface-1 p-4 text-center">
          <p className="text-2xl font-bold text-gold">{user.connectionsCount ?? 0}</p>
          <p className="text-xs text-text-tertiary mt-1">Connections</p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface-1 p-4 text-center">
          <p className="text-2xl font-bold text-neon-purple">{user.eventsJoinedCount ?? 0}</p>
          <p className="text-xs text-text-tertiary mt-1">Events Joined</p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface-1 p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{user.eventsCreatedCount ?? 0}</p>
          <p className="text-xs text-text-tertiary mt-1">Events Created</p>
        </div>
      </div>

      {/* Profile Details */}
      <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Profile Details</h2>
        <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <InfoRow label="User ID" value={user.id} />
          <InfoRow label="Firebase UID" value={user.firebaseUid} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Display Name" value={user.displayName} />
          <InfoRow label="Title" value={user.title} />
          <InfoRow label="Company" value={user.company} />
          <InfoRow label="Industry" value={user.industry} />
          <InfoRow label="Location" value={user.location} />
          <InfoRow label="Timezone" value={user.timezone} />
          <InfoRow label="Bio" value={user.bio} />
          <InfoRow label="Role" value={user.role} />
          <InfoRow label="Status" value={user.status} />
          <InfoRow label="Created At" value={user.createdAt ? formatDate(user.createdAt) : '-'} />
        </div>
      </div>

      {/* Organizer Application */}
      {user.organizerRequest && user.organizerRequest.status !== 'none' && (
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Organizer Application</h2>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                user.organizerRequest.status === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  : user.organizerRequest.status === 'approved'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}
            >
              {user.organizerRequest.status}
            </span>
          </div>

          <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
            <InfoRow label="Company" value={user.organizerRequest.company} />
            <InfoRow label="Job Title" value={user.organizerRequest.jobTitle} />
            <InfoRow
              label="Requested"
              value={
                user.organizerRequest.requestedAt
                  ? formatDate(user.organizerRequest.requestedAt)
                  : '-'
              }
            />
            <InfoRow
              label="Reviewed"
              value={
                user.organizerRequest.reviewedAt
                  ? formatDate(user.organizerRequest.reviewedAt)
                  : '-'
              }
            />
          </div>

          {user.organizerRequest.reason && (
            <div className="mt-4">
              <p className="text-sm text-text-tertiary mb-1">Reason</p>
              <p className="text-sm text-text-primary whitespace-pre-wrap">
                {user.organizerRequest.reason}
              </p>
            </div>
          )}

          {user.organizerRequest.status === 'pending' && (
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => handleReview('approved')}
                disabled={actionLoading}
                className="rounded-xl px-5 py-2.5 text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Approve — make organizer'}
              </button>
              <button
                onClick={() => handleReview('rejected')}
                disabled={actionLoading}
                className="rounded-xl px-5 py-2.5 text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Reject'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {user.status !== 'banned' && (
          <button
            onClick={() => handleAction('ban')}
            disabled={actionLoading}
            className="rounded-xl px-5 py-2.5 text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            {actionLoading ? 'Processing...' : 'Ban User'}
          </button>
        )}
        {user.status !== 'suspended' && user.status !== 'banned' && (
          <button
            onClick={() => handleAction('suspend')}
            disabled={actionLoading}
            className="rounded-xl px-5 py-2.5 text-sm font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
          >
            {actionLoading ? 'Processing...' : 'Suspend User'}
          </button>
        )}
        {(user.status === 'banned' || user.status === 'suspended') && (
          <button
            onClick={() => handleAction('restore')}
            disabled={actionLoading}
            className="rounded-xl px-5 py-2.5 text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors disabled:opacity-50"
          >
            {actionLoading ? 'Processing...' : 'Restore User'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminUserDetailPage;
