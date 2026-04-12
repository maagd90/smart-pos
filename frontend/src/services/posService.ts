import api from './api';
import { ApiResponse, PaginatedResponse, Transaction, CreateTransactionData } from '../types';

export const posService = {
  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Transaction>> => {
    const res = await api.get<ApiResponse<PaginatedResponse<Transaction>>>('/pos/transactions', { params });
    return res.data.data!;
  },

  createTransaction: async (data: CreateTransactionData): Promise<Transaction> => {
    const res = await api.post<ApiResponse<Transaction>>('/pos/transactions', data);
    return res.data.data!;
  },

  getTransactionById: async (id: string): Promise<Transaction> => {
    const res = await api.get<ApiResponse<Transaction>>(`/pos/transactions/${id}`);
    return res.data.data!;
  },

  refundTransaction: async (id: string): Promise<Transaction> => {
    const res = await api.post<ApiResponse<Transaction>>(`/pos/transactions/${id}/refund`);
    return res.data.data!;
  },

  getReceipt: async (id: string): Promise<{ receipt: string; transaction: Transaction }> => {
    const res = await api.get<ApiResponse<{ receipt: string; transaction: Transaction }>>(`/pos/receipt/${id}`);
    return res.data.data!;
  },
};
