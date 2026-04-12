import apiClient from './client';
import { Customer, Sale } from '../types';

export const getCustomers = () => apiClient.get<Customer[]>('/api/customers');
export const createCustomer = (data: Partial<Customer>) => apiClient.post<Customer>('/api/customers', data);
export const updateCustomer = (id: number, data: Partial<Customer>) => apiClient.put<Customer>(`/api/customers/${id}`, data);
export const deleteCustomer = (id: number) => apiClient.delete(`/api/customers/${id}`);
export const getCustomerPurchases = (id: number) => apiClient.get<Sale[]>(`/api/customers/${id}/purchases`);
