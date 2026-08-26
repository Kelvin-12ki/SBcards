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

/** WEB: kinds of message the chat can render. */
export type MessageType = 'text' | 'image' | 'card-share';

/** WEB: snapshot of a business card attached to a card-share message. */
export interface SharedCardData {
  cardId: string;
  name: string;
  role?: string;
  company?: string;
  template?: string;
  avatarUrl?: string;
}

/** WEB: emoji -> ids of the users who reacted with it. */
export type MessageReactions = Record<string, string[]>;

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  // WEB: real-time messaging additions
  type?: MessageType;
  mediaUrl?: string;
  cardData?: SharedCardData;
  reactions?: MessageReactions;
  encrypted?: boolean;
}

/** WEB: presence state reported by the chat gateway. */
export type PresenceStatus = 'online' | 'offline';

/** WEB: map of userId -> presence, used by the conversation list. */
export type PresenceMap = Record<string, PresenceStatus>;
