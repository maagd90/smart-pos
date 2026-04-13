/**
 * Offline-Aware API Client
 * Wraps axios: caches GET responses in IndexedDB and queues
 * POST/PUT/DELETE requests when the browser is offline.
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { indexedStore } from './offlineStorage';
import { makeCacheKey } from '../utils/cacheUtils';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Token injected from AuthContext
let authToken: string | null = null;

export const setOfflineApiToken = (token: string | null): void => {
  authToken = token;
};

axiosInstance.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  return config;
});

// ─── Queued request storage key ─────────────────────────────────────────────

const QUEUE_LS_KEY = 'smart_pos_sync_queue';

interface QueuedItem {
  id: string;
  method: string;
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
  timestamp: number;
}

function loadQueue(): QueuedItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_LS_KEY);
    return raw ? (JSON.parse(raw) as QueuedItem[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(q: QueuedItem[]): void {
  localStorage.setItem(QUEUE_LS_KEY, JSON.stringify(q));
}

function addToQueue(item: Omit<QueuedItem, 'id' | 'timestamp'>): void {
  const q = loadQueue();
  const now = Date.now();
  q.push({ ...item, id: `${now}-${Math.random().toString(36).slice(2)}`, timestamp: now });
  saveQueue(q);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const offlineApi = {
  /**
   * GET – tries the network, falls back to cache when offline.
   */
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const cacheKey = makeCacheKey(url, config?.params as Record<string, unknown>);

    if (!navigator.onLine) {
      const cached = await indexedStore.retrieve<T>(cacheKey);
      if (cached !== null) return cached;
      throw new Error('Offline – no cached data available');
    }

    try {
      const res: AxiosResponse<T> = await axiosInstance.get<T>(url, config);
      // Cache successful response
      await indexedStore.store(cacheKey, res.data).catch(() => {
        // Non-fatal; swallow IndexedDB errors
      });
      return res.data;
    } catch (err) {
      // Network failure – serve from cache
      const cached = await indexedStore.retrieve<T>(cacheKey);
      if (cached !== null) return cached;
      throw err;
    }
  },

  /**
   * POST – queues the request when offline.
   */
  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    if (!navigator.onLine) {
      addToQueue({ method: 'POST', url, data });
      throw new OfflineQueuedError('Request queued – will sync when online');
    }
    const res: AxiosResponse<T> = await axiosInstance.post<T>(url, data, config);
    return res.data;
  },

  /**
   * PUT – queues the request when offline.
   */
  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    if (!navigator.onLine) {
      addToQueue({ method: 'PUT', url, data });
      throw new OfflineQueuedError('Request queued – will sync when online');
    }
    const res: AxiosResponse<T> = await axiosInstance.put<T>(url, data, config);
    return res.data;
  },

  /**
   * DELETE – queues the request when offline.
   */
  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    if (!navigator.onLine) {
      addToQueue({ method: 'DELETE', url });
      throw new OfflineQueuedError('Request queued – will sync when online');
    }
    const res: AxiosResponse<T> = await axiosInstance.delete<T>(url, config);
    return res.data;
  },

  /**
   * Retry all queued requests (called automatically when going online).
   * Returns the number of successfully replayed requests.
   */
  async sync(): Promise<number> {
    const queue = loadQueue();
    if (queue.length === 0) return 0;

    let replayed = 0;
    const remaining: QueuedItem[] = [];

    for (const item of queue) {
      try {
        if (item.method === 'POST') {
          await axiosInstance.post(item.url, item.data);
        } else if (item.method === 'PUT') {
          await axiosInstance.put(item.url, item.data);
        } else if (item.method === 'DELETE') {
          await axiosInstance.delete(item.url);
        }
        replayed++;
      } catch {
        remaining.push(item);
      }
    }

    saveQueue(remaining);
    return replayed;
  },

  /** Expose queue size for UI feedback */
  queueSize(): number {
    return loadQueue().length;
  },
};

/** Thrown when a mutating request is queued instead of sent */
export class OfflineQueuedError extends Error {
  readonly isOfflineQueued = true;
  constructor(message: string) {
    super(message);
    this.name = 'OfflineQueuedError';
  }
}

export default offlineApi;
