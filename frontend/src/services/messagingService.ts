import api from './api';
import { ApiResponse, Message, Campaign, CreateCampaignData, SendMessageData } from '../types';

export const messagingService = {
  sendMessage: async (data: SendMessageData): Promise<Message> => {
    const res = await api.post<ApiResponse<Message>>('/messaging/send', data);
    return res.data.data!;
  },

  getCampaigns: async (): Promise<Campaign[]> => {
    const res = await api.get<ApiResponse<Campaign[]>>('/messaging/campaigns');
    return res.data.data ?? [];
  },

  createCampaign: async (data: CreateCampaignData): Promise<Campaign> => {
    const res = await api.post<ApiResponse<Campaign>>('/messaging/campaigns', data);
    return res.data.data!;
  },

  getMessageHistory: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<Message[]> => {
    const res = await api.get<ApiResponse<Message[]>>('/messaging/history', { params });
    return res.data.data ?? [];
  },
};
