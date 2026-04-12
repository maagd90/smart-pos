import apiClient from './client';
import { Sale } from '../types';

export const getSales = () => apiClient.get<Sale[]>('/api/sales');
export const createSale = (data: Partial<Sale>) => apiClient.post<Sale>('/api/sales', data);
