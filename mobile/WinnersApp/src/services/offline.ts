import * as SQLite from "expo-sqlite";

export type OfflineAction = {
  id: string;
  endpoint: string;
  method: string;
  body?: unknown;
  headers?: Record<string, string>;
  createdAt: number;
};

type OfflineSnapshot = {
  isOnline: boolean;
  queue: OfflineAction[];
  isSyncing: boolean;
};

type Listener = (snapshot: OfflineSnapshot) => void;

const listeners = new Set<Listener>();
const db = SQLite.openDatabaseSync("winners-mobile.db");

db.execSync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS offline_queue (
    id TEXT PRIMARY KEY NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    body TEXT,
    headers TEXT,
    createdAt INTEGER NOT NULL
  );
`);

let snapshot: OfflineSnapshot = {
  isOnline: true,
  queue: [],
  isSyncing: false,
};

function readQueueFromDatabase(): OfflineAction[] {
  const rows = db.getAllSync<{
    id: string;
    endpoint: string;
    method: string;
    body: string | null;
    headers: string | null;
    createdAt: number;
  }>("SELECT id, endpoint, method, body, headers, createdAt FROM offline_queue ORDER BY createdAt ASC");

  return rows.map((row) => ({
    id: row.id,
    endpoint: row.endpoint,
    method: row.method,
    body: row.body ? JSON.parse(row.body) : undefined,
    headers: row.headers ? (JSON.parse(row.headers) as Record<string, string>) : undefined,
    createdAt: row.createdAt,
  }));
}

function hydrateQueue() {
  snapshot = {
    ...snapshot,
    queue: readQueueFromDatabase(),
  };
}

function publish() {
  listeners.forEach((listener) => listener(snapshot));
}

export const offline = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    listener(snapshot);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot() {
    return snapshot;
  },

  restore() {
    hydrateQueue();
    publish();
  },

  setOnline(isOnline: boolean) {
    snapshot = { ...snapshot, isOnline };
    publish();
  },

  enqueue(action: Omit<OfflineAction, "id" | "createdAt">) {
    const nextAction: OfflineAction = {
      ...action,
      id: `${action.method}-${Date.now()}`,
      createdAt: Date.now(),
    };

    db.runSync(
      "INSERT INTO offline_queue (id, endpoint, method, body, headers, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      [
        nextAction.id,
        nextAction.endpoint,
        nextAction.method,
        nextAction.body == null ? null : JSON.stringify(nextAction.body),
        nextAction.headers == null ? null : JSON.stringify(nextAction.headers),
        nextAction.createdAt,
      ],
    );

    snapshot = {
      ...snapshot,
      isOnline: false,
      queue: [...snapshot.queue, nextAction],
    };

    publish();
    return nextAction;
  },

  async flush(processor: (action: OfflineAction) => Promise<void>) {
    if (!snapshot.queue.length) return;

    snapshot = { ...snapshot, isSyncing: true };
    publish();

    const remaining: OfflineAction[] = [];
    for (const action of snapshot.queue) {
      try {
        await processor(action);
        db.runSync("DELETE FROM offline_queue WHERE id = ?", [action.id]);
      } catch {
        remaining.push(action);
      }
    }

    snapshot = {
      ...snapshot,
      isOnline: remaining.length === 0,
      isSyncing: false,
      queue: remaining,
    };
    publish();
  },
};

hydrateQueue();
