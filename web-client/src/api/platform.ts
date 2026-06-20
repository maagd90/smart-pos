import { apiGet, apiPost, apiPut, ApiEnvelope, unwrap } from './client';

export interface Account {
  id: string;
  name: string;
  currency: string;
  locale: string;
  status: string;
}

export interface Plan {
  id: string;
  name: string;
  maxStores: number;
  maxUsers: number;
  aiEnabled: boolean;
}

export interface AiKeyStatus {
  last4: string | null;
  rotatedAt: string | null;
}

export async function listPlatformAccounts() {
  return unwrap(await apiGet<ApiEnvelope<Account[]>>('/api/v1/platform/accounts'));
}

export async function createPlatformAccount(data: {
  name: string;
  currency: string;
  locale: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerDisplayName?: string;
}) {
  return unwrap(await apiPost<ApiEnvelope<Account>>('/api/v1/platform/accounts', data));
}

export async function listPlans() {
  return unwrap(await apiGet<ApiEnvelope<Plan[]>>('/api/v1/platform/plans'));
}

export async function assignPlan(accountId: string, planId: string) {
  return unwrap(await apiPut<ApiEnvelope<Plan>>(`/api/v1/platform/accounts/${accountId}/plan`, { planId }));
}

export async function setAiEntitlement(accountId: string, aiEnabled: boolean) {
  return unwrap(
    await apiPut<ApiEnvelope<{ accountId: string; aiEnabled: boolean }>>(
      `/api/v1/platform/accounts/${accountId}/ai-entitlement`,
      { aiEnabled }
    )
  );
}

export async function getAiKeyStatus() {
  return unwrap(await apiGet<ApiEnvelope<AiKeyStatus>>('/api/v1/platform/ai-keys'));
}

export async function rotateAiKey(apiKey: string) {
  return unwrap(await apiPut<ApiEnvelope<AiKeyStatus>>('/api/v1/platform/ai-keys', { apiKey }));
}

export async function suspendAccount(accountId: string) {
  return unwrap(await apiPut<ApiEnvelope<Account>>(`/api/v1/platform/accounts/${accountId}/suspend`));
}

export async function reactivateAccount(accountId: string) {
  return unwrap(await apiPut<ApiEnvelope<Account>>(`/api/v1/platform/accounts/${accountId}/reactivate`));
}
