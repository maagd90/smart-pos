import { useState, useEffect, useCallback } from 'react';
import { authApi, User } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setState({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const response = await authApi.getMe();
      setState({ user: response.data, isAuthenticated: true, isLoading: false });
      connectSocket(token);
    } catch {
      localStorage.removeItem('token');
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const response = await authApi.login(email, password);
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    connectSocket(token);
    setState({ user, isAuthenticated: true, isLoading: false });
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    disconnectSocket();
    setState({ user: null, isAuthenticated: false, isLoading: false });
    window.location.href = '/login';
  }, []);

  return { ...state, login, logout };
};
