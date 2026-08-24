/** One seat at a table, as returned by the assignment endpoints. */
export interface SeatedAttendee {
  userId: string;
  userName: string;
  cardId: string;
}

/** A table plus everyone currently seated at it. */
export interface EventTable {
  tableId: string;
  tableNumber: number;
  label?: string;
  attendees: SeatedAttendee[];
}

export interface SetupTablesPayload {
  tableCount: number;
  seatsPerTable: number;
  rotationIntervalMinutes?: number;
}

/** A check-in row for the organizer's live arrivals list. */
export interface CheckInRecord {
  userId: string;
  userName: string;
  avatarUrl?: string;
  method: string;
  checkedInAt: string;
  hasCard: boolean;
}

export interface CheckInResult {
  id: string;
  eventId: string;
  userId: string;
  checkedInAt: string;
  method: string;
  hasCard: boolean;
}

/** A checked-in attendee with full profile detail (organizer table view). */
export interface TableAttendee {
  userId: string;
  userName: string;
  avatarUrl?: string;
  jobRole?: string;
  company?: string;
  industry?: string;
  seniority?: string;
  skills: string[];
  interests: string[];
  cardId: string;
  hasCard: boolean;
}

/** Someone seated at your table, with starters tailored to the two of you. */
export interface Tablemate {
  userId: string;
  userName: string;
  cardId: string;
  seatNumber: number;
  avatarUrl?: string;
  jobRole?: string;
  company?: string;
  industry?: string;
  overlapScore: number;
  sharedKeywords: string[];
  conversationStarters: string[];
}

export interface MyAssignment {
  tableId: string;
  tableNumber: number;
  label?: string;
  seatNumber: number;
  rotationRound: number;
  tablemates: Tablemate[];
}
