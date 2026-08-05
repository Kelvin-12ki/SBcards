import React from 'react';
import { cn } from '@/utils/helpers';
import type { Connection } from '@/types/connection';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import LeadScoreBadge from './LeadScoreBadge';
import FollowUpStatusBadge from './FollowUpStatusBadge';

export interface ConnectionCardProps {
  connection: Connection;
  onClick?: () => void;
  className?: string;
}

const sourceLabels: Record<string, string> = {
  qr_scan: 'QR Scan',
  manual: 'Manual',
  event_match: 'Event Match',
  import: 'Imported',
};

const statusVariants: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  accepted: 'success',
  declined: 'danger',
  archived: 'default',
};

const ConnectionCard: React.FC<ConnectionCardProps> = ({ connection, onClick, className }) => {
  // Prefer 'otherUser' (the person who isn't the current user), then fallback
  const person = connection.otherUser || connection.connectedUser || null;
  const card = connection.connectedCard;
  const p = person as any;
  const c = card as any;
  const displayName =
    p?.displayName ||
    c?.fullName ||
    p?.email ||
    c?.email ||
    'Unknown User';
  const company = p?.company || c?.company;
  const role = p?.jobRole || c?.role;
  const avatarUrl = p?.avatarUrl || c?.avatarUrl;

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'card-magical rounded-2xl border border-border-subtle p-4 text-left w-full transition-all duration-300',
        'hover:border-neon-purple/30 hover:shadow-lg hover:shadow-neon-purple/10',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar src={avatarUrl} alt={displayName} size="lg" fallbackInitials={initials} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-text-primary truncate">{displayName}</h3>
              {(role || company) && (
                <p className="text-xs text-text-secondary truncate mt-0.5">
                  {[role, company].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <LeadScoreBadge score={connection.leadQualification?.leadScore} size="sm" />
              {/* Favorite star */}
              {connection.isFavorite && (
                <svg className="h-4 w-4 text-gold" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
            </div>
          </div>

          {/* Notes preview */}
          {connection.notes && (
            <p className="mt-1.5 text-xs text-text-tertiary line-clamp-2 italic">
              "{connection.notes}"
            </p>
          )}

          {/* Tags */}
          {connection.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {connection.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="primary">
                  {tag}
                </Badge>
              ))}
              {connection.tags.length > 4 && (
                <Badge variant="default">+{connection.tags.length - 4}</Badge>
              )}
            </div>
          )}

          {/* Footer row */}
          <div className="mt-2.5 flex items-center gap-3 text-xs text-text-tertiary">
            <Badge variant={statusVariants[connection.status] || 'default'}>
              {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
            </Badge>
            <FollowUpStatusBadge status={connection.leadQualification?.followUpStatus} />
            <span className="flex items-center gap-1 ml-auto">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              {sourceLabels[connection.source] || connection.source}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default ConnectionCard;
