import apiClient from './client';
import type { User } from '@/types/user';
import type { Card } from '@/types/card';

export async function searchUsers(query: string): Promise<User[]> {
  const { data } = await apiClient.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
  return data;
}

export async function getUser(id: string): Promise<User> {
  const { data } = await apiClient.get<User>(`/users/${id}`);
  return data;
}

export async function getPublicProfile(userId: string): Promise<User> {
  const { data } = await apiClient.get<User>(`/users/${userId}`);
  return data;
}

export async function getUserCards(userId: string): Promise<Card[]> {
  const { data } = await apiClient.get<Card[]>(`/cards/user/${userId}`);
  return data;
}

export async function updateProfile(data: Partial<User>): Promise<User> {
  const { data: result } = await apiClient.patch<User>('/users/me', data);
  return result;
}
