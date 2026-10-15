/**
 * Canonical event lifecycle. Mirrors the backend's
 * `entities/event.entity.ts#EventStatus`.
 *
 * upcoming/draft --activate--> active --complete--> completed
 *                              \--cancel--> cancelled
 */
export type EventStatus =
  | 'upcoming'
  | 'draft'
  | 'active'
  | 'completed'
  | 'cancelled';

export interface Event {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  maxAttendees?: number;
  tableCount?: number;
  tableCapacity?: number;
  tableConfig?: {
    enabled: boolean;
    seatsPerTable: number;
    rotationIntervalMinutes?: number;
  };
  currentRotationRound?: number;
  isActive: boolean;
  creatorId: string;
  organizationId?: string;
  createdAt: string;
  participantCount?: number;
}

export interface EventParticipation {
  id: string;
  eventId: string;
  userId: string;
  cardId: string;
  isVisible: boolean;
  joinedAt: string;
}

export interface EventParticipant {
  id: string;
  userId: string;
  cardId: string;
  isVisible: boolean;
  joinedAt: string;
  user: {
    id: string;
    displayName?: string;
    email: string;
    avatarUrl?: string;
  } | null;
  card: {
    id: string;
    fullName: string;
    headline?: string;
    company?: string;
    role?: string;
    email?: string;
    avatarUrl?: string;
  } | null;
}

/**
 * A person at an event the caller can still connect with.
 *
 * Mirrors the backend's EventSuggestion and is deliberately narrower than
 * EventParticipant: `phone` and `email` are not in this shape because the API
 * never sends them for this screen.
 */
export interface EventSuggestion {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  card: {
    fullName: string;
    headline?: string;
    company?: string;
    role?: string;
  } | null;
  joinedAt: string;
}

export interface EventSuggestionsResponse {
  eventId: string;
  eventName: string;
  suggestions: EventSuggestion[];
}
