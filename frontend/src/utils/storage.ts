/** Secure, in-memory token storage with sessionStorage fallback. */

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'pos_access_token',
  REFRESH_TOKEN: 'pos_refresh_token',
  USER: 'pos_user',
} as const;

export const storage = {
  getAccessToken(): string | null {
    return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  setAccessToken(token: string): void {
    sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setRefreshToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  getUser<T>(): T | null {
    const raw = sessionStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setUser<T>(user: T): void {
    sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
};
