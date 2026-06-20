export const API_BASE_URL = (globalThis as { expoPublicApiBaseUrl?: string }).expoPublicApiBaseUrl
  || 'http://localhost:8080';

export interface ApiErrorBody {
  code: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

let accessToken = '';
let refreshToken = '';

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
}

export function clearTokens() {
  accessToken = '';
  refreshToken = '';
}

export function getRefreshToken() {
  return refreshToken;
}

export async function restoreSession(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const payload = await parseResponse(response);
    if (!response.ok || !payload || typeof payload !== 'object' || !('data' in payload)) {
      return false;
    }
    const data = (payload as { data: { accessToken: string; refreshToken: string } }).data;
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}

function extractError(status: number, payload: unknown): ApiError {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const err = (payload as { error: ApiErrorBody }).error;
    return new ApiError(status, err.code, err.message);
  }
  return new ApiError(status, 'ERROR', `Request failed (${status})`);
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const payload = await parseResponse(response);
    if (!response.ok || !payload || typeof payload !== 'object' || !('data' in payload)) {
      return false;
    }
    const data = (payload as { data: { accessToken: string; refreshToken: string } }).data;
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (response.status === 401 && retry && refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(method, path, body, false);
    }
    clearTokens();
    throw new ApiError(401, 'UNAUTHORIZED', 'Session expired');
  }
  const payload = await parseResponse(response);
  if (!response.ok) {
    throw extractError(response.status, payload);
  }
  return payload as T;
}

export function apiGet<T>(path: string) {
  return request<T>('GET', path);
}

export function apiPost<T>(path: string, body?: unknown) {
  return request<T>('POST', path, body);
}

export function apiDelete<T>(path: string) {
  return request<T>('DELETE', path);
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
}

export function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success || envelope.data === undefined) {
    throw new ApiError(400, 'ERROR', 'Request failed');
  }
  return envelope.data;
}
