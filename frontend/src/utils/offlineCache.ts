import { openDB } from 'idb';

const DB_NAME = 'nexas-offline';
const DB_VERSION = 1;
const STORE_NAME = 'cache';

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
}

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function cacheSet<T>(key: string, data: T): Promise<void> {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, { data, timestamp: Date.now() } as CacheEntry<T>, key);
  } catch (err) {
    console.warn('[OfflineCache] Failed to cache:', key, err);
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    const entry = await db.get(STORE_NAME, key) as CacheEntry<T> | undefined;
    return entry?.data ?? null;
  } catch (err) {
    console.warn('[OfflineCache] Failed to read cache:', key, err);
    return null;
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, key);
  } catch {}
}

export async function cacheClear(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
  } catch {}
}

export const CACHE_KEYS = {
  WALLET_CARDS: 'wallet-cards',
  MY_CARDS: 'my-cards',
  MY_QRCODE: 'my-qrcode',
  USER_PROFILE: 'user-profile',
  CONNECTIONS: 'connections',
} as const;
