import React from 'react';
import { cn } from '@/utils/helpers';
import { formatDate } from '@/utils/helpers';
import type { Event, EventParticipation } from '@/types/event';
import EventStatusBadge from './EventStatusBadge';
import TableAssignment from '@/components/matching/TableAssignment';
import MatchList from '@/components/matching/MatchList';
import type { MatchResult } from '@/types/match';
import type { MyAssignment } from '@/types/table';

export interface EventDashboardProps {
  event: Event;
  participants: EventParticipation[];
  matches?: MatchResult[];
  matchesLoading?: boolean;
  tableAssignment?: MyAssignment | null;
  tableLoading?: boolean;
  className?: string;
}

const EventDashboard: React.FC<EventDashboardProps> = ({
  event,
  participants,
  matches,
  matchesLoading = false,
  tableAssignment,
  tableLoading = false,
  className,
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="card-magical rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-gradient-gold">{event.name}</h2>
            {event.description && (
              <p className="mt-1 text-sm text-text-secondary">{event.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-text-tertiary">
              <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
              {event.location && <span>{event.location}</span>}
              <EventStatusBadge status={event.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card-magical rounded-2xl p-4 text-center">
          <p className="font-display text-2xl font-extrabold text-gradient-magical">{participants.length}</p>
          <p className="text-xs text-text-secondary">Attendees</p>
        </div>
        <div className="card-magical rounded-2xl p-4 text-center">
          <p className="font-display text-2xl font-extrabold text-gradient-magical">{matches?.length || 0}</p>
          <p className="text-xs text-text-secondary">Matches</p>
        </div>
        <div className="card-magical rounded-2xl p-4 text-center">
          <p className="font-display text-2xl font-extrabold text-gradient-magical">{event.tableCount || '-'}</p>
          <p className="text-xs text-text-secondary">Tables</p>
        </div>
        <div className="card-magical rounded-2xl p-4 text-center">
          <p className="font-display text-2xl font-extrabold text-gradient-magical">{event.tableCapacity || '-'}</p>
          <p className="text-xs text-text-secondary">Seats/Table</p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-display text-lg font-bold text-gradient-magical">My Table</h3>
        <TableAssignment assignment={tableAssignment ?? null} loading={tableLoading} />
      </div>

      <div>
        <h3 className="mb-3 font-display text-lg font-bold text-gradient-magical">Matches</h3>
        <MatchList matches={matches || []} loading={matchesLoading} />
      </div>
    </div>
  );
};

export default EventDashboard;
