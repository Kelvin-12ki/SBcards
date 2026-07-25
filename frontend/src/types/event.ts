export interface Event {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  maxAttendees?: number;
  tableCount?: number;
  tableCapacity?: number;
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
