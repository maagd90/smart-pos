import api from './api';
import { storage } from '../utils/storage';
import type { AuthTokens, User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>('/api/auth/login', { email, password });
    storage.setAccessToken(data.accessToken);
    storage.setRefreshToken(data.refreshToken);
    storage.setUser(data.user);
    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = storage.getRefreshToken();
    try {
      await api.post('/api/auth/logout', { refreshToken });
    } finally {
      storage.clear();
    }
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<{ user: User }>('/api/auth/me');
    return data.user;
  },

  async register(payload: {
    name: string;
    email: string;
    password: string;
    role: string;
    shopId?: string;
  }): Promise<User> {
    const { data } = await api.post<{ user: User }>('/api/auth/register', payload);
    return data.user;
  },

  getStoredUser(): User | null {
    return storage.getUser<User>();
  },

  isAuthenticated(): boolean {
    return !!storage.getAccessToken();
  },
};
