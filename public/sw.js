// Winners Ecosystem Service Worker
// Provides offline caching and push notification support

const CACHE_NAME = 'winners-ecosystem-v2';
const STATIC_CACHE = 'winners-static-v2';
const DYNAMIC_CACHE = 'winners-dynamic-v2';
const OFFLINE_DB = 'winners-offline-db';
const OFFLINE_STORE = 'queued-actions';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/pwa-192x192.svg',
  '/pwa-512x512.svg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  // Take control immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests - always go to network unless it's a specific cached endpoint
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  // For HTML pages - Network First
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page if available
            return caches.match('/');
          });
        })
    );
    return;
  }

  // For static assets - Cache First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response and update cache in background
        fetch(request).then((response) => {
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, response);
          });
        }).catch(() => {}); // Ignore network errors for background update
        return cachedResponse;
      }

      // Not in cache - fetch from network
      return fetch(request).then((response) => {
        // Cache the response
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      });
    })
  );
});

self.addEventListener('message', (event) => {
  const payload = event.data;
  if (!payload || payload.type !== 'QUEUE_OFFLINE_ACTION' || !payload.action) {
    return;
  }

  event.waitUntil(queueOfflineAction(payload.action));
});

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'Winners Ecosystem', body: event.data.text() };
  }
  
  const options = {
    body: data.body || 'New notification from Winners Ecosystem',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    image: data.image || null,
    vibrate: [100, 50, 100],
    tag: data.tag || 'winners-notification',
    renotify: true,
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: data.actions || [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Winners Ecosystem', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }

  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts());
  }
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncCart() {
  console.log('[SW] Syncing cart...');
  await syncQueuedActionsByType('cart');
}

async function syncPosts() {
  console.log('[SW] Syncing posts...');
  await syncQueuedActionsByType('post');
}

async function syncMessages() {
  console.log('[SW] Syncing messages...');
  await syncQueuedActionsByType('message');
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'get-daily-news') {
    event.waitUntil(fetchDailyNews());
  }
});

async function fetchDailyNews() {
  console.log('[SW] Fetching daily news in background...');
}

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE)) {
        db.createObjectStore(OFFLINE_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function queueOfflineAction(action) {
  const db = await openOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_STORE, 'readwrite');
    const store = transaction.objectStore(OFFLINE_STORE);
    store.put({
      id: action.id || `${action.type}-${Date.now()}`,
      type: action.type || 'unknown',
      endpoint: action.endpoint || null,
      method: action.method || 'POST',
      headers: action.headers || {},
      body: action.body || null,
      createdAt: action.createdAt || Date.now(),
    });

    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getQueuedActions() {
  const db = await openOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_STORE, 'readonly');
    const store = transaction.objectStore(OFFLINE_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function removeQueuedAction(id) {
  const db = await openOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_STORE, 'readwrite');
    const store = transaction.objectStore(OFFLINE_STORE);
    store.delete(id);

    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function syncQueuedActionsByType(type) {
  const queued = await getQueuedActions();
  const matching = queued.filter((entry) => entry.type === type);

  for (const action of matching) {
    try {
      if (!action.endpoint) {
        continue;
      }

      const response = await fetch(action.endpoint, {
        method: action.method || 'POST',
        headers: action.headers || {},
        body: action.body ? JSON.stringify(action.body) : undefined,
      });

      if (response.ok) {
        await removeQueuedAction(action.id);
      }
    } catch (error) {
      console.warn('[SW] Failed queued sync action', action.id, error);
    }
  }
}

console.log('[SW] Service worker loaded');
