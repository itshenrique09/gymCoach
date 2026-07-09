/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };

// Precache the built app shell (offline support).
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('install', () => {
  void self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Rest-timer push: fired by the server when the rest period ends — works even
// with the app closed / screen locked.
self.addEventListener('push', (event) => {
  let payload = { title: 'Descanso terminado 💪', body: 'Bora — próxima série!' };
  try {
    if (event.data) payload = { ...payload, ...(event.data.json() as typeof payload) };
  } catch {
    /* keep defaults */
  }
  const options = {
    body: payload.body,
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    tag: 'rest-timer',
    renotify: true,
    vibrate: [300, 120, 300],
  };
  event.waitUntil(self.registration.showNotification(payload.title, options as NotificationOptions));
});

// Tapping the notification focuses (or opens) the app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow('/');
    }),
  );
});
