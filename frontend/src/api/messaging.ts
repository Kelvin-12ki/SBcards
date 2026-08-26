import apiClient from './client';
import type { Conversation, Message } from '@/types/messaging';

export async function findOrCreateConversation(participantId: string): Promise<Conversation> {
  const { data } = await apiClient.post<Conversation>('/conversations', { participantId });
  return data;
}

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await apiClient.get<Conversation[]>('/conversations');
  return data;
}

interface PaginatedMessages {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
}

export async function getMessages(conversationId: string, page?: number, limit?: number): Promise<Message[]> {
  const { data } = await apiClient.get<PaginatedMessages>(`/conversations/${conversationId}/messages`, {
    params: { page: page || 1, limit: limit || 500 },
  });
  return data.messages || [];
}

export async function getNewMessages(conversationId: string, afterMessageId: string, limit?: number): Promise<Message[]> {
  const { data } = await apiClient.get<PaginatedMessages>(`/conversations/${conversationId}/messages`, {
    params: { after: afterMessageId, limit: limit || 100 },
  });
  return data.messages || [];
}

export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const { data } = await apiClient.post<Message>(`/conversations/${conversationId}/messages`, { content });
  return data;
}

export async function markAsRead(conversationId: string): Promise<void> {
  await apiClient.patch(`/conversations/${conversationId}/read`);
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const { data } = await apiClient.get('/conversations/unread/count');
  return data;
}

export async function setTypingStatus(conversationId: string, isTyping: boolean): Promise<void> {
  await apiClient.patch(`/conversations/${conversationId}/typing`, { isTyping });
}

export async function getTypingStatus(conversationId: string): Promise<{ typing: boolean }> {
  const { data } = await apiClient.get(`/conversations/${conversationId}/typing`);
  return data;
}

export async function deleteMessage(conversationId: string, messageId: string): Promise<void> {
  await apiClient.delete(`/conversations/${conversationId}/messages/${messageId}`);
}

// ── WEB: real-time messaging additions ──────────────────────────────────────

/**
 * WEB: upload an image for a chat message and get back its stored URL.
 *
 * The backend reads the file from the "file" field and requires the
 * conversation id alongside it, so membership can be checked before anything
 * is written to storage.
 */
export async function uploadMessageImage(
  conversationId: string,
  file: File,
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('conversationId', conversationId);

  // Content-Type is deliberately left unset: the browser must add its own
  // multipart boundary, and naming the type by hand strips it.
  const { data } = await apiClient.post<{ url: string }>(
    '/conversations/upload',
    formData,
  );
  return data;
}

interface MessageSearchResponse {
  messages: Message[];
  total: number;
  query: string;
}

/** WEB: substring search across one conversation's messages. */
export async function searchMessages(
  conversationId: string,
  query: string,
): Promise<Message[]> {
  const { data } = await apiClient.get<MessageSearchResponse>(
    `/conversations/${conversationId}/messages/search`,
    { params: { q: query } },
  );
  return data.messages || [];
}

/** WEB: REST fallback for adding a reaction (sockets are preferred). */
export async function addReaction(
  conversationId: string,
  messageId: string,
  emoji: string,
): Promise<Message> {
  const { data } = await apiClient.post<Message>(
    `/conversations/${conversationId}/messages/${messageId}/reactions`,
    { emoji },
  );
  return data;
}

/** WEB: REST fallback for removing a reaction (sockets are preferred). */
export async function removeReaction(
  conversationId: string,
  messageId: string,
  emoji: string,
): Promise<Message> {
  const { data } = await apiClient.delete<Message>(
    `/conversations/${conversationId}/messages/${messageId}/reactions`,
    { data: { emoji } },
  );
  return data;
}
