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

/**
 * Request notification permission and register FCM token with backend.
 * Call this after user logs in.
 */
export async function registerPushToken(): Promise<void> {
  const msg = getMessagingInstance();
  if (!msg) return;

  // Skip if notifications not supported
  if (!('Notification' in window)) return;

  try {
    // Check current permission first
    let permission = Notification.permission;
    if (permission === 'denied') {
      console.warn('Notifications blocked by user');
      return;
    }

    // Request permission if not yet decided
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') return;

    // Register our dedicated Firebase messaging service worker
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
          { scope: '/' },
        );
        // Wait for it to be active
        if (swRegistration.installing) {
          await new Promise<void>((resolve) => {
            swRegistration!.installing!.addEventListener('statechange', (e) => {
              if ((e.target as ServiceWorker).state === 'activated') resolve();
            });
          });
        }
        console.log('Firebase messaging SW registered');
      } catch (e) {
        console.warn('Firebase messaging SW registration failed:', e);
      }
    }

    const token = await getToken(msg, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      await apiClient.post('/users/me/fcm-token', { token });
      console.log('FCM token registered successfully');
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
