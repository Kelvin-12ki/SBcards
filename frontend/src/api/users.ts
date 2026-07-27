import apiClient from './client';
import { storage } from '@/utils/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { User } from '@/types/user';
import type { Card } from '@/types/card';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Convert a File to a base64 data URL (fallback when Firebase Storage is unavailable).
 */
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a profile photo. Tries Firebase Storage first, falls back to base64 data URL.
 */
export async function uploadProfilePhoto(file: File, userId: string): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File is too large. Maximum size is 5MB.');
  }

  // Try Firebase Storage first
  if (storage) {
    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storageRef = ref(storage, `avatars/${userId}/${timestamp}-${safeName}`);

      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (err: any) {
      console.warn('Firebase Storage upload failed, falling back to local storage:', err?.message || err);
      // Fall through to base64 fallback
    }
  }

  // Fallback: convert to base64 data URL so the feature still works
  return fileToDataURL(file);
}

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
