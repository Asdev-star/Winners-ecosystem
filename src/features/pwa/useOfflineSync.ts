import { useCallback, useEffect, useMemo, useState } from "react";

export interface QueuedAction {
  id: string;
  url: string;
  method: string;
  body: unknown;
  contentType?: string;
  token: string;
  timestamp: number;
}

type OfflineAction = {
  id?: string;
  type?: string;
  endpoint?: string | null;
  url?: string | null;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  createdAt?: number;
  syncTag?: string;
};

type ServiceWorkerQueueMessage =
  | { type: "OFFLINE_QUEUE_UPDATED"; count: number }
  | { type: "OFFLINE_SYNC_COMPLETED"; count: number; syncedAt: number }
  | { type: "OFFLINE_SYNC_FAILED"; message?: string }
  | { type: "OFFLINE_SYNC_METRICS"; successes: number; failures: number; successRate: number }
  | { type: "OFFLINE_CACHE_METRICS"; hits: number; misses: number; hitRate: number };

type SyncCapableRegistration = ServiceWorkerRegistration & {
  sync?: { register: (tag: string) => Promise<void> };
};

const DB_NAME = "winners-offline";
const STORE = "offline-queue";
const PENDING_KEY = "we_offline_pending_count";
const LAST_SYNC_KEY = "we_offline_last_sync";
const QUEUE_EVENT = "winners:offline-queue-updated";
const SYNC_SUCCESS_KEY = "we_offline_sync_successes";
const SYNC_FAILURE_KEY = "we_offline_sync_failures";
const CACHE_HIT_KEY = "we_offline_cache_hits";
const CACHE_MISS_KEY = "we_offline_cache_misses";

