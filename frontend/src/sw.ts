/**
 * Service Worker source (TypeScript)
 * This file is the typed reference; the compiled output is public/sw.js.
 *
 * Cache strategies:
 *  - GET requests   → cache-first with network fallback (24 h TTL)
 *  - Other methods  → network-only (queued in IndexedDB when offline)
 *  - Static assets  → cache with stale-while-revalidate
 */

/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

export type {};

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'smart-pos-v1';
const API_CACHE_NAME = 'smart-pos-api-v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.ico',
];

// ─── Install ─────────────────────────────────────────────────────────────────

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') return;

  // API requests – cache-first with network update
  if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) {
    event.respondWith(apiCacheFirst(request));
    return;
  }

  // Static assets – stale while revalidate
  event.respondWith(staleWhileRevalidate(request));
});

async function apiCacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open(API_CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    const dateHeader = cached.headers.get('sw-cached-at');
    const age = dateHeader ? Date.now() - Number(dateHeader) : Infinity;
    if (age < CACHE_TTL_MS) {
      // Serve cache; update in background
      fetchAndCache(request, cache);
      return cached;
    }
  }

  return fetchAndCache(request, cache);
}

async function fetchAndCache(request: Request, cache: Cache): Promise<Response> {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set('sw-cached-at', String(Date.now()));
      const cloned = new Response(await response.clone().arrayBuffer(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      cache.put(request, cloned);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response('{"error":"Offline"}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached ?? new Response('Offline', { status: 503 }));

  return cached ?? networkPromise;
}
