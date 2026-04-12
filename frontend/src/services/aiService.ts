import api from './api';
import { ApiResponse, AIInsight } from '../types';

export const aiService = {
  getDemandForecast: async (params?: { productId?: string; category?: string; days?: number }): Promise<AIInsight> => {
    const res = await api.post<ApiResponse<AIInsight>>('/ai/demand-forecast', params);
    return res.data.data!;
  },

  getPriceSuggestion: async (data: {
    productId: string;
    targetMargin?: number;
    competitorPrices?: number[];
  }): Promise<AIInsight> => {
    const res = await api.post<ApiResponse<AIInsight>>('/ai/price-suggestion', data);
    return res.data.data!;
  },

  getCustomerInsights: async (customerId?: string): Promise<AIInsight> => {
    const res = await api.post<ApiResponse<AIInsight>>('/ai/customer-insights', { customerId });
    return res.data.data!;
  },

  getInventoryOptimization: async (): Promise<AIInsight> => {
    const res = await api.post<ApiResponse<AIInsight>>('/ai/inventory-optimization');
    return res.data.data!;
  },

  getSalesAnalysis: async (): Promise<AIInsight> => {
    const res = await api.post<ApiResponse<AIInsight>>('/ai/sales-analysis');
    return res.data.data!;
  },
};
