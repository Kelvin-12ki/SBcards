// @ts-nocheck — firebase/messaging types not available in this build
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import app, { firebaseConfig } from '@/utils/firebase';
import apiClient from '@/api/client';

let messaging: ReturnType<typeof getMessaging> | null = null;

/** Initialize Firebase Cloud Messaging */
function getMessagingInstance() {
  if (!app) return null;
  if (!messaging) {
    try {
      messaging = getMessaging(app);
    } catch (e) {
      console.warn('FCM init failed:', e);
      return null;
    }
  }
  return messaging;
}

/** Send Firebase config to the service worker so it can handle background messages */
async function sendConfigToSW(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({
      type: 'FIREBASE_CONFIG',
      config: {
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId,
      },
    });
  } catch {}
}

/**
 * Request notification permission and register FCM token with backend.
 * Call this after user logs in.
 */
export async function registerPushToken(): Promise<void> {
  const msg = getMessagingInstance();
  if (!msg) return;

  // Skip if notifications not supported or already denied
  if (!('Notification' in window)) return;
  if (Notification.permission === 'denied') return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Send config to service worker
    await sendConfigToSW();

    const token = await getToken(msg, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined,
    });

    if (token) {
      await apiClient.post('/users/me/fcm-token', { token });
      console.log('FCM token registered');
    }
  } catch (e) {
    console.warn('Push registration failed:', e);
  }
}

/**
 * Listen for foreground messages and show a toast/notification.
 * Call this once when the app loads (after auth is ready).
 */
export function onForegroundMessage(
  callback: (payload: { title?: string; body?: string; link?: string }) => void,
): () => void {
  const msg = getMessagingInstance();
  if (!msg) return () => {};

  return onMessage(msg, (payload: any) => {
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
      link: payload.data?.link,
    });
  });
}
