// @ts-nocheck — firebase/messaging types not available in this build
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import app from '@/utils/firebase';
import apiClient from '@/api/client';

let messaging: ReturnType<typeof getMessaging> | null = null;

const VAPID_KEY = 'BGm7NPuuufrsBE2KclSxyaZ8M8-3CHwSYaU6c5MrHo8vFIhFeDDIGfuUVUIggjS1Lz3tzTwLBEo3EV2jZzuNRYw';

function getMessagingInstance() {
  if (!app) {
    console.warn('[Push] Firebase app not initialized');
    return null;
  }
  if (!messaging) {
    try {
      messaging = getMessaging(app);
      console.log('[Push] Firebase messaging initialized');
    } catch (e) {
      console.warn('[Push] FCM init failed:', e);
      return null;
    }
  }
  return messaging;
}

/** Get current notification permission status */
export function getNotificationStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission as 'granted' | 'denied' | 'default';
}

/**
 * Request notification permission and register FCM token with backend.
 */
export async function registerPushToken(): Promise<boolean> {
  const msg = getMessagingInstance();
  if (!msg) {
    console.warn('[Push] No messaging instance');
    return false;
  }

  if (!('Notification' in window)) {
    console.warn('[Push] Notifications not supported');
    return false;
  }

  console.log('[Push] Current permission:', Notification.permission);

  try {
    // Always try to request — even if denied, this handles the edge case
    // where the user reset it externally
    let permission = Notification.permission;

    if (permission === 'default') {
      console.log('[Push] Requesting permission...');
      permission = await Notification.requestPermission();
      console.log('[Push] Permission result:', permission);
    }

    if (permission !== 'granted') {
      console.warn('[Push] Permission not granted:', permission);
      return false;
    }

    // Register Firebase messaging service worker
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
          { scope: '/' },
        );
        console.log('[Push] Service worker registered');

        // Wait for it to be active
        if (swRegistration.installing) {
          await new Promise<void>((resolve) => {
            swRegistration!.installing!.addEventListener('statechange', (e) => {
              if ((e.target as ServiceWorker).state === 'activated') resolve();
            });
          });
        }
      } catch (e) {
        console.warn('[Push] SW registration failed:', e);
      }
    }

    console.log('[Push] Getting FCM token...');
    const token = await getToken(msg, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      console.log('[Push] Got token, saving to backend...');
      await apiClient.post('/users/me/fcm-token', { token });
      console.log('[Push] Token registered successfully!');
      return true;
    } else {
      console.warn('[Push] No token received');
      return false;
    }
  } catch (e) {
    console.error('[Push] Registration failed:', e);
    return false;
  }
}

/**
 * Listen for foreground messages and show a toast.
 */
export function onForegroundMessage(
  callback: (payload: { title?: string; body?: string; link?: string }) => void,
): () => void {
  const msg = getMessagingInstance();
  if (!msg) return () => {};

  return onMessage(msg, (payload: any) => {
    console.log('[Push] Foreground message:', payload);
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
      link: payload.data?.link,
    });
  });
}
