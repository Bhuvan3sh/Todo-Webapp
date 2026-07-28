// Service Worker for Task Buddy PWA
// Handles background push notifications and offline caching

const CACHE_NAME = 'task-buddy-v3';
const OFFLINE_URLS = ['/'];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('/');
        });
      })
  );
});

// Listen for messages from the app to show notifications
// This is the proper way — the SW shows the notification from its own context
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        body: options.body || '',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: options.tag || 'task-buddy-' + Date.now(),
        renotify: true,
        requireInteraction: true,
        silent: false,
        vibrate: [300, 100, 300, 100, 300],
        data: { url: '/dashboard' },
        actions: [
          { action: 'open', title: 'Open App' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
        ...options,
        // Force these after spread so they can't be overridden
        silent: false,
        requireInteraction: true,
      })
    );
  }
});

// Push notification received from server
self.addEventListener('push', (event) => {
  let data = { title: '📌 Task Buddy', body: 'Check your pending tasks!' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: data.tag || 'task-buddy-push',
      renotify: true,
      requireInteraction: true,
      silent: false,
      vibrate: [300, 100, 300, 100, 300],
      data: { url: '/dashboard' },
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow('/dashboard');
    })
  );
});

// Periodic Background Sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'task-buddy-checkin') {
    event.waitUntil(
      self.registration.showNotification('📌 Task Buddy Check-in', {
        body: 'Take a quick moment to review your pending tasks and stay productive! 🚀',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'periodic-checkin',
        renotify: true,
        requireInteraction: true,
        silent: false,
        vibrate: [300, 100, 300, 100, 300],
        data: { url: '/dashboard' },
      })
    );
  }
});
