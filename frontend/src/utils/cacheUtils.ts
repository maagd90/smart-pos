// Cache utility helpers

export const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  expiry: number;
  url: string;
}

/** Check whether a cache entry is still valid */
export function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() < entry.expiry;
}

/** Build a cache entry with a 24-hour expiry */
export function buildCacheEntry<T>(url: string, data: T): CacheEntry<T> {
  const now = Date.now();
  return {
    url,
    data,
    timestamp: now,
    expiry: now + CACHE_EXPIRY_MS,
  };
}

/** Parse a URL to produce a stable cache key */
export function makeCacheKey(url: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) return url;
  const sorted = Object.keys(params)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = params[k];
      return acc;
    }, {});
  return `${url}?${new URLSearchParams(sorted as Record<string, string>).toString()}`;
}
