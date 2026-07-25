import React from 'react';
import { cn } from '@/utils/helpers';
import type { EventParticipant } from '@/types/event';

export interface ParticipantListProps {
  participants: EventParticipant[];
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  className,
}) => {
  if (participants.length === 0) {
    return (
      <div className={cn('text-center py-8 text-text-secondary', className)}>
        No participants yet.
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', className)}>
      {participants.map((p) => {
        const displayName =
          p.card?.fullName || p.user?.displayName || 'Unknown';
        const initials = getInitials(displayName);
        const email = p.card?.email || p.user?.email || '';
        const subtitle =
          p.card?.headline ||
          (p.card?.role && p.card?.company
            ? `${p.card.role} @ ${p.card.company}`
            : p.card?.role || p.card?.company || '');

        return (
          <div
            key={p.id}
            className="card-magical rounded-xl p-4 flex items-start gap-3"
          >
            {/* Avatar */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-aurora flex items-center justify-center text-white text-sm font-bold">
              {initials}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold text-text-primary truncate">
                {displayName}
              </p>
              {email && (
                <p className="text-xs text-text-tertiary truncate">{email}</p>
              )}
              {subtitle && (
                <p className="text-xs text-text-secondary mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ParticipantList;
