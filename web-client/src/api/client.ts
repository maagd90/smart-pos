export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_GATEWAY_URL ||
  ''
).replace(/\/$/, '');

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
    this.name = 'ApiError';
  }
}

let accessToken = '';
let refreshToken = sessionStorage.getItem('refreshToken') || '';
let onUnauthorized: (() => void) | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  if (refresh) {
    sessionStorage.setItem('refreshToken', refresh);
  } else {
    sessionStorage.removeItem('refreshToken');
  }
}

export function clearTokens() {
  accessToken = '';
  refreshToken = '';
  sessionStorage.removeItem('refreshToken');
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export async function restoreSession(): Promise<boolean> {
  if (!refreshToken) return false;
  return refreshAccessToken();
}

export function setToken(token: string) {
  accessToken = token;
}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function extractError(status: number, payload: unknown): ApiError {
  if (isRecord(payload) && isRecord(payload.error)) {
    const code = String(payload.error.code || 'ERROR');
    const message = String(payload.error.message || 'Request failed');
    return new ApiError(status, code, message);
  }
  return new ApiError(status, 'ERROR', `Request failed with status ${status}`);
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
    if (!response.ok || !isRecord(payload) || !isRecord(payload.data)) {
      return false;
    }
    const data = payload.data as Record<string, unknown>;
    setTokens(String(data.accessToken || ''), String(data.refreshToken || ''));
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
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const refreshed = await refreshPromise;
    if (refreshed) {
      return request<T>(method, path, body, false);
    }
    clearTokens();
    onUnauthorized?.();
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

export function apiPut<T>(path: string, body?: unknown) {
  return request<T>('PUT', path, body);
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorBody;
}

export function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success || envelope.data === undefined) {
    throw new ApiError(400, envelope.error?.code || 'ERROR', envelope.error?.message || 'Request failed');
  }
  return envelope.data;
}
