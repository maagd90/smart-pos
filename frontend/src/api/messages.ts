import apiClient from './client';
import { Message } from '../types';

export const getMessages = () => apiClient.get<Message[]>('/api/messages');
export const getCustomerMessages = (customerId: number) => apiClient.get<Message[]>(`/api/messages/${customerId}`);
export const sendMessage = (customerId: number, data: { type: string; content: string }) => apiClient.post(`/api/messages/send/${customerId}`, data);
