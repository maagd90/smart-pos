import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { fetchMe, login as apiLogin, MeResponse } from '../api/auth';
import { clearTokens, getRefreshToken, restoreSession, setTokens, setUnauthorizedHandler } from '../api/client';

interface AuthContextValue {
  user: MeResponse | null;
  permissions: Set<string>;
  accountId: string | null;
  isPlatformAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await fetchMe();
    setUser(me);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
    const init = async () => {
      if (!getRefreshToken()) {
        setLoading(false);
        return;
      }
      try {
        const restored = await restoreSession();
        if (!restored) {
          logout();
          return;
        }
        await refreshUser();
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [logout, refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setTokens(res.accessToken, res.refreshToken);
    await refreshUser();
  }, [refreshUser]);

  const permissions = useMemo(() => new Set(user?.permissions || []), [user]);

  const value = useMemo(
    () => ({
      user,
      permissions,
      accountId: user?.accountId || null,
      isPlatformAdmin: user?.platformAdmin || false,
      loading,
      login,
      logout,
      refreshUser,
    }),
    [user, permissions, loading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
