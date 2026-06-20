import { apiGet, apiPut, ApiEnvelope, unwrap } from './client';

export interface StoreSettings {
  storeId: string;
  openingTime: string;
  closingTime: string;
  timezone: string;
  monthlyRent: number;
  defaultMarkupPct: number;
}

export interface RefundPolicy {
  storeId: string;
  defaultRefundable: boolean;
  defaultRefundWindowDays: number;
  defaultExchangeable: boolean;
  defaultExchangeWindowDays: number;
  restockingFeePct: number;
  restockingFeeFlat: number;
  refundProrationTiers: { withinDays: number; refundPct: number }[];
}

export interface ReportSettings {
  storeId: string;
  channel: string;
  recipients: string[];
  sendTime: string;
  timezone: string;
}

export async function getStoreSettings(storeId: string) {
  return unwrap(await apiGet<ApiEnvelope<StoreSettings>>(`/api/v1/stores/${storeId}/settings`));
}

export async function updateStoreSettings(storeId: string, data: Partial<StoreSettings>) {
  return unwrap(await apiPut<ApiEnvelope<StoreSettings>>(`/api/v1/stores/${storeId}/settings`, data));
}

export async function getRefundPolicy(storeId: string) {
  return unwrap(await apiGet<ApiEnvelope<RefundPolicy>>(`/api/v1/stores/${storeId}/refund-policy`));
}

export async function updateRefundPolicy(storeId: string, data: Partial<RefundPolicy>) {
  return unwrap(await apiPut<ApiEnvelope<RefundPolicy>>(`/api/v1/stores/${storeId}/refund-policy`, data));
}

export async function getReportSettings(storeId: string) {
  return unwrap(await apiGet<ApiEnvelope<ReportSettings>>(`/api/v1/stores/${storeId}/report-settings`));
}

export async function updateReportSettings(storeId: string, data: Partial<ReportSettings>) {
  return unwrap(
    await apiPut<ApiEnvelope<ReportSettings>>(`/api/v1/stores/${storeId}/report-settings`, data)
  );
}
