import { useState, useCallback } from 'react';

export interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
}

const MAX_RETRIES = 3;
const QUEUE_KEY = 'smart_pos_sync_queue';

function loadQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedRequest[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedRequest[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export interface SyncQueueState {
  queue: QueuedRequest[];
  enqueue: (req: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>) => void;
  dequeue: (id: string) => void;
  clearQueue: () => void;
  size: number;
}

/**
 * Hook that manages a persisted sync queue for offline POST/PUT/DELETE requests.
 */
export function useSyncQueue(): SyncQueueState {
  const [queue, setQueue] = useState<QueuedRequest[]>(() => loadQueue());

  const enqueue = useCallback(
    (req: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>) => {
      const now = Date.now();
      const entry: QueuedRequest = {
        ...req,
        id: `${now}-${Math.random().toString(36).slice(2)}`,
        timestamp: now,
        retries: 0,
      };
      setQueue((prev) => {
        const next = [...prev, entry];
        saveQueue(next);
        return next;
      });
    },
    []
  );

  const dequeue = useCallback((id: string) => {
    setQueue((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveQueue(next);
      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    saveQueue([]);
  }, []);

  return { queue, enqueue, dequeue, clearQueue, size: queue.length };
}

export { MAX_RETRIES };
