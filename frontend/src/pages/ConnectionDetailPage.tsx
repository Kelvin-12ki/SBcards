import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Trash2, Star, Briefcase } from 'lucide-react';
import { getConnection, deleteConnection, toggleFavorite } from '@/api/connections';
import { findOrCreateConversation } from '@/api/messaging';
import { useAuth } from '@/auth/useAuth';
import type { Connection } from '@/types/connection';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

const ConnectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id || '';

  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const data = await getConnection(id);
        setConnection(data);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load connection.');
        navigate('/connections');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // Determine who the "other person" is
  const getOtherPerson = (): { id: string; displayName?: string; email: string; avatarUrl?: string; title?: string; company?: string } | null => {
    if (!connection) return null;
    if (connection.userId === currentUserId) {
      // I am the sender → other person is the connected user
      return connection.connectedUser ?? { id: connection.connectedUserId, email: '' };
    }
    // I am the recipient → other person is the sender
    return connection.senderUser ?? { id: connection.userId, email: '' };
  };

  const otherPerson = getOtherPerson();
  const displayName =
    otherPerson?.displayName || otherPerson?.email || 'Unknown User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleMessage = async () => {
    if (!otherPerson?.id) {
      console.warn('[handleMessage] otherPerson is null — connection:', connection);
      toast.error('Unable to determine user to message.');
      return;
    }
    setMessaging(true);
    try {
      const conversation = await findOrCreateConversation(otherPerson.id);
      toast.success('Opening conversation...');
      navigate(`/messages?conversation=${conversation.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to start conversation.';
      console.error('[handleMessage] Failed to start conversation:', err);
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setMessaging(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!connection) return;
    try {
      const updated = await toggleFavorite(connection.id);
      setConnection(updated);
      toast.success(updated.isFavorite ? 'Added to favorites!' : 'Removed from favorites.');
    } catch {
      toast.error('Failed to update.');
    }
  };

  const handleRemove = async () => {
    if (!connection) return;
    if (!window.confirm('Remove this connection?')) return;
    try {
      await deleteConnection(connection.id);
      toast.success('Connection removed.');
      navigate('/connections');
    } catch {
      toast.error('Failed to remove connection.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!connection) return null;

  return (
    <div className="min-h-screen bg-background p-6 max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        to="/connections"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-neon-cyan transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Connections
      </Link>

      {/* Profile card */}
      <div className="card-magical rounded-2xl border border-border-subtle bg-surface-1 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            {otherPerson?.avatarUrl ? (
              <img
                src={otherPerson.avatarUrl}
                alt={displayName}
                className="h-20 w-20 rounded-full object-cover border-2 border-neon-cyan/30"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-magical text-2xl font-bold text-white">
                {initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-surface-1 bg-success animate-glow-pulse" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-gradient-gold truncate">
                {displayName}
              </h1>
              <button
                onClick={handleToggleFavorite}
                className="flex-shrink-0 transition-transform hover:scale-110"
                aria-label={connection.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star
                  className={`h-6 w-6 ${connection.isFavorite ? 'text-gold fill-gold' : 'text-text-tertiary'}`}
                />
              </button>
            </div>

            {(otherPerson?.title || otherPerson?.company) && (
              <p className="text-sm text-text-secondary mt-1 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-text-tertiary" />
                {[otherPerson?.title, otherPerson?.company].filter(Boolean).join(' · ')}
              </p>
            )}

            {otherPerson?.email && (
              <p className="text-sm text-text-tertiary mt-1 flex items-center gap-1.5">
                {otherPerson.email}
              </p>
            )}

            <div className="flex items-center gap-3 mt-3">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                connection.status === 'accepted'
                  ? 'bg-success/10 text-success border border-success/20'
                  : connection.status === 'pending'
                  ? 'bg-warning/10 text-warning border border-warning/20'
                  : 'bg-surface-2 text-text-secondary border border-border-subtle'
              }`}>
                {connection.status === 'accepted' && <MessageSquare className="h-3 w-3" />}
                {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
              </span>
              <span className="text-xs text-text-tertiary">
                Connected {new Date(connection.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {connection.status === 'accepted' ? (
          <button
            onClick={handleMessage}
            disabled={messaging}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-neon-purple/10 px-5 py-3 text-sm font-semibold text-neon-purple transition-all hover:bg-neon-purple/20 hover:scale-[1.02] disabled:opacity-50"
          >
            <MessageSquare className="h-4 w-4" />
            {messaging ? 'Opening chat...' : 'Send Message'}
          </button>
        ) : connection.status === 'pending' ? (
          <div className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-warning/10 px-5 py-3 text-sm font-semibold text-warning border border-warning/20">
            <MessageSquare className="h-4 w-4" />
            Connection Pending — messaging available after acceptance
          </div>
        ) : null}

        <Link
          to={`/profile/${otherPerson?.id || ''}`}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-surface-2 px-5 py-3 text-sm font-semibold text-text-secondary transition-all hover:bg-surface-3 hover:text-neon-cyan border border-border-subtle"
        >
          View Full Profile
        </Link>

        <button
          onClick={handleRemove}
          className="flex items-center justify-center gap-2 rounded-xl border border-danger/20 bg-danger/5 px-5 py-3 text-sm font-semibold text-danger transition-all hover:bg-danger/10"
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </button>
      </div>
    </div>
  );
};

export default ConnectionDetailPage;
