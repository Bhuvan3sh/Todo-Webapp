// Service Worker for Task Buddy PWA
// Handles background push notifications, offline caching, and periodic sync

const CACHE_NAME = 'task-buddy-v4';
const OFFLINE_URLS = ['/'];

// ─── Install ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// ─── Activate ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: network-first with cache fallback ──────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('/'))
      )
  );
});

// ─── Helper: show a notification with full options ─────────
function showTaskBuddyNotification(title, options = {}) {
  const notificationOptions = {
    body: options.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: options.tag || 'task-buddy-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200, 100, 300],
    data: { url: options.url || '/dashboard' },
    actions: [
      { action: 'open', title: '📋 Open App' },
      { action: 'dismiss', title: '✕ Dismiss' },
    ],
  };

  return self.registration.showNotification(title, notificationOptions);
}

// ─── Message from App → Show notification ──────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(showTaskBuddyNotification(title, options));
  }
});

// ─── Push event (server-sent push) ─────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: '📌 Task Buddy', body: 'Check your pending tasks!' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(showTaskBuddyNotification(data.title, data));
});

// ─── Notification click ────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if possible
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ─── Periodic Background Sync ──────────────────────────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'task-buddy-checkin') {
    event.waitUntil(
      showTaskBuddyNotification('📌 Task Buddy Check-in', {
        body: 'Take a quick moment to review your pending tasks and stay productive! 🚀',
        tag: 'periodic-checkin',
      })
    );
  }
});
