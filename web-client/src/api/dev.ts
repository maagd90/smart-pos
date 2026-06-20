import { API_BASE_URL, getAccessToken, setToken } from './client';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseJson(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const base = API_BASE_URL || '';
  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = parseJson(await response.text());
  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.message === 'string'
        ? payload.message
        : `${method} ${path} failed with status ${response.status}`;
    throw new Error(message);
  }
  return payload as T;
}

export const devApi = {
  devLogin: (email: string) => request('POST', '/api/v1/auth/dev-login', { email }),
  createAccount: (name: string, currency: string, locale: string) =>
    request('POST', '/api/v1/accounts', { name, currency, locale }),
  createStore: (accountId: string, name: string, timezone: string) =>
    request('POST', `/api/v1/accounts/${accountId}/stores`, { name, timezone }),
  createProduct: (storeId: string, data: Record<string, unknown>) =>
    request('POST', `/api/v1/stores/${storeId}/products`, data),
  receiveStock: (storeId: string, productId: string, quantity: number) =>
    request('POST', `/api/v1/stores/${storeId}/inventory/receive`, { productId, quantity }),
  getStock: (storeId: string, productId: string) =>
    request('GET', `/api/v1/stores/${storeId}/inventory/stock/${productId}`),
  createSale: (storeId: string, items: unknown[], currency: string) =>
    request('POST', `/api/v1/stores/${storeId}/sales`, { items, currency }),
  createRefund: (storeId: string, saleId: string, items: unknown[], currency: string) =>
    request('POST', `/api/v1/stores/${storeId}/refunds`, { saleId, items, currency }),
  getDailyReport: (storeId: string) => request('GET', `/api/v1/stores/${storeId}/reports/daily`),
  checkHealth: () => request('GET', '/actuator/health'),
};

export { setToken };
