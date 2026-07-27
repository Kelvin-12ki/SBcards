import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CreditCard,
  Calendar,
  Clock,
  Briefcase,
  Building2,
  Star,
  Search,
  MessageSquare,
  UserPlus,
  ExternalLink,
} from 'lucide-react';
import type { SearchResponse, SearchResult } from '@/types/search';
import { cn, formatScore } from '@/utils/helpers';
import { findOrCreateConversation } from '@/api/messaging';
import { createConnection } from '@/api/connections';
import toast from 'react-hot-toast';

export interface SearchResultsProps {
  results: SearchResponse;
  onSelect: (result: SearchResult) => void;
  className?: string;
}

interface SectionDef {
  key: keyof SearchResponse['results'];
  label: string;
  icon: React.ReactNode;
}

const sections: SectionDef[] = [
  { key: 'users', label: 'People', icon: <Users className="h-4 w-4" /> },
  { key: 'cards', label: 'Cards', icon: <CreditCard className="h-4 w-4" /> },
  { key: 'events', label: 'Events', icon: <Calendar className="h-4 w-4" /> },
  { key: 'sessions', label: 'Sessions', icon: <Clock className="h-4 w-4" /> },
  { key: 'exhibitors', label: 'Exhibitors', icon: <Briefcase className="h-4 w-4" /> },
  { key: 'organizations', label: 'Organizations', icon: <Building2 className="h-4 w-4" /> },
];

const typeIconMap: Record<string, React.ReactNode> = {
  user: <Users className="h-4 w-4" />,
  card: <CreditCard className="h-4 w-4" />,
  event: <Calendar className="h-4 w-4" />,
  session: <Clock className="h-4 w-4" />,
  exhibitor: <Briefcase className="h-4 w-4" />,
  organization: <Building2 className="h-4 w-4" />,
};

/** Build a navigation URL for any result type */
function getResultUrl(result: any): string {
  switch (result.type) {
    case 'user':
      return `/profile/${result.id}`;
    case 'card':
      return `/profile/${result.userId || result.id}`;
    case 'event':
      return `/events/${result.id}`;
    case 'session':
      return `/events/${result.eventId}/schedule`;
    case 'exhibitor':
      return `/events/${result.eventId}/exhibitors/${result.id}`;
    case 'organization':
      return `/organizations/${result.id}`;
    default:
      return '#';
  }
}

/** Get display name for any result type */
function getResultTitle(result: any): string {
  return result.title || result.fullName || result.displayName || result.name || result.email || result.companyName || 'Unknown User';
}

/** Get subtitle for any result type */
function getResultSubtitle(result: any): string {
  if (result.type === 'user') {
    return [result.title, result.company].filter(Boolean).join(' at ');
  }
  if (result.type === 'card') {
    return [result.headline, result.company].filter(Boolean).join(' at ');
  }
  return result.subtitle || '';
}

