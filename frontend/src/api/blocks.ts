import apiClient from './client';
import type { BlockStatus, BlockedUserRow } from '@/types/block';

export async function blockUser(userId: string, reason?: string): Promise<void> {
  await apiClient.post('/blocks', reason ? { userId, reason } : { userId });
}

export async function unblockUser(userId: string): Promise<void> {
  await apiClient.delete(`/blocks/${userId}`);
}

export async function getBlockStatus(userId: string): Promise<BlockStatus> {
  const { data } = await apiClient.get<BlockStatus>(`/blocks/status/${userId}`);
  return data;
}

export async function getBlockedUsers(): Promise<BlockedUserRow[]> {
  const { data } = await apiClient.get<BlockedUserRow[]>('/blocks');
  return data;
}
