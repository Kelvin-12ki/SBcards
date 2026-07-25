export interface Session {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  room?: string;
  speakerIds: string[];
  type: 'talk' | 'workshop' | 'panel' | 'break' | 'networking';
  capacity?: number;
  checkinCount: number;
  tags: string[];
  createdAt: string;
}

export interface SessionCheckin {
  id: string;
  sessionId: string;
  userId: string;
  checkedInAt: string;
}
