import api from './api';
import { User } from '../types';

export interface LoginResponse {
  token: string;
  user: User;
}

export const loginRequest = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', { email, password });
  return response.data;
};

export const logoutRequest = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const refreshTokenRequest = async (): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/refresh');
  return response.data;
};
