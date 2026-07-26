// ============================================================
// Nayaruvi Pulse — Notification Service Worker
// Save this file as: sw-notifications.js (same folder as index.html)
// ============================================================

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle push events (from server-sent push — optional future use)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Nayaruvi Pulse';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'nayaruvi-push',
    data: data.url ? { url: data.url } : {},
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click — focus or open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Receive messages from the main page to show notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag } = event.data;
    self.registration.showNotification(title || 'Nayaruvi Pulse', {
      body: body || '',
      icon: icon || '',
      badge: icon || '',
      tag: tag || 'nayaruvi-' + Date.now(),
      requireInteraction: false,
      silent: false,
    });
  }
});