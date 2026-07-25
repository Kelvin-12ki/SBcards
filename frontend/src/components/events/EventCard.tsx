import React from 'react';
import { cn } from '@/utils/helpers';
import { formatDate } from '@/utils/helpers';
import type { Event } from '@/types/event';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export interface EventCardProps {
  event: Event;
  onJoin?: (eventId: string) => void;
  onView?: (eventId: string) => void;
  className?: string;
}

const statusVariant = {
  draft: 'default' as const,
  active: 'success' as const,
  completed: 'default' as const,
  cancelled: 'danger' as const,
};

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const EventCard: React.FC<EventCardProps> = ({
  event,
  onJoin,
  onView,
  className,
}) => {
  return (
    <div
      className={cn(
        'card-magical rounded-2xl p-5 transition-all duration-300 hover-glow-magical shimmer-magical',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3
            className="font-display text-lg font-bold text-text-primary truncate cursor-pointer hover:text-neon-cyan transition-colors"
            onClick={() => onView?.(event.id)}
          >
            {event.name}
          </h3>
          {event.description && (
            <p className="mt-1 text-sm text-text-secondary line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
        <Badge variant={statusVariant[event.status]}>
          {statusLabel[event.status]}
        </Badge>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-text-tertiary">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span>{event.location}</span>
          </div>
        )}
        {event.participantCount !== undefined && (
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <span>{event.participantCount} participant{event.participantCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        {event.status !== 'completed' && event.status !== 'cancelled' && (
          <Button variant="primary" size="sm" onClick={() => onJoin?.(event.id)}>
            Join
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => onView?.(event.id)}>
          View Details
        </Button>
      </div>
    </div>
  );
};

export default EventCard;
