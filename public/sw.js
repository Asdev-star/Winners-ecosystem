const CACHE_VERSION = "winners-v3";
const DB_NAME = "winners-offline";
const DB_VERSION = 2;
const OFFLINE_QUEUE = "offline-queue";
const META_STORE = "offline-meta";

const STATIC_ASSETS = [
  "/",
  "/community",
  "/academy",
  "/intelligence",
  "/work",
  "/market",
  "/notifications",
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const PAGE_CACHE_PATTERNS = [
  /^\/academy(?:\/|$)/,
  /^\/community(?:\/|$)/,
  /^\/notifications(?:\/|$)/,
  /^\/profile(?:\/|$)/,
  /^\/work(?:\/|$)/,
  /^\/intelligence(?:\/|$)/,
];

const MEDIA_CACHE_PATTERNS = [
  /^\/uploads\/?/,
  /\.(?:mp4|webm|mp3|wav|pdf|png|jpg|jpeg|webp|gif|svg)$/i,
];

const API_CACHE_RULES = [
  { pattern: /^\/api\/v1\/analytics\/summary(?:\/|$)/, maxAgeMs: null },
  { pattern: /^\/api\/v1\/courses(?:\/|$)/, maxAgeMs: null },
  { pattern: /^\/api\/v1\/posts(?:\/|$)/, maxAgeMs: null },
  { pattern: /^\/api\/v1\/community(?:\/|$)/, maxAgeMs: null },
  { pattern: /^\/api\/v1\/notifications(?:\/|$)/, maxAgeMs: null },
  { pattern: /^\/api\/v1\/work\/jobs(?:\/|$)/, maxAgeMs: 7 * 24 * 60 * 60 * 1000 },
  { pattern: /^\/api\/v1\/omega\/briefing(?:\/|$)/, maxAgeMs: null },
  { pattern: /^\/api\/v1\/omega\/briefing\/morning(?:\/|$)/, maxAgeMs: null },
];

const QUEUEABLE_MUTATIONS = [
  /^\/api\/v1\/posts(?:\/?$|\/[^/]+\/like$|\/[^/]+\/comments(?:\/?$|\/[^/]+\/like$))/,
  /^\/api\/v1\/community\/posts\/[^/]+\/react$/,
  /^\/api\/v1\/work\/jobs\/[^/]+\/apply$/,
  /^\/api\/v1\/messages\/[^/]+$/,
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)));
    await self.clients.claim();
    await broadcastQueueDepth();
    await broadcastCacheMetrics();
    await broadcastSyncMetrics();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.method !== "GET") {
    if (shouldQueueMutation(url.pathname)) {
      event.respondWith(handleQueueableMutation(request));
    }
    return;
  }

  if (request.mode === "navigate" || PAGE_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(handlePageRequest(request));
    return;
  }

  const apiRule = getApiCacheRule(url.pathname);
  if (apiRule) {
    event.respondWith(handleApiRequest(request, apiRule));
    return;
  }

  if (MEDIA_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(handleMediaRequest(request));
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-actions") {
    event.waitUntil(flushOfflineQueue());
  }
});

self.addEventListener("message", (event) => {
  const payload = event.data;
  if (!payload || typeof payload !== "object") {
    return;
  }

  if (payload.type === "SYNC_OFFLINE_QUEUE") {
    event.waitUntil(flushOfflineQueue());
    return;
  }

  if (payload.type === "QUEUE_OFFLINE_ACTION" && payload.action) {
    event.waitUntil(
      addQueuedAction(payload.action).then(() => broadcastQueueDepth()).catch(() => undefined),
    );
  }
});

