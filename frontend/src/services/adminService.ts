import api from './api';
import {
  ApiResponse,
  PaginatedResponse,
  DashboardStats,
  SalesReport,
  InventoryReport,
  User,
  CreateUserData,
  UpdateUserData,
  Customer,
} from '../types';

export const adminService = {
  getDashboard: async (): Promise<DashboardStats> => {
    const res = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard');
    return res.data.data!;
  },

  getAdminCustomers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    segment?: string;
  }): Promise<PaginatedResponse<Customer>> => {
    const res = await api.get<ApiResponse<PaginatedResponse<Customer>>>('/admin/customers', { params });
    return res.data.data!;
  },

  getUsers: async (): Promise<User[]> => {
    const res = await api.get<ApiResponse<User[]>>('/admin/users');
    return res.data.data ?? [];
  },

  createUser: async (data: CreateUserData): Promise<User> => {
    const res = await api.post<ApiResponse<User>>('/admin/users', data);
    return res.data.data!;
  },

  updateUser: async (id: string, data: UpdateUserData): Promise<User> => {
    const res = await api.put<ApiResponse<User>>(`/admin/users/${id}`, data);
    return res.data.data!;
  },

  getSalesReport: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<SalesReport> => {
    const res = await api.get<ApiResponse<SalesReport>>('/admin/reports/sales', { params });
    return res.data.data!;
  },

  getInventoryReport: async (): Promise<InventoryReport> => {
    const res = await api.get<ApiResponse<InventoryReport>>('/admin/reports/inventory');
    return res.data.data!;
  },
};
