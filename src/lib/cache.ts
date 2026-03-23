interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const MAX_CACHE_SIZE = 500;

const store = new Map<string, CacheEntry<unknown>>();

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) store.delete(key);
  }
}

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCache<T>(key: string, value: T, ttlMs: number): void {
  if (store.size >= MAX_CACHE_SIZE) {
    evictExpired();
  }
  if (store.size >= MAX_CACHE_SIZE) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}
