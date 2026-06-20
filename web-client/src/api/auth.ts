import { apiGet, apiPost, ApiEnvelope, unwrap } from './client';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  permissions: string[];
  accessibleStores: string[];
  accountWideAccess: boolean;
}

export interface MeResponse {
  userId: string;
  email: string;
  displayName: string;
  accountId: string;
  permissions: string[];
  accessibleStores: string[];
  accountWideAccess: boolean;
  platformAdmin: boolean;
}

export interface AccessibleStoresResponse {
  accountWideAccess: boolean;
  storeIds: string[];
}

export async function login(email: string, password: string) {
  const res = await apiPost<ApiEnvelope<LoginResponse>>('/api/v1/auth/login', { email, password });
  return unwrap(res);
}

export async function fetchMe() {
  const res = await apiGet<ApiEnvelope<MeResponse>>('/api/v1/auth/me');
  return unwrap(res);
}

export async function fetchAccessibleStores(accountId: string) {
  const res = await apiGet<ApiEnvelope<AccessibleStoresResponse>>(
    `/api/v1/accounts/${accountId}/accessible-stores`
  );
  return unwrap(res);
}