/** Get initials for avatar fallback */
function getInitials(result: any): string {
  const name = getResultTitle(result);
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onSelect, className }) => {
  const navigate = useNavigate();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [messagingId, setMessagingId] = useState<string | null>(null);

  const hasResults = sections.some((s) => results?.results?.[s.key]?.length > 0);

  if (!hasResults) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
        <Search className="h-12 w-12 text-text-tertiary mb-4" />
        <h3 className="font-display text-lg font-bold text-text-primary">No results found</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Try adjusting your search terms or filters.
        </p>
      </div>
    );
  }

  const handleConnect = async (e: React.MouseEvent, result: any) => {
    e.stopPropagation();
    if (!result.id) return;
    setConnectingId(result.id);
    try {
      await createConnection({ connectedUserId: result.id, source: 'search' });
      toast.success(`Connected with ${getResultTitle(result)}!`);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast('Already connected', { icon: 'ℹ️' });
      } else {
        toast.error('Failed to connect. Try again.');
      }
    } finally {
      setConnectingId(null);
    }
  };

  const handleMessage = async (e: React.MouseEvent, result: any) => {
    e.stopPropagation();
    if (!result.id) return;
    setMessagingId(result.id);
    try {
      const conversation = await findOrCreateConversation(result.id);
      navigate(`/messages?conversation=${conversation.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to start conversation.';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setMessagingId(null);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <p className="text-sm text-text-secondary">
        Found {results?.totalCount || 0} result{(results?.totalCount || 0) !== 1 ? 's' : ''} for &ldquo;{results?.query}&rdquo;
      </p>

      {sections.map((section) => {
        const items = results?.results?.[section.key] || [];
        if (items.length === 0) return null;

        return (
          <div key={section.key}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-neon-cyan">{section.icon}</span>
              <h3 className="font-display text-sm font-bold text-text-primary">{section.label}</h3>
              <span className="text-xs text-text-tertiary">({items.length})</span>
            </div>

            <div className="space-y-2">
              {items.map((result) => {
                const url = getResultUrl(result);
                const title = getResultTitle(result);
                const subtitle = getResultSubtitle(result);
                const isUser = result.type === 'user';
                const initials = getInitials(result);

                return (
                  <div
                    key={result.id}
                    className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-1 p-3 transition-all duration-200 card-magical hover:border-gold/30 hover:shadow-glow-gold group"
                  >
                    {/* Clickable main area */}
                    <button
                      onClick={() => { onSelect(result); navigate(url); }}
                      className="flex flex-1 items-center gap-3 text-left min-w-0"
                    >
                      {/* Avatar / icon */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-text-secondary overflow-hidden">
                        {result.imageUrl ? (
                          <img src={result.imageUrl} alt={title} className="h-full w-full rounded-lg object-cover" />
                        ) : isUser ? (
                          <div className="h-full w-full rounded-lg gradient-magical flex items-center justify-center text-xs font-bold text-white">
                            {initials}
                          </div>
                        ) : (
                          typeIconMap[result.type] || <Star className="h-4 w-4" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate group-hover:text-neon-cyan transition-colors">
                          {title}
                        </p>
                        {subtitle && (
                          <p className="text-xs text-text-secondary truncate">{subtitle}</p>
                        )}
                        {result.description && (
                          <p className="text-xs text-text-tertiary line-clamp-1 mt-0.5">{result.description}</p>
                        )}
                      </div>

                      {/* Score badge */}
                      <div className="shrink-0">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold',
                            (result.score || (result as any).relevanceScore || 0) >= 0.8
                              ? 'bg-gold/15 text-gold'
                              : (result.score || (result as any).relevanceScore || 0) >= 0.5
                                ? 'bg-neon-cyan/10 text-neon-cyan'
                                : 'bg-surface-2 text-text-tertiary',
                          )}
                        >
                          {formatScore(result.score || (result as any).relevanceScore || 0)}
                        </span>
                      </div>
                    </button>

                    {/* Action buttons for people */}
                    {isUser && (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={(e) => handleConnect(e, result)}
                          disabled={connectingId === result.id}
                          className="flex items-center gap-1 rounded-full bg-neon-cyan/10 px-2.5 py-1 text-[11px] font-semibold text-neon-cyan transition-all hover:bg-neon-cyan/20 hover:scale-105 disabled:opacity-50"
                          title="Connect"
                        >
                          <UserPlus className="h-3 w-3" />
                          Connect
                        </button>
                        <button
                          onClick={(e) => handleMessage(e, result)}
                          disabled={messagingId === result.id}
                          className="flex items-center gap-1 rounded-full bg-neon-purple/10 px-2.5 py-1 text-[11px] font-semibold text-neon-purple transition-all hover:bg-neon-purple/20 hover:scale-105 disabled:opacity-50"
                          title="Message"
                        >
                          <MessageSquare className="h-3 w-3" />
                          Message
                        </button>
                      </div>
                    )}

                    {/* View button for non-people */}
                    {!isUser && (
                      <button
                        onClick={() => navigate(url)}
                        className="flex shrink-0 items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-text-secondary transition-all hover:bg-surface-3 hover:text-text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SearchResults;
