import type { User } from './user';
import type { Card } from './card';

export interface Match {
  id: string;
  eventId: string;
  userAId: string;
  userBId: string;
  cardAId: string;
  cardBId: string;
  overlapScore: number;
  sharedKeywords: string[];
  createdAt: string;
  matchedUser?: User;
  matchedCard?: Card;
}

export interface TableAttendee {
  userId: string;
  userName: string;
  cardId: string;
}

export interface TableAssignment {
  id: string;
  tableId: string;
  tableNumber: number;
  label?: string;
  capacity: number;
  currentCount: number;
  attendees: TableAttendee[];
}