self.addEventListener("push", (event) => {
  const raw = event.data?.json() ?? {};
  const payload = raw?.notification
    ? {
        title: raw.notification.title,
        body: raw.notification.body,
        url: raw.fcmOptions?.link || raw.data?.url || raw.url,
        actions: raw.notification.actions || raw.data?.actions,
      }
    : raw;

  event.waitUntil(
    self.registration.showNotification(payload.title || "Winners", {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      data: { url: payload.url || "/" },
      actions: payload.actions || [],
      vibrate: [200, 100, 200],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil((async () => {
    const windowClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windowClients) {
      if ("focus" in client) {
        client.postMessage({ type: "PUSH_NOTIFICATION_CLICK", url });
        await client.focus();
        if ("navigate" in client) {
          await client.navigate(url);
        }
        return;
      }
    }

    await clients.openWindow(url);
  })());
});

function getApiCacheRule(pathname) {
  return API_CACHE_RULES.find((rule) => rule.pattern.test(pathname)) ?? null;
}

function shouldQueueMutation(pathname) {
  return QUEUEABLE_MUTATIONS.some((pattern) => pattern.test(pathname));
}

async function handlePageRequest(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);

  if (cached) {
    void recordCacheMetric("hit");
    void refreshCacheEntry(cache, request);
    return cached;
  }

  void recordCacheMetric("miss");

  try {
    const response = await fetch(request);
    if (isSuccessfulResponse(response)) {
      await cache.put(request, response.clone());
      await rememberCacheTimestamp(request.url);
    }
    return response;
  } catch {
    return (await cache.match("/offline.html")) || new Response("Offline", { status: 503 });
  }
}

async function handleApiRequest(request, rule) {
  const cache = await caches.open(CACHE_VERSION);

  try {
    const response = await fetch(request);
    if (isSuccessfulResponse(response)) {
      await cache.put(request, response.clone());
      await rememberCacheTimestamp(request.url);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (!cached) {
      void recordCacheMetric("miss");
      return new Response(JSON.stringify({ offline: true, cached: false }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const freshEnough = await isCacheEntryFresh(request.url, rule.maxAgeMs);
    if (!freshEnough) {
      void recordCacheMetric("miss");
      return new Response(JSON.stringify({ offline: true, expired: true }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    void recordCacheMetric("hit");
    return cached;
  }
}

async function handleMediaRequest(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);

  if (cached) {
    void recordCacheMetric("hit");
    void refreshCacheEntry(cache, request);
    return cached;
  }

  void recordCacheMetric("miss");

  try {
    const response = await fetch(request);
    if (isSuccessfulResponse(response)) {
      await cache.put(request, response.clone());
      await rememberCacheTimestamp(request.url);
    }
    return response;
  } catch {
    return new Response(null, { status: 504 });
  }
}

async function refreshCacheEntry(cache, request) {
  try {
    const response = await fetch(request);
    if (isSuccessfulResponse(response)) {
      await cache.put(request, response.clone());
      await rememberCacheTimestamp(request.url);
    }
  } catch {
    // Stale content is still better than nothing while offline.
  }
}

async function handleQueueableMutation(request) {
  try {
    return await fetch(request.clone());
  } catch {
    const queuedAction = await serializeRequestForQueue(request.clone());
    if (!queuedAction) {
      return new Response(JSON.stringify({ offline: true, queued: false }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    await addQueuedAction(queuedAction);
    await broadcastQueueDepth();

    return new Response(JSON.stringify({
      queued: true,
      offline: true,
      message: "Action queued and will sync when you reconnect.",
    }), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function serializeRequestForQueue(request) {
  const contentType = request.headers.get("Content-Type") || "application/json";
  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");

  let body = null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      if (contentType.includes("application/json")) {
        body = await request.json();
      } else {
        body = await request.text();
      }
    } catch {
      body = null;
    }
  }

  return {
    id: `${request.method}:${request.url}:${Date.now()}`,
    url: request.url,
    method: request.method,
    body,
    contentType,
    token,
    timestamp: Date.now(),
  };
}

async function flushOfflineQueue() {
  const db = await openDB();
  const actions = await getAllQueuedActions(db);
  let successCount = 0;
  let failureCount = 0;

  for (const action of actions) {
    try {
      const response = await fetch(action.url, {
        method: action.method,
        headers: buildQueuedHeaders(action),
        body: formatQueuedBody(action),
      });

      if (!response.ok) {
        failureCount += 1;
        continue;
      }

      await deleteQueuedAction(db, action.id);
      successCount += 1;
    } catch {
      failureCount += 1;
    }
  }

  await incrementMetric("sync-successes", successCount);
  await incrementMetric("sync-failures", failureCount);
  await broadcastQueueDepth();
  await broadcastSyncMetrics();

  if (failureCount > 0) {
    await broadcastToClients({ type: "OFFLINE_SYNC_FAILED", message: "Some queued actions are still pending." });
    return;
  }

  await broadcastToClients({
    type: "OFFLINE_SYNC_COMPLETED",
    count: await getQueuedActionCount(db),
    syncedAt: Date.now(),
  });
}

function buildQueuedHeaders(action) {
  const headers = {};
  if (action.contentType) {
    headers["Content-Type"] = action.contentType;
  }
  if (action.token) {
    headers.Authorization = `Bearer ${action.token}`;
  }
  return headers;
}

function formatQueuedBody(action) {
  if (action.body == null || action.method === "GET" || action.method === "HEAD") {
    return undefined;
  }

  return typeof action.body === "string" ? action.body : JSON.stringify(action.body);
}

function isSuccessfulResponse(response) {
  return response && response.ok;
}

async function recordCacheMetric(kind) {
  await incrementMetric(kind === "hit" ? "cache-hits" : "cache-misses", 1);
  await broadcastCacheMetrics();
}

async function broadcastQueueDepth() {
  const db = await openDB();
  const count = await getQueuedActionCount(db);
  await broadcastToClients({ type: "OFFLINE_QUEUE_UPDATED", count });
}

async function broadcastSyncMetrics() {
  const [successes, failures] = await Promise.all([
    getMetric("sync-successes"),
    getMetric("sync-failures"),
  ]);
  const total = successes + failures;
  await broadcastToClients({
    type: "OFFLINE_SYNC_METRICS",
    successes,
    failures,
    successRate: total > 0 ? successes / total : 1,
  });
}

async function broadcastCacheMetrics() {
  const [hits, misses] = await Promise.all([
    getMetric("cache-hits"),
    getMetric("cache-misses"),
  ]);
  const total = hits + misses;
  await broadcastToClients({
    type: "OFFLINE_CACHE_METRICS",
    hits,
    misses,
    hitRate: total > 0 ? hits / total : 1,
  });
}

async function broadcastToClients(message) {
  const windowClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  await Promise.all(windowClients.map((client) => client.postMessage(message)));
}

async function rememberCacheTimestamp(url) {
  await setMeta(`cache:${url}`, Date.now());
}

async function isCacheEntryFresh(url, maxAgeMs) {
  if (!maxAgeMs) {
    return true;
  }

  const lastCached = await getMeta(`cache:${url}`);
  if (!lastCached) {
    return false;
  }

  return Date.now() - lastCached <= maxAgeMs;
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(OFFLINE_QUEUE)) {
        request.result.createObjectStore(OFFLINE_QUEUE, { keyPath: "id" });
      }

      if (!request.result.objectStoreNames.contains(META_STORE)) {
        request.result.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllQueuedActions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_QUEUE, "readonly");
    const store = transaction.objectStore(OFFLINE_QUEUE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

function getQueuedActionCount(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_QUEUE, "readonly");
    const store = transaction.objectStore(OFFLINE_QUEUE);
    const request = store.count();

    request.onsuccess = () => resolve(request.result || 0);
    request.onerror = () => reject(request.error);
  });
}

function addQueuedAction(action) {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const transaction = db.transaction(OFFLINE_QUEUE, "readwrite");
    const store = transaction.objectStore(OFFLINE_QUEUE);
    const request = store.put(action);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

function deleteQueuedAction(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_QUEUE, "readwrite");
    const store = transaction.objectStore(OFFLINE_QUEUE);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

async function getMeta(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(META_STORE, "readonly");
    const store = transaction.objectStore(META_STORE);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result?.value ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function setMeta(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(META_STORE, "readwrite");
    const store = transaction.objectStore(META_STORE);
    const request = store.put({ key, value });

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

async function incrementMetric(key, incrementBy) {
  const current = Number((await getMeta(`metric:${key}`)) || 0);
  await setMeta(`metric:${key}`, current + incrementBy);
}

async function getMetric(key) {
  return Number((await getMeta(`metric:${key}`)) || 0);
}
