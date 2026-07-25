import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Star,
  Target,
  Gift,
  Globe,
  MessageSquare,
  UserPlus,
  UserCheck,
  X,
  Clock,
  Linkedin,
  Twitter,
  Phone,
  Mail,
  ExternalLink,
  Hash,
  Award,
  Loader2,
} from 'lucide-react';
import { getPublicProfile, getUserCards } from '@/api/users';
import { createConnection, getConnections, getIncomingRequests, getOutgoingRequests, acceptRequest, declineRequest, cancelRequest } from '@/api/connections';
import { findOrCreateConversation } from '@/api/messaging';
import type { User } from '@/types/user';
import type { Card } from '@/types/card';
import type { Connection } from '@/types/connection';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import { cn } from '@/utils/helpers';
import toast from 'react-hot-toast';

/* ── Helpers ── */

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getSeniorityColor(level?: string): string {
  switch (level) {
    case 'entry':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'mid':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'senior':
      return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'executive':
      return 'bg-gold/15 text-gold border-gold/30';
    default:
      return 'bg-surface-2 text-text-secondary border-border-subtle';
  }
}

function getCategoryColor(category?: string): string {
  switch (category?.toLowerCase()) {
    case 'technical':
    case 'tech':
      return 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20';
    case 'design':
      return 'bg-neon-purple/10 text-neon-purple border-neon-purple/20';
    case 'business':
      return 'bg-gold/10 text-gold border-gold/20';
    case 'marketing':
      return 'bg-warning/10 text-warning border-warning/20';
    default:
      return 'bg-surface-2 text-text-secondary border-border-subtle';
  }
}

/* ── Theme accent color map ── */

const themeAccentMap: Record<string, string> = {
  classic: 'border-l-neon-cyan',
  modern: 'border-l-neon-purple',
  gold: 'border-l-gold',
  dark: 'border-l-text-primary',
  minimal: 'border-l-text-secondary',
};

function getThemeAccent(theme?: string): string {
  return themeAccentMap[theme ?? ''] || 'border-l-neon-cyan';
}

/* ── Component ── */

