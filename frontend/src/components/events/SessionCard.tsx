import React from 'react';
import { cn } from '@/utils/helpers';
import type { Session } from '@/types/session';
import Button from '@/components/ui/Button';

export interface SessionCardProps {
  session: Session;
  onCheckin?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isCheckedIn?: boolean;
  isOrganizer?: boolean;
}

const typeColors: Record<Session['type'], string> = {
  talk: 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30',
  workshop: 'bg-neon-purple/20 text-neon-purple border-neon-purple/30',
  panel: 'bg-gold/20 text-gold border-gold/30',
  break: 'bg-surface-2 text-text-secondary border-border-subtle',
  networking: 'bg-neon-pink/20 text-neon-pink border-neon-pink/30',
};

const typeLabels: Record<Session['type'], string> = {
  talk: 'Talk',
  workshop: 'Workshop',
  panel: 'Panel',
  break: 'Break',
  networking: 'Networking',
};

function formatTimeRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  return `${fmt(start)} - ${fmt(end)}`;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onCheckin,
  onEdit,
  onDelete,
  isCheckedIn = false,
  isOrganizer = false,
}) => {
  return (
    <div className="card-magical rounded-xl p-4 transition-all duration-300 hover-glow-magical shimmer-magical">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
                typeColors[session.type],
              )}
            >
              {typeLabels[session.type]}
            </span>
            {session.tags?.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-text-tertiary"
              >
                {tag}
              </span>
            ))}
          </div>

          <h4 className="mt-2 font-display text-base font-bold text-text-primary">
            {session.title}
          </h4>

          {session.description && (
            <p className="mt-1 text-sm text-text-secondary line-clamp-2">
              {session.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTimeRange(session.startTime, session.endTime)}
            </span>
            {(session.location || session.room) && (
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {session.room || session.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              {session.checkinCount}{session.capacity ? ` / ${session.capacity}` : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {!isCheckedIn ? (
          <Button variant="primary" size="sm" onClick={onCheckin}>
            Check In
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Checked In
          </span>
        )}

        {isOrganizer && (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={onEdit}
              className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-surface-2 hover:text-text-primary"
              title="Edit session"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-danger/10 hover:text-danger"
              title="Delete session"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionCard;
