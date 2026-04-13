/* eslint-disable no-restricted-globals */
/**
 * Service Worker (public/sw.js)
 * Served as a static file and registered by index.tsx at runtime.
 *
 * Cache strategies:
 *  - GET /api/* → cache-first with 24-hour TTL and background refresh
 *  - Static assets → stale-while-revalidate
 */

const CACHE_NAME = 'smart-pos-v1';
const API_CACHE_NAME = 'smart-pos-api-v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/favicon.ico'];

// ─── Install ─────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== API_CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    event.respondWith(apiCacheFirst(req));
  } else {
    event.respondWith(staleWhileRevalidate(req));
  }
});

async function apiCacheFirst(request) {
  const cache = await caches.open(API_CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    const age = Date.now() - Number(cached.headers.get('sw-cached-at') || 0);
    if (age < CACHE_TTL_MS) {
      fetchAndCache(request, cache); // background refresh
      return cached;
    }
  }

  return fetchAndCache(request, cache);
}

async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set('sw-cached-at', String(Date.now()));
      const body = await response.clone().arrayBuffer();
      const cloned = new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      cache.put(request, cloned);
    }
    return response;
  } catch (_) {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response('{"error":"Offline"}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached || new Response('Offline', { status: 503 }));

  return cached || networkPromise;
}
