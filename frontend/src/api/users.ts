import apiClient from './client';
import { storage } from '@/utils/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { User } from '@/types/user';
import type { Card } from '@/types/card';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const AVATAR_MAX_DIMENSION = 256; // px — avatars don't need to be huge
const AVATAR_QUALITY = 0.8; // JPEG quality for compression

/**
 * Compress and resize an image file using Canvas.
 * Returns a new Blob ready for upload.
 */
function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down to max dimension while keeping aspect ratio
      if (width > AVATAR_MAX_DIMENSION || height > AVATAR_MAX_DIMENSION) {
        const scale = AVATAR_MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log(
              `[Upload] Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(blob.size / 1024).toFixed(0)}KB (${width}x${height})`,
            );
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        AVATAR_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Convert a File to a base64 data URL (fallback when Firebase Storage is unavailable).
 */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload a profile photo. Compresses first, then tries Firebase Storage, falls back to base64.
 */
export async function uploadProfilePhoto(file: File, userId: string): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File is too large. Maximum size is 5MB.');
  }

  // Compress the image first
  const compressed = await compressImage(file);

  // Try Firebase Storage first
  if (storage) {
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `avatars/${userId}/${timestamp}.jpg`);

      const snapshot = await uploadBytes(storageRef, compressed, {
        contentType: 'image/jpeg',
      });
      return await getDownloadURL(snapshot.ref);
    } catch (err: any) {
      console.warn('Firebase Storage upload failed, falling back to base64:', err?.message || err);
    }
  }

  // Fallback: convert compressed blob to base64 data URL
  return blobToDataURL(compressed);
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
