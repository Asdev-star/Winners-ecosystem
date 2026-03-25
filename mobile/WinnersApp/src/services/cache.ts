import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

export const CACHE_TTL = {
  feed: 5 * 60 * 1000,
  courses: 30 * 60 * 1000,
  products: 15 * 60 * 1000,
  profile: 60 * 60 * 1000,
  jobs: 10 * 60 * 1000,
} as const;

export type CacheBucket = keyof typeof CACHE_TTL;

type CacheEnvelope<T> = {
  value: T;
  cachedAt: number;
  expiresAt: number;
};

type ImageCacheEntry = {
  key: string;
  path: string;
  size: number;
  lastAccessedAt: number;
};

const DATA_PREFIX = "winners:cache:data:";
const IMAGE_INDEX_KEY = "winners:cache:image-index";
const IMAGE_CACHE_LIMIT_BYTES = 200 * 1024 * 1024;
const IMAGE_CACHE_DIR = `${FileSystem.cacheDirectory ?? ""}images/`;
const VIDEO_CACHE_DIR = `${FileSystem.documentDirectory ?? ""}videos/`;

function now() {
  return Date.now();
}

function hashKey(input: string) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

async function ensureDirectory(path: string) {
  if (!path) return;
  await FileSystem.makeDirectoryAsync(path, { intermediates: true }).catch(() => undefined);
}

async function loadImageIndex(): Promise<Record<string, ImageCacheEntry>> {
  const raw = await AsyncStorage.getItem(IMAGE_INDEX_KEY);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as Record<string, ImageCacheEntry>;
  } catch {
    return {};
  }
}

async function saveImageIndex(index: Record<string, ImageCacheEntry>) {
  await AsyncStorage.setItem(IMAGE_INDEX_KEY, JSON.stringify(index));
}

export async function getCachedValue<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(`${DATA_PREFIX}${key}`);
  if (!raw) return null;

  try {
    const entry = JSON.parse(raw) as CacheEnvelope<T>;

    if (entry.expiresAt <= now()) {
      await AsyncStorage.removeItem(`${DATA_PREFIX}${key}`);
      return null;
    }

    return entry.value;
  } catch {
    await AsyncStorage.removeItem(`${DATA_PREFIX}${key}`);
    return null;
  }
}

export async function setCachedValue<T>(key: string, value: T, ttlMs: number) {
  const cachedAt = now();
  const entry: CacheEnvelope<T> = {
    value,
    cachedAt,
    expiresAt: cachedAt + ttlMs,
  };

  await AsyncStorage.setItem(`${DATA_PREFIX}${key}`, JSON.stringify(entry));
}

export async function invalidateCachedValue(key: string) {
  await AsyncStorage.removeItem(`${DATA_PREFIX}${key}`);
}

export async function fetchWithCache<T>(bucket: CacheBucket, key: string, fetcher: () => Promise<T>): Promise<T> {
  const cacheKey = `${bucket}:${key}`;
  const cached = await getCachedValue<T>(cacheKey);

  if (cached !== null) {
    return cached;
  }

  const fresh = await fetcher();
  await setCachedValue(cacheKey, fresh, CACHE_TTL[bucket]);
  return fresh;
}

export async function clearExpiredDataCache(keys: string[]) {
  await Promise.all(
    keys.map(async (key) => {
      await getCachedValue(key);
    })
  );
}

export async function cacheImage(uri: string): Promise<string> {
  await ensureDirectory(IMAGE_CACHE_DIR);

  const extension = uri.split(".").pop()?.split("?")[0] ?? "img";
  const key = hashKey(uri);
  const path = `${IMAGE_CACHE_DIR}${key}.${extension}`;
  const index = await loadImageIndex();
  const existing = await FileSystem.getInfoAsync(path);

  if (!existing.exists) {
    await FileSystem.downloadAsync(uri, path);
  }

  const info = await FileSystem.getInfoAsync(path);
  index[key] = {
    key,
    path,
    size: info.exists ? (info.size ?? 0) : 0,
    lastAccessedAt: now(),
  };

  await saveImageIndex(index);
  await pruneImageCache();

  return path;
}

export async function pruneImageCache(limitBytes = IMAGE_CACHE_LIMIT_BYTES) {
  const index = await loadImageIndex();
  const entries = Object.values(index).sort((left, right) => left.lastAccessedAt - right.lastAccessedAt);
  let total = entries.reduce((sum, entry) => sum + entry.size, 0);

  for (const entry of entries) {
    if (total <= limitBytes) break;

    await FileSystem.deleteAsync(entry.path, { idempotent: true }).catch(() => undefined);
    delete index[entry.key];
    total -= entry.size;
  }

  await saveImageIndex(index);
}

export async function downloadVideo(uri: string, filename?: string) {
  await ensureDirectory(VIDEO_CACHE_DIR);

  const safeName = filename ?? `${hashKey(uri)}.mp4`;
  const path = `${VIDEO_CACHE_DIR}${safeName}`;
  await FileSystem.downloadAsync(uri, path);
  return path;
}

export async function deleteCachedVideo(path: string) {
  await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => undefined);
}

export const cache = {
  ttl: CACHE_TTL,
  get: getCachedValue,
  set: setCachedValue,
  invalidate: invalidateCachedValue,
  fetch: fetchWithCache,
  clearExpiredDataCache,
  cacheImage,
  pruneImageCache,
  downloadVideo,
  deleteCachedVideo,
};