function canUseBrowserAPIs() {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

function readStoredNumber(key: string) {
  if (!canUseBrowserAPIs()) {
    return 0;
  }

  const raw = window.localStorage.getItem(key);
  return raw ? Number(raw) || 0 : 0;
}

function readStoredNullableNumber(key: string) {
  if (!canUseBrowserAPIs()) {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  return raw ? Number(raw) || null : null;
}

function setStoredPendingCount(count: number) {
  if (!canUseBrowserAPIs()) {
    return;
  }

  window.localStorage.setItem(PENDING_KEY, String(count));
  window.dispatchEvent(new CustomEvent(QUEUE_EVENT, { detail: { count } }));
}

function setStoredLastSync(timestamp: number) {
  if (!canUseBrowserAPIs()) {
    return;
  }

  window.localStorage.setItem(LAST_SYNC_KEY, String(timestamp));
}

function setStoredMetric(key: string, value: number) {
  if (!canUseBrowserAPIs()) {
    return;
  }

  window.localStorage.setItem(key, String(value));
}

function calculateRate(successes: number, failures: number) {
  const total = successes + failures;
  return total > 0 ? successes / total : 1;
}

function readBody(body: BodyInit | null | undefined) {
  if (typeof body !== "string") {
    return body ?? null;
  }

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function countRecords(store: IDBObjectStore) {
  return new Promise<number>((resolve, reject) => {
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllRecords(store: IDBObjectStore) {
  return new Promise<QueuedAction[]>((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve((request.result || []) as QueuedAction[]);
    request.onerror = () => reject(request.error);
  });
}

function deleteRecord(store: IDBObjectStore, id: string) {
  return new Promise<void>((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getQueueCount() {
  const db = await openDB();

  try {
    return await countRecords(db.transaction(STORE, "readonly").objectStore(STORE));
  } finally {
    db.close();
  }
}

async function syncStoredQueueCount() {
  try {
    const count = await getQueueCount();
    setStoredPendingCount(count);
    return count;
  } catch (error) {
    console.error("[OfflineSync] Failed to read queued action count", error);
    return readStoredNumber(PENDING_KEY);
  }
}

async function flushQueueInWindow() {
  const db = await openDB();

  try {
    const readTransaction = db.transaction(STORE, "readonly");
    const actions = await getAllRecords(readTransaction.objectStore(STORE));
    let synced = 0;

    for (const action of actions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${action.token}`,
          },
          body: action.body == null ? undefined : JSON.stringify(action.body),
        });

        if (!response.ok) {
          continue;
        }

        const writeTransaction = db.transaction(STORE, "readwrite");
        await deleteRecord(writeTransaction.objectStore(STORE), action.id);
        synced += 1;
      } catch {
        // Leave failed actions in the queue for the next sync attempt.
      }
    }

    const remaining = await countRecords(db.transaction(STORE, "readonly").objectStore(STORE));
    setStoredPendingCount(remaining);

    if (synced > 0) {
      setStoredLastSync(Date.now());
    }

    return { remaining, synced };
  } finally {
    db.close();
  }
}

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueAction(action: Omit<QueuedAction, "id" | "timestamp">) {
  const db = await openDB();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      const store = transaction.objectStore(STORE);
      const request = store.add({
        ...action,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      } satisfies QueuedAction);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    const count = await countRecords(db.transaction(STORE, "readonly").objectStore(STORE));
    setStoredPendingCount(count);
  } finally {
    db.close();
  }

  if (canUseBrowserAPIs() && "serviceWorker" in navigator) {
    const registration = (await navigator.serviceWorker.ready) as SyncCapableRegistration;
    if (registration.sync?.register) {
      await registration.sync.register("sync-offline-actions");
    }
  }
}

export async function fetchWithOfflineSupport(url: string, options: RequestInit, authToken: string): Promise<Response | null> {
  if (!canUseBrowserAPIs() || navigator.onLine) {
    return fetch(url, options);
  }

  await queueAction({
    url,
    method: options.method || "POST",
    body: readBody(options.body),
    token: authToken,
  });

  return null;
}

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(() => (canUseBrowserAPIs() ? navigator.onLine : true));
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingActions, setPendingActions] = useState(() => readStoredNumber(PENDING_KEY));
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(() => readStoredNullableNumber(LAST_SYNC_KEY));
  const [syncSuccesses, setSyncSuccesses] = useState(() => readStoredNumber(SYNC_SUCCESS_KEY));
  const [syncFailures, setSyncFailures] = useState(() => readStoredNumber(SYNC_FAILURE_KEY));
  const [cacheHits, setCacheHits] = useState(() => readStoredNumber(CACHE_HIT_KEY));
  const [cacheMisses, setCacheMisses] = useState(() => readStoredNumber(CACHE_MISS_KEY));

  const requestSync = useCallback(async (tag: string | string[] = "sync-offline-actions") => {
    if (!canUseBrowserAPIs() || !("serviceWorker" in navigator)) {
      return false;
    }

    const registration = (await navigator.serviceWorker.ready) as SyncCapableRegistration;
    const tags = Array.isArray(tag) ? tag : [tag];
    setIsSyncing(true);

    try {
      if (registration.sync?.register) {
        await Promise.all(tags.map((entry) => registration.sync?.register(entry)));
      } else if (navigator.onLine) {
        const result = await flushQueueInWindow();
        setPendingActions(result.remaining);
        if (result.synced > 0) {
          const syncedAt = Date.now();
          setLastSyncAt(syncedAt);
          setStoredLastSync(syncedAt);
        }
      } else {
        return false;
      }

      return true;
    } catch (error) {
      console.error("[OfflineSync] Failed to request background sync", error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!canUseBrowserAPIs()) {
      return undefined;
    }

    void syncStoredQueueCount().then((count) => setPendingActions(count));

    const handleOnline = () => {
      setIsOnline(true);
      void syncStoredQueueCount().then((count) => setPendingActions(count));
      void requestSync("sync-offline-actions");
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueUpdated = () => {
      const count = readStoredNumber(PENDING_KEY);
      setPendingActions(count);
    };

    const handleMessage = (event: MessageEvent<ServiceWorkerQueueMessage>) => {
      const payload = event.data;
      if (!payload) {
        return;
      }

      if (payload.type === "OFFLINE_QUEUE_UPDATED") {
        setStoredPendingCount(payload.count);
        setPendingActions(payload.count);
        return;
      }

      if (payload.type === "OFFLINE_SYNC_COMPLETED") {
        setStoredPendingCount(payload.count);
        setStoredLastSync(payload.syncedAt);
        setPendingActions(payload.count);
        setLastSyncAt(payload.syncedAt);
        return;
      }

      if (payload.type === "OFFLINE_SYNC_METRICS") {
        setStoredMetric(SYNC_SUCCESS_KEY, payload.successes);
        setStoredMetric(SYNC_FAILURE_KEY, payload.failures);
        setSyncSuccesses(payload.successes);
        setSyncFailures(payload.failures);
        return;
      }

      if (payload.type === "OFFLINE_CACHE_METRICS") {
        setStoredMetric(CACHE_HIT_KEY, payload.hits);
        setStoredMetric(CACHE_MISS_KEY, payload.misses);
        setCacheHits(payload.hits);
        setCacheMisses(payload.misses);
        return;
      }

      if (payload.type === "OFFLINE_SYNC_FAILED") {
        setIsSyncing(false);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void syncStoredQueueCount().then((count) => setPendingActions(count));
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", handleQueueUpdated);
    window.addEventListener(QUEUE_EVENT, handleQueueUpdated as EventListener);
    document.addEventListener("visibilitychange", handleVisibility);
    navigator.serviceWorker?.addEventListener("message", handleMessage as EventListener);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", handleQueueUpdated);
      window.removeEventListener(QUEUE_EVENT, handleQueueUpdated as EventListener);
      document.removeEventListener("visibilitychange", handleVisibility);
      navigator.serviceWorker?.removeEventListener("message", handleMessage as EventListener);
    };
  }, [requestSync]);

  const queueOfflineAction = useCallback(async (action: OfflineAction) => {
    const authHeader = action.headers?.Authorization ?? action.headers?.authorization ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const contentType = action.headers?.["Content-Type"] ?? action.headers?.["content-type"];
    const url = action.url ?? action.endpoint;

    if (!url) {
      return false;
    }

    await queueAction({
      url,
      method: action.method || "POST",
      body: action.body ?? null,
      contentType,
      token,
    });

    const count = await syncStoredQueueCount();
    setPendingActions(count);

    if (!navigator.onLine) {
      await requestSync(action.syncTag ?? "sync-offline-actions");
    }

    return true;
  }, [requestSync]);

  const flushQueuedActions = useCallback(async () => requestSync("sync-offline-actions"), [requestSync]);

  const hasPendingActions = useMemo(() => pendingActions > 0, [pendingActions]);
  const syncSuccessRate = useMemo(() => calculateRate(syncSuccesses, syncFailures), [syncFailures, syncSuccesses]);
  const cacheHitRate = useMemo(() => calculateRate(cacheHits, cacheMisses), [cacheHits, cacheMisses]);

  return {
    isOnline,
    isSyncing,
    pendingActions,
    hasPendingActions,
    lastSyncAt,
    syncSuccesses,
    syncFailures,
    syncSuccessRate,
    cacheHits,
    cacheMisses,
    cacheHitRate,
    queueOfflineAction,
    flushQueuedActions,
    requestSync,
  };
};
