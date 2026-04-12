import apiClient from './client';

export const analyzeDemand = () => apiClient.post('/api/ai/analyze-demand');
export const getCustomerInsights = (customerId: number) => apiClient.post(`/api/ai/customer-insights/${customerId}`);
export const getDealRecommendations = () => apiClient.post('/api/ai/deal-recommendations');
export const generateMessage = (customerId: number, type: string) => apiClient.post(`/api/ai/generate-message/${customerId}`, { type });
