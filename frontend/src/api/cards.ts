import apiClient from './client';
import { storage } from '@/utils/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
export async function uploadCardPhoto(file: File, userId: string): Promise<string> {
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
      const storageRef = ref(storage, `card-photos/${userId}/${timestamp}-${safeName}`);

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

export async function getCards(): Promise<Card[]> {
  const { data } = await apiClient.get<Card[]>('/cards');
  return data;
}

export async function getCard(id: string): Promise<Card> {
  const { data } = await apiClient.get<Card>(`/cards/${id}`);
  return data;
}

export async function createCard(
  cardData: Partial<Card>,
): Promise<Card> {
  const { data } = await apiClient.post<Card>('/cards', cardData);
  return data;
}

export async function updateCard(
  id: string,
  cardData: Partial<Card>,
): Promise<Card> {
  const { data } = await apiClient.patch<Card>(`/cards/${id}`, cardData);
  return data;
}

export async function deleteCard(id: string): Promise<void> {
  await apiClient.delete(`/cards/${id}`);
}

export async function setDefaultCard(id: string): Promise<Card> {
  const { data } = await apiClient.patch<Card>(`/cards/${id}/default`);
  return data;
}

export interface WalletCardEntry {
  card: Card;
  sender: {
    id: string;
    displayName?: string;
    email?: string;
    avatarUrl?: string;
    title?: string;
    company?: string;
    bio?: string;
    industry?: string;
    jobRole?: string;
  };
}

export interface PublicCardEntry {
  card: Card;
  owner: {
    id: string;
    displayName?: string;
    email?: string;
    avatarUrl?: string;
    title?: string;
    company?: string;
    bio?: string;
  };
}

export async function getWalletCards(): Promise<WalletCardEntry[]> {
  const { data } = await apiClient.get<WalletCardEntry[]>('/cards/wallet');
  return data;
}

export async function getPublicCard(id: string): Promise<PublicCardEntry> {
  const { data } = await apiClient.get<PublicCardEntry>(`/cards/public/${id}`);
  return data;
}
