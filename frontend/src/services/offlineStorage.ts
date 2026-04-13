/**
 * Offline Storage Layer
 * Uses IndexedDB for API response caching and LocalStorage for auth/session.
 */

import { CacheEntry, buildCacheEntry, isCacheValid } from '../utils/cacheUtils';

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const LS_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
  USER_ROLE: 'user_role',
  SHOP_ID: 'shop_id',
} as const;

export const localStore = {
  setAuthToken(token: string): void {
    localStorage.setItem(LS_KEYS.AUTH_TOKEN, token);
  },
  getAuthToken(): string | null {
    return localStorage.getItem(LS_KEYS.AUTH_TOKEN);
  },
  setRefreshToken(token: string): void {
    localStorage.setItem(LS_KEYS.REFRESH_TOKEN, token);
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(LS_KEYS.REFRESH_TOKEN);
  },
  setUserInfo(user: unknown): void {
    localStorage.setItem(LS_KEYS.USER_INFO, JSON.stringify(user));
  },
  getUserInfo<T>(): T | null {
    const raw = localStorage.getItem(LS_KEYS.USER_INFO);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setUserRole(role: string): void {
    localStorage.setItem(LS_KEYS.USER_ROLE, role);
  },
  getUserRole(): string | null {
    return localStorage.getItem(LS_KEYS.USER_ROLE);
  },
  setShopId(shopId: string): void {
    localStorage.setItem(LS_KEYS.SHOP_ID, shopId);
  },
  getShopId(): string | null {
    return localStorage.getItem(LS_KEYS.SHOP_ID);
  },
  clearAuth(): void {
    Object.values(LS_KEYS).forEach((key) => localStorage.removeItem(key));
  },
};

// ─── IndexedDB helpers ───────────────────────────────────────────────────────

const DB_NAME = 'smart-pos-cache';
const DB_VERSION = 1;
const STORE_NAME = 'apiCache';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('expiry', 'expiry', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const indexedStore = {
  async store<T>(url: string, data: T): Promise<void> {
    const db = await openDB();
    const entry = buildCacheEntry(url, data);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async retrieve<T>(url: string): Promise<T | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(url) as IDBRequest<CacheEntry<T>>;
      req.onsuccess = () => {
        const entry = req.result;
        if (!entry || !isCacheValid(entry)) {
          resolve(null);
        } else {
          resolve(entry.data);
        }
      };
      req.onerror = () => reject(req.error);
    });
  },

  async clear(url?: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const objectStore = tx.objectStore(STORE_NAME);
      const req = url ? objectStore.delete(url) : objectStore.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async purgeExpired(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const objectStore = tx.objectStore(STORE_NAME);
      const req = objectStore.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) {
          resolve();
          return;
        }
        const entry = cursor.value as CacheEntry;
        if (!isCacheValid(entry)) {
          cursor.delete();
        }
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
  },
};
