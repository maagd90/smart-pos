import apiClient from './client';
import { Product } from '../types';

export const getProducts = () => apiClient.get<Product[]>('/api/products');
export const createProduct = (data: Partial<Product>) => apiClient.post<Product>('/api/products', data);
export const updateProduct = (id: number, data: Partial<Product>) => apiClient.put<Product>(`/api/products/${id}`, data);
export const deleteProduct = (id: number) => apiClient.delete(`/api/products/${id}`);
