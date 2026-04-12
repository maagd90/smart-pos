import api from './api';
import {
  ApiResponse,
  PaginatedResponse,
  Product,
  CreateProductData,
  UpdateStockData,
  LowStockAlert,
} from '../types';

export const inventoryService = {
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }): Promise<PaginatedResponse<Product>> => {
    const res = await api.get<ApiResponse<PaginatedResponse<Product>>>('/inventory/products', { params });
    return res.data.data!;
  },

  getProductById: async (id: string): Promise<Product> => {
    const res = await api.get<ApiResponse<Product>>(`/inventory/products/${id}`);
    return res.data.data!;
  },

  createProduct: async (data: CreateProductData): Promise<Product> => {
    const res = await api.post<ApiResponse<Product>>('/inventory/products', data);
    return res.data.data!;
  },

  updateProduct: async (id: string, data: Partial<CreateProductData> & { isActive?: boolean }): Promise<Product> => {
    const res = await api.put<ApiResponse<Product>>(`/inventory/products/${id}`, data);
    return res.data.data!;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/inventory/products/${id}`);
  },

  updateStock: async (productId: string, data: UpdateStockData): Promise<Product> => {
    const res = await api.put<ApiResponse<Product>>(`/inventory/stock/${productId}`, data);
    return res.data.data!;
  },

  getLowStockAlerts: async (): Promise<LowStockAlert[]> => {
    const res = await api.get<ApiResponse<LowStockAlert[]>>('/inventory/alerts');
    return res.data.data ?? [];
  },
};
