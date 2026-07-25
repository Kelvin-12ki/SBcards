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
    params: { page, limit },
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
