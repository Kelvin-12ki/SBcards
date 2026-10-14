import React from 'react';
import Badge from '@/components/ui/Badge';
import { eventStatusLabel, eventStatusVariant } from '@/utils/eventStatus';

export interface EventStatusBadgeProps {
  status?: string | null;
  className?: string;
}

/**
 * One badge for event status everywhere. Replaces the three diverging maps in
 * EventCard, EventDashboard and EventDetailPage (none of which handled
 * 'upcoming', so real events showed a blank chip).
 */
const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({
  status,
  className,
}) => (
  <Badge variant={eventStatusVariant(status)} className={className}>
    {eventStatusLabel(status)}
  </Badge>
);

export default EventStatusBadge;