const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted'>('none');
  const [existingConnectionId, setExistingConnectionId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError('No user ID provided');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [userData, userCards] = await Promise.all([
          getPublicProfile(userId),
          getUserCards(userId),
        ]);
        setProfile(userData);
        setCards(userCards);

        // Check existing connection status
        try {
          const [allConnections, incoming, outgoing] = await Promise.all([
            getConnections(),
            getIncomingRequests(),
            getOutgoingRequests(),
          ]);

          // Filter to only accepted connections
          const accepted = allConnections.filter((c) => c.status === 'accepted');

          // Check if already connected
          const isConnected = accepted.some(
            (c) => c.connectedUserId === userId || c.userId === userId,
          );
          if (isConnected) {
            setConnectionStatus('accepted');
            const conn = accepted.find(
              (c) => c.connectedUserId === userId || c.userId === userId,
            );
            if (conn) setExistingConnectionId(conn.id);
            return;
          }

          // Check if there's an incoming request from this user
          const incomingFromUser = incoming.find((c) => c.userId === userId);
          if (incomingFromUser) {
            setConnectionStatus('pending_received');
            setExistingConnectionId(incomingFromUser.id);
            return;
          }

          // Check if there's an outgoing request to this user
          const outgoingToUser = outgoing.find((c) => c.connectedUserId === userId);
          if (outgoingToUser) {
            setConnectionStatus('pending_sent');
            setExistingConnectionId(outgoingToUser.id);
            return;
          }

          setConnectionStatus('none');
        } catch {
          // Connection check failed — just show Connect button
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setError('User not found');
        } else {
          setError(err?.response?.data?.message || err?.message || 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  /* ── Connect / Message handlers ── */

  const handleConnect = async () => {
    if (!profile?.id) return;
    setConnecting(true);
    try {
      await createConnection({ connectedUserId: profile.id, source: 'profile' });
      setConnectionStatus('pending_sent');
      toast.success(`Connection request sent to ${profile.displayName || 'User'}!`);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast('Already connected or request pending', { icon: 'ℹ️' });
      } else {
        toast.error('Failed to send request. Try again.');
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleAccept = async () => {
    if (!existingConnectionId) return;
    setConnecting(true);
    try {
      await acceptRequest(existingConnectionId);
      setConnectionStatus('accepted');
      toast.success('Connection accepted!');
    } catch {
      toast.error('Failed to accept request.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDecline = async () => {
    if (!existingConnectionId) return;
    setConnecting(true);
    try {
      await declineRequest(existingConnectionId);
      setConnectionStatus('none');
      setExistingConnectionId(null);
      toast('Request declined', { icon: '👋' });
    } catch {
      toast.error('Failed to decline request.');
    } finally {
      setConnecting(false);
    }
  };

  const handleCancel = async () => {
    if (!existingConnectionId) return;
    setConnecting(true);
    try {
      await cancelRequest(existingConnectionId);
      setConnectionStatus('none');
      setExistingConnectionId(null);
      toast('Request cancelled', { icon: '🗑️' });
    } catch {
      toast.error('Failed to cancel request.');
    } finally {
      setConnecting(false);
    }
  };

  const handleMessage = async () => {
    if (!profile?.id) return;
    setMessaging(true);
    try {
      const conversation = await findOrCreateConversation(profile.id);
      navigate(`/messages?conversation=${conversation.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to start conversation.';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setMessaging(false);
    }
  };

  /* ── Loading state ── */

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-text-secondary">Loading profile…</p>
      </div>
    );
  }

  /* ── Error state ── */

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="card-magical rounded-2xl border border-border-subtle bg-surface-1 p-10 max-w-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 mx-auto mb-4">
            <UserPlus className="h-7 w-7 text-danger" />
          </div>
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">
            {error === 'User not found' ? 'User Not Found' : 'Something Went Wrong'}
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            {error === 'User not found'
              ? 'This user does not exist or may have been removed.'
              : error || 'An unexpected error occurred while loading the profile.'}
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 rounded-xl bg-surface-2 px-5 py-2.5 text-sm font-semibold text-text-primary transition-all hover:bg-surface-3 hover:text-neon-cyan"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  /* ── Main render ── */

  const initials = getInitials(profile.displayName);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* ── Back link ── */}
      <Link
        to="/search"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-neon-cyan transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Search
      </Link>

      {/* ════════════════════════════════════════════════
         PROFILE HEADER
         ════════════════════════════════════════════════ */}
      <section className="card-magical rounded-2xl border border-border-subtle bg-surface-1 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName || 'Profile'}
                className="h-20 w-20 rounded-full object-cover border-2 border-neon-cyan/30 shadow-lg shadow-neon-cyan/10"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-magical text-2xl font-bold text-white shadow-lg shadow-neon-purple/30">
                {initials}
              </div>
            )}
            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-surface-1 bg-success animate-glow-pulse" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-gradient-gold">
              {profile.displayName || 'User'}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              {profile.title && (
                <span className="text-sm text-text-secondary">{profile.title}</span>
              )}
              {profile.company && (
                <span className="inline-flex items-center gap-1 text-sm text-text-tertiary">
                  <Briefcase className="h-3.5 w-3.5" />
                  {profile.company}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {/* Industry badge */}
              {profile.industry && (
                <Badge variant="primary" className="text-[11px]">{profile.industry}</Badge>
              )}
              {/* Seniority badge */}
              {profile.seniority && (
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                  getSeniorityColor(profile.seniority),
                )}>
                  <Award className="h-3 w-3" />
                  {profile.seniority.charAt(0).toUpperCase() + profile.seniority.slice(1)}
                </span>
              )}
              {/* Location */}
              {profile.location && (
                <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
                  <MapPin className="h-3 w-3" />
                  {profile.location}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
            {/* Connection status buttons */}
            {connectionStatus === 'none' && (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="flex items-center gap-1.5 rounded-xl bg-neon-cyan/10 px-4 py-2 text-sm font-semibold text-neon-cyan transition-all hover:bg-neon-cyan/20 hover:scale-105 disabled:opacity-50"
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {connecting ? 'Sending...' : 'Connect'}
              </button>
            )}

            {connectionStatus === 'pending_sent' && (
              <button
                onClick={handleCancel}
                disabled={connecting}
                className="flex items-center gap-1.5 rounded-xl bg-warning/10 px-4 py-2 text-sm font-semibold text-warning transition-all hover:bg-warning/20 hover:scale-105 disabled:opacity-50"
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                {connecting ? 'Cancelling...' : 'Pending'}
              </button>
            )}

            {connectionStatus === 'pending_received' && (
              <>
                <button
                  onClick={handleAccept}
                  disabled={connecting}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gold to-gold-strong px-4 py-2 text-sm font-bold text-gold-ink transition-all hover:shadow-lg hover:shadow-gold/20 disabled:opacity-50"
                >
                  {connecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserCheck className="h-4 w-4" />
                  )}
                  Accept
                </button>
                <button
                  onClick={handleDecline}
                  disabled={connecting}
                  className="flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-2 px-4 py-2 text-sm font-semibold text-text-secondary transition-all hover:border-danger/30 hover:text-danger disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Decline
                </button>
              </>
            )}

            {connectionStatus === 'accepted' && (
              <span className="flex items-center gap-1.5 rounded-xl bg-success/10 px-4 py-2 text-sm font-semibold text-success">
                <UserCheck className="h-4 w-4" />
                Connected
              </span>
            )}

            {/* Message button — always visible */}
            <button
              onClick={handleMessage}
              disabled={messaging}
              className="flex items-center gap-1.5 rounded-xl bg-neon-purple/10 px-4 py-2 text-sm font-semibold text-neon-purple transition-all hover:bg-neon-purple/20 hover:scale-105 disabled:opacity-50"
            >
              <MessageSquare className="h-4 w-4" />
              {messaging ? '...' : 'Message'}
            </button>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-5 text-sm text-text-secondary leading-relaxed border-t border-border-subtle pt-4">
            {profile.bio}
          </p>
        )}
      </section>

      {/* ════════════════════════════════════════════════
         SKILLS
         ════════════════════════════════════════════════ */}
      {profile.skills && profile.skills.length > 0 && (
        <section className="card-magical rounded-2xl border border-border-subtle bg-surface-1 p-5 space-y-3">
          <h2 className="font-display text-base font-bold text-gradient-gold flex items-center gap-2">
            <Star className="h-4 w-4 text-gold" />
            Skills
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((skill, i) => (
              <Badge key={i} variant="primary">{skill}</Badge>
            ))}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
         INTERESTS
         ════════════════════════════════════════════════ */}
      {profile.interests && profile.interests.length > 0 && (
        <section className="card-magical rounded-2xl border border-border-subtle bg-surface-1 p-5 space-y-3">
          <h2 className="font-display text-base font-bold text-gradient-gold flex items-center gap-2">
            <Hash className="h-4 w-4 text-gold" />
            Interests
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {profile.interests.map((interest, i) => (
              <Badge key={i} variant="default">{interest}</Badge>
            ))}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
         LOOKING FOR / OFFERING
         ════════════════════════════════════════════════ */}
      {(profile.lookingFor && profile.lookingFor.length > 0) ||
       (profile.offering && profile.offering.length > 0) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.lookingFor && profile.lookingFor.length > 0 && (
            <section className="card-magical rounded-2xl border border-border-subtle bg-surface-1 p-5 space-y-3">
              <h2 className="font-display text-sm font-bold text-warning flex items-center gap-2">
                <Target className="h-4 w-4" />
                Looking For
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {profile.lookingFor.map((item, i) => (
                  <Badge key={i} variant="warning">{item}</Badge>
                ))}
              </div>
            </section>
          )}
          {profile.offering && profile.offering.length > 0 && (
            <section className="card-magical rounded-2xl border border-border-subtle bg-surface-1 p-5 space-y-3">
              <h2 className="font-display text-sm font-bold text-success flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Offering
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {profile.offering.map((item, i) => (
                  <Badge key={i} variant="success">{item}</Badge>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : null}

      {/* ════════════════════════════════════════════════
         BUSINESS CARDS
         ════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-gradient-gold">
            Business Cards
          </h2>
          <span className="text-xs text-text-tertiary bg-surface-1 px-2.5 py-1 rounded-full border border-border-subtle">
            {cards.length} {cards.length === 1 ? 'card' : 'cards'}
          </span>
        </div>

        {cards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card) => (
              <div
                key={card.id}
                className={cn(
                  'card-magical rounded-2xl border border-border-subtle bg-surface-1 p-5 transition-all duration-200 hover:border-gold/30 hover:shadow-glow-gold group',
                  'border-l-4',
                  getThemeAccent(card.theme),
                )}
              >
                {/* Card header */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Avatar */}
                  {card.avatarUrl ? (
                    <img
                      src={card.avatarUrl}
                      alt={card.fullName}
                      className="h-10 w-10 rounded-lg object-cover border border-border-subtle"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-magical text-sm font-bold text-white">
                      {getInitials(card.fullName)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-base font-bold text-text-primary truncate group-hover:text-neon-cyan transition-colors">
                      {card.fullName}
                    </h3>
                    {(card.headline || card.role) && (
                      <p className="text-xs text-text-secondary truncate">
                        {card.headline || card.role}
                      </p>
                    )}
                    {card.company && (
                      <p className="text-xs text-text-tertiary truncate">{card.company}</p>
                    )}
                  </div>
                  {card.isDefault && (
                    <span className="shrink-0 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold">
                      Default
                    </span>
                  )}
                </div>

                {/* Bio */}
                {card.bio && (
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-3">
                    {card.bio}
                  </p>
                )}

                {/* Contact details */}
                <div className="space-y-1.5 mb-3">
                  {card.email && (
                    <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{card.email}</span>
                    </div>
                  )}
                  {card.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span>{card.phone}</span>
                    </div>
                  )}
                  {card.website && (
                    <a
                      href={card.website.startsWith('http') ? card.website : `https://${card.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors"
                    >
                      <Globe className="h-3 w-3 shrink-0" />
                      <span className="truncate">{card.website}</span>
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  )}
                </div>

                {/* Social links */}
                {(card.linkedinUrl || card.twitterUrl) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
                    {card.linkedinUrl && (
                      <a
                        href={card.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-[10px] font-medium text-text-secondary hover:text-neon-cyan hover:bg-surface-3 transition-colors"
                      >
                        <Linkedin className="h-3 w-3" />
                        LinkedIn
                      </a>
                    )}
                    {card.twitterUrl && (
                      <a
                        href={card.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-[10px] font-medium text-text-secondary hover:text-neon-cyan hover:bg-surface-3 transition-colors"
                      >
                        <Twitter className="h-3 w-3" />
                        Twitter
                      </a>
                    )}
                  </div>
                )}

                {/* Card skills */}
                {card.skills && card.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-border-subtle">
                    {card.skills.slice(0, 4).map((skill, i) => (
                      <span
                        key={skill.id || i}
                        className={cn(
                          'inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold border',
                          getCategoryColor(skill.category),
                        )}
                      >
                        {skill.name}
                      </span>
                    ))}
                    {card.skills.length > 4 && (
                      <span className="inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-text-tertiary">
                        +{card.skills.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card-magical rounded-2xl border border-border-subtle bg-surface-1 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 mx-auto mb-3">
              <Star className="h-5 w-5 text-text-tertiary" />
            </div>
            <p className="text-sm text-text-secondary">
              No public cards available
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              This user hasn&apos;t created any business cards yet.
            </p>
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════════
         SOCIAL LINKS
         ════════════════════════════════════════════════ */}
      {(profile.whatsapp || profile.portfolioUrl) && (
        <section className="card-magical rounded-2xl border border-border-subtle bg-surface-1 p-5 space-y-3">
          <h2 className="font-display text-base font-bold text-gradient-gold flex items-center gap-2">
            <Globe className="h-4 w-4 text-gold" />
            Contact & Links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {profile.portfolioUrl && (
              <a
                href={profile.portfolioUrl.startsWith('http') ? profile.portfolioUrl : `https://${profile.portfolioUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm text-text-secondary hover:text-neon-cyan hover:bg-surface-3 transition-all group"
              >
                <Globe className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1">Portfolio</span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )}
            {profile.whatsapp && (
              <a
                href={`https://wa.me/${profile.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm text-text-secondary hover:text-success hover:bg-success/10 transition-all group"
              >
                <Phone className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1">WhatsApp</span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )}
          </div>
        </section>
      )}

      {/* Custom social links */}
      {profile.socialLinks && profile.socialLinks.length > 0 && (
        <section className="card-magical rounded-2xl border border-border-subtle bg-surface-1 p-5 space-y-3">
          <h2 className="font-display text-base font-bold text-gradient-gold flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-gold" />
            More Links
          </h2>
          <div className="space-y-2">
            {profile.socialLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm text-text-secondary hover:text-neon-cyan hover:bg-surface-3 transition-all group"
              >
                <Globe className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1">{link.label}</span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default PublicProfilePage;
