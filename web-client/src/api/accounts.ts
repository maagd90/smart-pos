import { apiGet, apiPost, ApiEnvelope, unwrap } from './client';

export interface Store {
  id: string;
  accountId: string;
  name: string;
  timezone: string;
  status: string;
  currency?: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  accountId: string;
  status: string;
}

export interface Role {
  id: string;
  name: string;
  system: boolean;
}

export async function listStores(accountId: string) {
  return unwrap(await apiGet<ApiEnvelope<Store[]>>(`/api/v1/accounts/${accountId}/stores`));
}

export async function createStore(accountId: string, name: string, timezone: string) {
  return unwrap(
    await apiPost<ApiEnvelope<Store>>(`/api/v1/accounts/${accountId}/stores`, { name, timezone })
  );
}

export async function listUsers(accountId: string) {
  return unwrap(await apiGet<ApiEnvelope<User[]>>(`/api/v1/accounts/${accountId}/users`));
}

export async function createUser(
  accountId: string,
  data: { email: string; password: string; displayName?: string }
) {
  return unwrap(await apiPost<ApiEnvelope<User>>(`/api/v1/accounts/${accountId}/users`, data));
}

export async function listRoles(accountId: string) {
  return unwrap(await apiGet<ApiEnvelope<Role[]>>(`/api/v1/accounts/${accountId}/roles`));
}

export async function assignRole(
  accountId: string,
  userId: string,
  roleId: string,
  storeId: string | null
) {
  return unwrap(
    await apiPost<ApiEnvelope<{ userId: string; roleId: string; storeId: string | null }>>(
      `/api/v1/accounts/${accountId}/users/${userId}/roles`,
      { roleId, storeId }
    )
  );
}
