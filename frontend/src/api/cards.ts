import apiClient from './client';
import { auth, storage } from '@/utils/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Card } from '@/types/card';
import { cacheSet, cacheGet, CACHE_KEYS } from '@/utils/offlineCache';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const CARD_IMG_MAX_DIMENSION = 400; // px
const CARD_IMG_QUALITY = 0.8;

/**
 * Compress and resize an image using Canvas.
 */
function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > CARD_IMG_MAX_DIMENSION || height > CARD_IMG_MAX_DIMENSION) {
        const scale = CARD_IMG_MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log(`[CardUpload] Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(blob.size / 1024).toFixed(0)}KB`);
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        CARD_IMG_QUALITY,
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload a card photo. Compresses first, tries Firebase Storage, falls back to base64.
 */
export async function uploadCardPhoto(file: File, userId: string): Promise<string> {
  // Storage rules scope writes to `card-photos/{firebase uid}/`, so the path
  // must use the Firebase UID. Callers historically passed the Mongo user id,
  // which the rules reject — uploads then fell through to the base64 branch
  // below and bloated the card document.
  const ownerId = auth?.currentUser?.uid ?? userId;

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File is too large. Maximum size is 10MB.');
  }

  // Compress first
  const compressed = await compressImage(file);

  // Try Firebase Storage
  if (storage) {
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `card-photos/${ownerId}/${timestamp}.jpg`);
      const snapshot = await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg' });
      return await getDownloadURL(snapshot.ref);
    } catch (err: any) {
      console.warn('Firebase Storage upload failed, falling back to base64:', err?.message || err);
    }
  }

  // Fallback: compressed base64
  return blobToDataURL(compressed);
}

export async function getCards(): Promise<Card[]> {
  try {
    const { data } = await apiClient.get<Card[]>('/cards');
    await cacheSet(CACHE_KEYS.MY_CARDS, data);
    return data;
  } catch (err) {
    if (!navigator.onLine) {
      const cached = await cacheGet<Card[]>(CACHE_KEYS.MY_CARDS);
      if (cached) return cached;
    }
    throw err;
  }
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
  try {
    const { data } = await apiClient.get<WalletCardEntry[]>('/cards/wallet');
    await cacheSet(CACHE_KEYS.WALLET_CARDS, data);
    return data;
  } catch (err) {
    if (!navigator.onLine) {
      const cached = await cacheGet<WalletCardEntry[]>(CACHE_KEYS.WALLET_CARDS);
      if (cached) return cached;
    }
    throw err;
  }
}

export async function getPublicCard(id: string): Promise<PublicCardEntry> {
  const { data } = await apiClient.get<PublicCardEntry>(`/cards/public/${id}`);
  return data;
}
