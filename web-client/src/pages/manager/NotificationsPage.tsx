import { FormEvent, useCallback, useState } from 'react';
import { useCanAny } from '../../components/Can';
import {
  decideNotification,
  getNotification,
  listNotifications,
  NotificationItem,
} from '../../api/notifications';
import { useNotificationPolling } from '../../hooks/useNotificationPolling';

export function NotificationsPage() {
  const canApprove = useCanAny(['deal.approve', 'inventory.change.approve']);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<NotificationItem | null>(null);

  const onUpdate = useCallback((next: NotificationItem[]) => {
    setItems(next);
    setLoading(false);
  }, []);

  const { refresh } = useNotificationPolling(canApprove, onUpdate);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await listNotifications('PENDING'));
    } catch {
      setError('Could not load notifications. Check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setMessage('');
    try {
      setSelected(await getNotification(id));
    } catch {
      setSelected(null);
      setError('Could not load notification details.');
    }
  };

  const onDecide = async (e: FormEvent, id: string, decision: 'ACCEPT' | 'REJECT') => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await decideNotification(id, decision);
      setMessage(res.message);
      await load();
      if (selectedId === id) {
        setSelected(await getNotification(id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decision failed');
    }
  };

  if (!canApprove) {
    return (
      <div className="card">
        <h1>Notifications</h1>
        <p className="muted">You do not have approval permissions for this account.</p>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="card notifications-header">
        <div>
          <h1>Approvals</h1>
          <p className="muted">
            Pending deal and inventory requests. Stay connected over the network to receive alerts.
          </p>
        </div>
        <button type="button" onClick={() => { refresh(); load(); }} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="card pwa-hint">
        <strong>Install on your phone</strong>
        <p className="muted">
          Use the native mobile app, or add this site to your home screen (Share → Add to Home Screen on
          iOS, or Install app in Chrome on Android) for an app-like shortcut with browser notifications.
        </p>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      {selected && (
        <div className="card notification-detail">
          <button type="button" className="link-button" onClick={() => { setSelected(null); setSelectedId(null); }}>
            ← Back to inbox
          </button>
          <h2>{selected.title}</h2>
          <p>{selected.body}</p>
          <p className="muted">Status: {selected.status}</p>
          {selected.status === 'PENDING' && (
            <div className="notification-actions">
              <button type="button" onClick={(e) => onDecide(e, selected.id, 'ACCEPT')}>Accept</button>
              <button type="button" className="danger" onClick={(e) => onDecide(e, selected.id, 'REJECT')}>Reject</button>
            </div>
          )}
        </div>
      )}

      {!selected && (
        <div className="notification-list">
          {loading && items.length === 0 && <p className="muted">Loading...</p>}
          {!loading && items.length === 0 && <p className="muted">No pending notifications.</p>}
          {items.map((item) => (
            <div key={item.id} className="card notification-card">
              <button type="button" className="notification-open" onClick={() => openDetail(item.id)}>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </button>
              <div className="notification-actions">
                <button type="button" onClick={(e) => onDecide(e, item.id, 'ACCEPT')}>Accept</button>
                <button type="button" className="danger" onClick={(e) => onDecide(e, item.id, 'REJECT')}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
