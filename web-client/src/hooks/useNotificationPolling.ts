import { useCallback, useEffect, useRef } from 'react';
import { listNotifications, NotificationItem } from '../api/notifications';

const SEEN_KEY = 'smartpos_seen_notification_ids';
const POLL_INTERVAL_MS = 30_000;

function loadSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>) {
  const trimmed = [...ids].slice(-500);
  localStorage.setItem(SEEN_KEY, JSON.stringify(trimmed));
}

function showBrowserNotification(item: NotificationItem) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  const notification = new Notification(item.title, {
    body: item.body,
    tag: item.id,
  });
  notification.onclick = () => {
    window.focus();
    window.location.hash = `#notification-${item.id}`;
    notification.close();
  };
}

export function useNotificationPolling(enabled: boolean, onUpdate: (items: NotificationItem[]) => void) {
  const seenRef = useRef<Set<string>>(loadSeenIds());
  const itemsRef = useRef<NotificationItem[]>([]);

  const poll = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const items = await listNotifications('PENDING');
      itemsRef.current = items;
      onUpdate(items);

      for (const item of items) {
        if (seenRef.current.has(item.id)) continue;
        seenRef.current.add(item.id);
        showBrowserNotification(item);
      }
      saveSeenIds(seenRef.current);
    } catch {
      // Ignore transient network errors while polling.
    }
  }, [onUpdate]);

  useEffect(() => {
    if (!enabled) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }

    poll();
    const timer = window.setInterval(poll, POLL_INTERVAL_MS);
    const onOnline = () => poll();
    window.addEventListener('online', onOnline);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('online', onOnline);
    };
  }, [enabled, poll]);

  return { refresh: poll };
}
