import api from './api';
import {
  ApiResponse,
  PaginatedResponse,
  Customer,
  CreateCustomerData,
  UpdateCustomerData,
  Transaction,
  Message,
} from '../types';

export const customerService = {
  getCustomers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    segment?: string;
  }): Promise<PaginatedResponse<Customer>> => {
    const res = await api.get<ApiResponse<PaginatedResponse<Customer>>>('/customers', { params });
    return res.data.data!;
  },

  getCustomerById: async (id: string): Promise<Customer> => {
    const res = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return res.data.data!;
  },

  createCustomer: async (data: CreateCustomerData): Promise<Customer> => {
    const res = await api.post<ApiResponse<Customer>>('/customers', data);
    return res.data.data!;
  },

  updateCustomer: async (id: string, data: UpdateCustomerData): Promise<Customer> => {
    const res = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return res.data.data!;
  },

  getCustomerTransactions: async (id: string): Promise<Transaction[]> => {
    const res = await api.get<ApiResponse<Transaction[]>>(`/customers/${id}/transactions`);
    return res.data.data ?? [];
  },

  getCustomerMessages: async (id: string): Promise<Message[]> => {
    const res = await api.get<ApiResponse<Message[]>>(`/customers/${id}/messages`);
    return res.data.data ?? [];
  },
};
