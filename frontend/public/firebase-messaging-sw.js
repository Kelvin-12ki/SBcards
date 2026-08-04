// Firebase Cloud Messaging service worker
// Handles background push notifications — no Firebase SDK needed here

// Handle background push events
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { notification: { title: 'SBCards', body: event.data.text() } };
  }

  const title = payload.notification?.title || payload.data?.title || 'SBCards';
  const body = payload.notification?.body || payload.data?.body || '';
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

// Handle notification click — open or focus the app
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
