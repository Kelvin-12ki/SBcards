export interface ConnectionNote {
  id: string;
  text: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadQualification {
  id: string;
  leadScore: 'none' | 'hot' | 'warm' | 'cold';
  followUpStatus: 'not_started' | 'in_progress' | 'completed' | 'no_follow_up';
  tags: string[];
  privateNotes: ConnectionNote[];
}

export interface Connection {
  id: string;
  userId: string;
  connectedUserId: string;
  connectedCardId?: string;
  eventId?: string;
  status: 'pending' | 'accepted' | 'declined' | 'archived';
  notes?: string;
  tags: string[];
  isFavorite: boolean;
  source: 'qr_scan' | 'manual' | 'event_match' | 'import' | 'profile';
  metAt?: string;
  followUpDate?: string;
  followUpNote?: string;
  leadQualification?: LeadQualification | null;
  connectedUser?: {
    id: string;
    displayName?: string;
    email: string;
    avatarUrl?: string;
    title?: string;
    company?: string;
    jobRole?: string;
    industry?: string;
  };
  senderUser?: {
    id: string;
    displayName?: string;
    email: string;
    avatarUrl?: string;
    title?: string;
    company?: string;
    industry?: string;
  };
  otherUser?: {
    id: string;
    displayName?: string;
    email: string;
    avatarUrl?: string;
    title?: string;
    company?: string;
    jobRole?: string;
    industry?: string;
  };
  connectedCard?: {
    id: string;
    fullName: string;
    headline?: string;
    company?: string;
    role?: string;
    email?: string;
    avatarUrl?: string;
  };
  createdAt: string;
}
