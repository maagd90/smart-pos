import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { fetchMe, login as apiLogin, MeResponse } from '../api/auth';
import { clearTokens, getRefreshToken, setTokens } from '../api/client';
import { unregisterDevice } from '../features/notifications/api/notifications';

interface AuthContextValue {
  user: MeResponse | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const REFRESH_KEY = 'refreshToken';
const PUSH_TOKEN_KEY = 'expoPushToken';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    const pushToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (pushToken && getRefreshToken()) {
      try {
        await unregisterDevice(pushToken);
      } catch {
        // ignore
      }
    }
    if (pushToken) {
      await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
    }
    clearTokens();
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    const init = async () => {
      const storedRefresh = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!storedRefresh) {
        setLoading(false);
        return;
      }
      setTokens('', storedRefresh);
      try {
        const { restoreSession } = await import('../api/client');
        const restored = await restoreSession();
        if (!restored) {
          await logout();
          return;
        }
        setUser(await fetchMe());
      } catch {
        await logout();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setTokens(res.accessToken, res.refreshToken);
    await SecureStore.setItemAsync(REFRESH_KEY, res.refreshToken);
    setUser(await fetchMe());
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export async function savePushToken(token: string) {
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
}
