/**
 * Short-lived in-process memoization for Availability Engine.
 * Serverless isolates still benefit under burst / multi-staff previews.
 */

type CacheEntry<T> = { value: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 30_000;

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet<T>(
  key: string,
  value: T,
  ttlMs = DEFAULT_TTL_MS,
): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheKey(parts: Array<string | number | null | undefined>): string {
  return parts.map((p) => (p == null ? "" : String(p))).join("|");
}

/** Test / hot-reload helper */
export function clearAvailabilityCache(): void {
  store.clear();
}
