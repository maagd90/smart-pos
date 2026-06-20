import { apiGet, apiPost, ApiEnvelope, unwrap } from './client';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface MeResponse {
  userId: string;
  email: string;
}

export async function login(email: string, password: string) {
  return unwrap(await apiPost<ApiEnvelope<LoginResponse>>('/api/v1/auth/login', { email, password }));
}

export async function fetchMe() {
  return unwrap(await apiGet<ApiEnvelope<MeResponse>>('/api/v1/auth/me'));
}
