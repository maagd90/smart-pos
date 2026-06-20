import { apiGet, apiPost, ApiEnvelope, unwrap } from './client';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  kind: string;
  status: string;
  decision?: string;
  storeId: string;
}

export async function listNotifications(status = 'PENDING') {
  return unwrap(await apiGet<ApiEnvelope<NotificationItem[]>>(`/api/v1/notifications?status=${status}`));
}

export async function getNotification(id: string) {
  return unwrap(await apiGet<ApiEnvelope<NotificationItem>>(`/api/v1/notifications/${id}`));
}

export async function decideNotification(id: string, decision: 'ACCEPT' | 'REJECT') {
  return unwrap(
    await apiPost<ApiEnvelope<{ message: string; alreadyDecided: boolean }>>(
      `/api/v1/notifications/${id}/decide`,
      { decision, via: 'WEB' }
    )
  );
}
