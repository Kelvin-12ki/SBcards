import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, X, Clock, Send } from 'lucide-react';
import { getConnections, getFavoriteConnections, getIncomingRequests, getOutgoingRequests, acceptRequest, declineRequest, cancelRequest } from '@/api/connections';
import type { Connection } from '@/types/connection';
import ConnectionCard from '@/components/connections/ConnectionCard';
import ConnectionFilters, { type ConnectionFiltersState } from '@/components/connections/ConnectionFilters';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/utils/helpers';
import toast from 'react-hot-toast';

type ViewMode = 'all' | 'favorites' | 'recent' | 'requests' | 'sent';

const ConnectionsPage: React.FC = () => {
  const navigate = useNavigate();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Connection[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [filters, setFilters] = useState<ConnectionFiltersState>({});
  const [actingOn, setActingOn] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [conns, incoming, outgoing] = await Promise.all([
        getConnections({ search: filters.search, status: filters.status, tag: filters.tag }),
        getIncomingRequests(),
        getOutgoingRequests(),
      ]);

      setConnections(conns);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load connections.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAccept = async (connectionId: string) => {
    setActingOn(connectionId);
    try {
      await acceptRequest(connectionId);
      toast.success('Connection accepted!');
      fetchAll();
    } catch {
      toast.error('Failed to accept request.');
    } finally {
      setActingOn(null);
    }
  };

  const handleDecline = async (connectionId: string) => {
    setActingOn(connectionId);
    try {
      await declineRequest(connectionId);
      toast('Request declined', { icon: '👋' });
      fetchAll();
    } catch {
      toast.error('Failed to decline request.');
    } finally {
      setActingOn(null);
    }
  };

  const handleCancel = async (connectionId: string) => {
    setActingOn(connectionId);
    try {
      await cancelRequest(connectionId);
      toast('Request cancelled', { icon: '🗑️' });
      fetchAll();
    } catch {
      toast.error('Failed to cancel request.');
    } finally {
      setActingOn(null);
    }
  };

  const viewTabs: { key: ViewMode; label: string; count?: number }[] = [
    { key: 'all', label: 'Connections' },
    { key: 'requests', label: 'Requests', count: incomingRequests.length },
    { key: 'sent', label: 'Sent', count: outgoingRequests.length },
    { key: 'favorites', label: 'Favorites' },
    { key: 'recent', label: 'Recent' },
  ];

  const displayData = (() => {
    switch (viewMode) {
      case 'requests':
        return incomingRequests;
      case 'sent':
        return outgoingRequests;
      case 'favorites':
        return connections.filter((c) => c.isFavorite);
      case 'recent':
        return [...connections].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      default:
        return connections;
    }
  })();

  return (
    <div className="min-h-screen bg-background space-y-6 md:space-y-8">
      {/* Header */}
      <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-gradient-magical">
        My Connections
      </h1>

      {/* View Tabs */}
      <div className="flex gap-1 border-b border-border-subtle overflow-x-auto">
        {viewTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setViewMode(tab.key)}
            className={cn(
              'relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap',
              viewMode === tab.key
                ? 'border-gold text-gold'
                : 'border-transparent text-text-secondary hover:text-text-primary',
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-gold-ink">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters (only on connections tab) */}
      {viewMode === 'all' && (
        <ConnectionFilters filters={filters} onChange={setFilters} />
      )}

      {/* Incoming Requests */}
      {viewMode === 'requests' && incomingRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-bold text-gradient-gold">
            People who want to connect
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {incomingRequests.map((req) => {
              const person = req.otherUser || req.senderUser || req.connectedUser;
              const displayName =
                person?.displayName || person?.email || 'Unknown User';
              const initials = displayName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={req.id}
                  className="card-magical rounded-2xl border border-gold/20 bg-surface-1 p-5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    {person?.avatarUrl ? (
                      <img
                        src={person.avatarUrl}
                        alt={displayName}
                        className="h-12 w-12 rounded-full object-cover border border-gold/30"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-magical text-sm font-bold text-white">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-text-primary truncate">
                        {displayName}
                      </p>
                      {(person?.title || person?.company) && (
                        <p className="text-xs text-text-secondary truncate">
                          {[person?.title, person?.company].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-text-tertiary mb-4">
                    Sent {new Date(req.createdAt).toLocaleDateString()}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(req.id)}
                      disabled={actingOn === req.id}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-gold to-gold-strong px-4 py-2.5 text-sm font-bold text-gold-ink transition-all hover:shadow-lg hover:shadow-gold/20 disabled:opacity-50"
                    >
                      {actingOn === req.id ? (
                        <Spinner size="sm" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(req.id)}
                      disabled={actingOn === req.id}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-surface-2 px-4 py-2.5 text-sm font-semibold text-text-secondary transition-all hover:border-danger/30 hover:text-danger disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outgoing Requests */}
      {viewMode === 'sent' && outgoingRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-bold text-gradient-gold">
            Pending requests you sent
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {outgoingRequests.map((req) => {
              const person = req.otherUser || req.connectedUser;
              const displayName =
                person?.displayName || person?.email || 'Unknown User';
              const initials = displayName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={req.id}
                  className="card-magical rounded-2xl border border-border-subtle bg-surface-1 p-5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    {person?.avatarUrl ? (
                      <img
                        src={person.avatarUrl}
                        alt={displayName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-3 text-sm font-bold text-text-secondary">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-text-primary truncate">
                        {displayName}
                      </p>
                      {(person?.title || person?.company) && (
                        <p className="text-xs text-text-secondary truncate">
                          {[person?.title, person?.company].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-0.5 text-[11px] font-semibold text-warning">
                      <Clock className="h-3 w-3" />
                      Pending
                    </span>
                    <span className="text-xs text-text-tertiary">
                      Sent {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCancel(req.id)}
                    disabled={actingOn === req.id}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-surface-2 px-4 py-2 text-sm font-semibold text-text-secondary transition-all hover:border-danger/30 hover:text-danger disabled:opacity-50"
                  >
                    {actingOn === req.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Cancel Request
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : displayData.length === 0 ? (
        <EmptyState
          icon={
            viewMode === 'requests' ? (
              <UserPlus className="h-8 w-8" />
            ) : viewMode === 'sent' ? (
              <Send className="h-8 w-8" />
            ) : (
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            )
          }
          title={
            viewMode === 'requests'
              ? 'No incoming requests'
              : viewMode === 'sent'
              ? 'No pending requests'
              : viewMode === 'favorites'
              ? 'No favorite connections'
              : 'No connections yet'
          }
          description={
            viewMode === 'requests'
              ? 'When someone wants to connect, their request will appear here.'
              : viewMode === 'sent'
              ? 'Connection requests you send will appear here.'
              : 'Scan a QR code or connect at an event!'
          }
          action={
            viewMode === 'all' || viewMode === 'favorites' || viewMode === 'recent'
              ? { label: 'Find People', onClick: () => navigate('/search') }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayData.map((conn) => (
            <ConnectionCard
              key={conn.id}
              connection={conn}
              onClick={() => navigate(`/connections/${conn.id}`)}
            />
          ))}
        </div>
      )}

      {/* FAB to search for people */}
      <button
        type="button"
        onClick={() => navigate('/search')}
        className="fixed bottom-24 md:bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full gradient-magical text-white shadow-lg shadow-neon-purple/30 hover:shadow-neon-purple/50 transition-all duration-300 hover:scale-105"
        aria-label="Find people"
      >
        <UserPlus className="h-6 w-6" />
      </button>
    </div>
  );
};

export default ConnectionsPage;
