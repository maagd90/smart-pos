import api from './api';

export interface PaymentGatewayPricing {
  id: string;
  gatewayName: string;
  displayName: string;
  setupFee: number;
  description?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GatewaySetupCharge {
  id: string;
  tenantId: string;
  gatewayName: string;
  setupFee: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paidDate?: string;
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
  tenant?: { name: string; slug: string };
}

export interface AdminRevenueSummary {
  id: string;
  year: number;
  month: number;
  periodString: string;
  subscriptionRevenue: number;
  setupFeeRevenue: number;
  totalRevenue: number;
  setupFeeByGateway?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface RemainingSetupFees {
  tenantId: string;
  subscriptionPlan: string;
  maxGatewaysIncluded: number;
  enabledGatewayCount: number;
  remainingGateways: {
    gatewayName: string;
    displayName: string;
    setupFee: number;
    description?: string;
  }[];
}

export const setupChargeApi = {
  // Admin: Payment Gateway Pricing
  async listGatewayPricings(): Promise<PaymentGatewayPricing[]> {
    const res = await api.get('/api/admin/payment-gateways');
    return res.data.data;
  },

  async createGatewayPricing(input: {
    gatewayName: string;
    displayName: string;
    setupFee: number;
    description?: string;
  }): Promise<PaymentGatewayPricing> {
    const res = await api.post('/api/admin/payment-gateways', input);
    return res.data.data;
  },

  async updateGatewayPricing(
    gatewayName: string,
    update: { setupFee?: number; isAvailable?: boolean }
  ): Promise<PaymentGatewayPricing> {
    const res = await api.put(`/api/admin/payment-gateways/${gatewayName}`, update);
    return res.data.data;
  },

  // Admin: Revenue
  async getAdminRevenueSummary(year: number, month: number): Promise<AdminRevenueSummary> {
    const res = await api.get('/api/admin/payment-gateways/revenue/summary', {
      params: { year, month },
    });
    return res.data.data;
  },

  async getRevenueByGateway(): Promise<Record<string, number>> {
    const res = await api.get('/api/admin/payment-gateways/revenue/by-gateway');
    return res.data.data;
  },

  // Admin: Setup Charges
  async listSetupCharges(params?: {
    status?: string;
    tenantId?: string;
  }): Promise<GatewaySetupCharge[]> {
    const res = await api.get('/api/admin/payment-gateways/setup-charges', { params });
    return res.data.data;
  },

  async getTenantSetupCharges(tenantId: string): Promise<GatewaySetupCharge[]> {
    const res = await api.get(`/api/admin/payment-gateways/tenants/${tenantId}/setup-charges`);
    return res.data.data;
  },

  async markChargePaid(chargeId: string): Promise<GatewaySetupCharge> {
    const res = await api.post(`/api/tenant/setup-charges/${chargeId}/pay`);
    return res.data.data;
  },

  // Tenant
  async getAvailableGateways(): Promise<PaymentGatewayPricing[]> {
    const res = await api.get('/api/tenant/gateways/available');
    return res.data.data;
  },

  async getTenantSetupChargeHistory(tenantId: string): Promise<GatewaySetupCharge[]> {
    const res = await api.get('/api/tenant/setup-charges', { params: { tenantId } });
    return res.data.data;
  },

  async enableGateway(
    tenantId: string,
    gatewayName: string
  ): Promise<GatewaySetupCharge> {
    const res = await api.post(
      `/api/tenant/gateways/${gatewayName}/enable`,
      {},
      { params: { tenantId } }
    );
    return res.data.data;
  },

  async getTenantRevenueSummary(tenantId: string): Promise<RemainingSetupFees> {
    const res = await api.get('/api/tenant/revenue/summary', { params: { tenantId } });
    return res.data.data;
  },
};
