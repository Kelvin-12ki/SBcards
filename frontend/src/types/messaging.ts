export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessageAt?: string;
  lastMessagePreview?: string;
  createdAt: string;
  // Virtual/enriched
  otherUser?: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    avatarUrl?: string;
    company?: string;
    email?: string;
  };
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}
