import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach access token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = storage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

// Automatically refresh tokens on 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = storage.getRefreshToken();

      if (!refreshToken) {
        isRefreshing = false;
        storage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
        storage.setAccessToken(data.accessToken);
        storage.setRefreshToken(data.refreshToken);

        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        storage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
