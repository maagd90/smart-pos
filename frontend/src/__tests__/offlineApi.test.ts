/**
 * Tests for offlineApi – verifies caching and offline queue behaviour.
 */

import { makeCacheKey, buildCacheEntry, isCacheValid, CACHE_EXPIRY_MS } from '../utils/cacheUtils';
import { OfflineQueuedError } from '../services/offlineApi';

// ─── cacheUtils ──────────────────────────────────────────────────────────────

describe('makeCacheKey', () => {
  it('returns the url when no params provided', () => {
    expect(makeCacheKey('/api/products')).toBe('/api/products');
  });

  it('returns the url when empty params provided', () => {
    expect(makeCacheKey('/api/products', {})).toBe('/api/products');
  });

  it('appends sorted query params', () => {
    const key = makeCacheKey('/api/products', { b: '2', a: '1' });
    expect(key).toBe('/api/products?a=1&b=2');
  });
});

describe('buildCacheEntry', () => {
  it('creates a valid cache entry', () => {
    const before = Date.now();
    const entry = buildCacheEntry('/api/test', { id: 1 });
    const after = Date.now();

    expect(entry.url).toBe('/api/test');
    expect(entry.data).toEqual({ id: 1 });
    expect(entry.timestamp).toBeGreaterThanOrEqual(before);
    expect(entry.timestamp).toBeLessThanOrEqual(after);
    expect(entry.expiry).toBe(entry.timestamp + CACHE_EXPIRY_MS);
  });
});

describe('isCacheValid', () => {
  it('returns true for a fresh entry', () => {
    const entry = buildCacheEntry('/api/test', {});
    expect(isCacheValid(entry)).toBe(true);
  });

  it('returns false for an expired entry', () => {
    const entry = buildCacheEntry('/api/test', {});
    // Backdate the expiry to the past
    const expired = { ...entry, expiry: Date.now() - 1 };
    expect(isCacheValid(expired)).toBe(false);
  });
});

// ─── OfflineQueuedError ───────────────────────────────────────────────────────

describe('OfflineQueuedError', () => {
  it('has the correct name and flag', () => {
    const err = new OfflineQueuedError('test');
    expect(err.name).toBe('OfflineQueuedError');
    expect(err.isOfflineQueued).toBe(true);
    expect(err.message).toBe('test');
    expect(err).toBeInstanceOf(Error);
  });
});
