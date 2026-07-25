import apiClient from './client';
import type { Notification } from '@/types/notification';

export async function getNotifications(page?: number, limit?: number): Promise<Notification[]> {
  const { data } = await apiClient.get<{ notifications: Notification[]; total: number }>('/notifications', { params: { page, limit } });
  return data.notifications || [];
}

export async function getUnreadNotifications(): Promise<Notification[]> {
  const { data } = await apiClient.get<Notification[]>('/notifications/unread');
  return data;
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const { data } = await apiClient.get('/notifications/unread/count');
  return data;
}

export async function markAsRead(notificationId: string): Promise<void> {
  await apiClient.patch(`/notifications/${notificationId}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await apiClient.patch('/notifications/read-all');
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await apiClient.delete(`/notifications/${notificationId}`);
}
