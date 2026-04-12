import api from './api';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  adminEmail: string;
  adminName: string;
  status: 'CREATING' | 'ACTIVE' | 'SUSPENDED' | 'FAILED';
  subscriptionPlan: 'FREE' | 'PRO' | 'ENTERPRISE';
  maxStaff: number;
  ipWhitelist: string[];
  ipRestrictEnabled: boolean;
  aiEnabled: boolean;
  whatsappEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  setup?: TenantSetup;
  apiKeys?: TenantApiKey[];
  _count?: { apiKeys: number };
}

export interface TenantSetup {
  id: string;
  tenantId: string;
  currentStep: string;
  steps: SetupStep[];
  errorMessage?: string;
  completedAt?: string;
}

export interface SetupStep {
  name: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  message: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface TenantApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  status: string;
  expiresAt?: string;
  lastUsedAt?: string;
}

export interface CreateTenantInput {
  name: string;
  domain?: string;
  adminEmail: string;
  adminName: string;
  subscriptionPlan?: 'FREE' | 'PRO' | 'ENTERPRISE';
  maxStaff?: number;
  ipWhitelist?: string[];
  ipRestrictEnabled?: boolean;
  aiEnabled?: boolean;
  whatsappEnabled?: boolean;
  smsEnabled?: boolean;
  emailEnabled?: boolean;
}

export const tenantService = {
  async list(params?: { page?: number; limit?: number; status?: string }) {
    const res = await api.get('/api/admin/tenants', { params });
    return res.data.data as { items: Tenant[]; total: number; page: number; limit: number; totalPages: number };
  },

  async get(id: string) {
    const res = await api.get(`/api/admin/tenants/${id}`);
    return res.data.data as Tenant;
  },

  async getStatus(id: string) {
    const res = await api.get(`/api/admin/tenants/${id}/status`);
    return res.data.data as { tenantStatus: string; name: string; setup: TenantSetup };
  },

  async create(input: CreateTenantInput) {
    const res = await api.post('/api/admin/tenants', input);
    return res.data.data as Tenant;
  },

  async update(id: string, input: Partial<CreateTenantInput> & { status?: string }) {
    const res = await api.put(`/api/admin/tenants/${id}`, input);
    return res.data.data as Tenant;
  },

  async delete(id: string) {
    const res = await api.delete(`/api/admin/tenants/${id}`);
    return res.data.data;
  },

  async retry(id: string) {
    const res = await api.post(`/api/admin/tenants/${id}/retry`);
    return res.data.data;
  },
};
