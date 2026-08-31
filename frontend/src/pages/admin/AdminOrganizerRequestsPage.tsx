import React, { useEffect, useState, useCallback } from 'react';
import {
  getOrganizerRequests,
  approveOrganizerRequest,
  rejectOrganizerRequest,
  type OrganizerRequest,
} from '@/api/admin';
import { formatDate } from '@/utils/helpers';
import { showApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

// ─── Status Badge ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    none: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}
    >
      {status}
    </span>
  );
};

// ─── Organizer Requests Page ────────────────────────────────────────────────

const AdminOrganizerRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<OrganizerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getOrganizerRequests();
      setRequests(data);
    } catch (err: any) {
      showApiError(err, 'Failed to load organizer requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (userId: string) => {
    if (!window.confirm('Approve this organizer request? The user will be promoted to the organizer role.')) return;
    try {
      await approveOrganizerRequest(userId);
      toast.success('Organizer request approved!');
      fetchRequests();
    } catch (err: any) {
      showApiError(err, 'Failed to approve request');
    }
  };

  const handleReject = async (userId: string) => {
    if (!window.confirm('Reject this organizer request?')) return;
    try {
      await rejectOrganizerRequest(userId);
      toast.success('Organizer request rejected');
      fetchRequests();
    } catch (err: any) {
      showApiError(err, 'Failed to reject request');
    }
  };

  const pendingCount = requests.filter((r) => r.organizerRequest?.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Organizer Requests</h1>
        <p className="text-text-tertiary mt-1">
          Review and manage user applications to become organizers.
          {pendingCount > 0 && (
            <span className="ml-2 text-yellow-400 font-medium">
              ({pendingCount} pending)
            </span>
          )}
        </p>
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-surface-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider hidden md:table-cell">Company</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider hidden lg:table-cell">Job Title</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider hidden xl:table-cell">Reason</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider hidden sm:table-cell">Applied</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-text-tertiary">
                  <div className="w-6 h-6 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-text-tertiary">
                  No organizer requests found.
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id} className="hover:bg-surface-2/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {request.avatarUrl ? (
                        <img
                          src={request.avatarUrl}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-text-tertiary text-xs font-medium">
                          {(request.displayName || request.email)?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-text-primary">
                          {request.displayName || 'No name'}
                        </p>
                        <p className="text-xs text-text-tertiary">{request.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                    {request.organizerRequest?.company || '-'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary hidden lg:table-cell">
                    {request.organizerRequest?.jobTitle || '-'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary hidden xl:table-cell max-w-[200px] truncate">
                    {request.organizerRequest?.reason || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={request.organizerRequest?.status || 'none'} />
                  </td>
                  <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">
                    {request.organizerRequest?.requestedAt
                      ? formatDate(request.organizerRequest.requestedAt)
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {request.organizerRequest?.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/10 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-text-tertiary">
                        {request.organizerRequest?.reviewedAt
                          ? `Reviewed ${formatDate(request.organizerRequest.reviewedAt)}`
                          : '-'}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrganizerRequestsPage;
