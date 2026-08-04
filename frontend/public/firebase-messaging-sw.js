// Firebase Cloud Messaging service worker
// This runs in the background and shows notifications when the app is not in focus

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase config is injected by the app via postMessage after registration
let firebaseConfig = {};

self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    if (!firebaseConfig._initialized) {
      firebase.initializeApp(firebaseConfig);
      firebaseConfig._initialized = true;
    }
  }
});

// Handle background messages
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { notification: { title: 'SBCards', body: event.data.text() } };
  }

  const title = payload.notification?.title || 'SBCards';
  const body = payload.notification?.body || '';
  const link = payload.data?.link || '/messages';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/sing-192x192.png',
      badge: '/sing-50x50.png',
      data: { link },
      tag: 'sbcards-notification',
    }),
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/messages';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      return clients.openWindow(link);
    }),
  );
});
