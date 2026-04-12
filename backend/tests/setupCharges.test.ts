import {
  getAvailableGateways,
  calculateRemainingSetupFees,
  enableGateway,
  markSetupFeePaid,
  getSetupChargeHistory,
  getAdminRevenue,
  listAllSetupCharges,
} from '../src/services/setupChargeService';

const mockTenant = {
  id: 'tenant-1',
  name: 'Acme Corp',
  slug: 'acme-corp',
  subscriptionPlan: 'FREE',
  maxGatewaysIncluded: 1,
  enabledGatewayCount: 0,
};

const mockPricing = {
  id: 'pricing-1',
  gatewayName: 'easypaisa',
  displayName: 'Easypaisa',
  setupFee: 5000,
  description: 'Easypaisa payment gateway',
  isAvailable: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCharge = {
  id: 'charge-1',
  tenantId: 'tenant-1',
  gatewayName: 'easypaisa',
  setupFee: 5000,
  status: 'PENDING',
  paidDate: null,
  requestedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makePrisma = (overrides: Partial<any> = {}) => ({
  tenant: {
    findUnique: jest.fn().mockResolvedValue(mockTenant),
    update: jest.fn().mockResolvedValue({ ...mockTenant, enabledGatewayCount: 1 }),
  },
  paymentGatewayPricing: {
    findMany: jest.fn().mockResolvedValue([mockPricing]),
    findUnique: jest.fn().mockResolvedValue(mockPricing),
  },
  gatewaySetupCharge: {
    findMany: jest.fn().mockResolvedValue([mockCharge]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(mockCharge),
    update: jest.fn().mockResolvedValue({ ...mockCharge, status: 'PAID', paidDate: new Date() }),
    upsert: jest.fn(),
  },
  adminRevenueSummary: {
    findUnique: jest.fn().mockResolvedValue(null),
    upsert: jest.fn().mockResolvedValue({
      id: 'rev-1',
      year: 2024,
      month: 1,
      periodString: '2024-01',
      subscriptionRevenue: 0,
      setupFeeRevenue: 5000,
      totalRevenue: 5000,
      setupFeeByGateway: { easypaisa: 5000 },
    }),
  },
  ...overrides,
});

describe('setupChargeService', () => {
  describe('getAvailableGateways', () => {
    it('returns all available gateways', async () => {
      const prisma = makePrisma() as any;
      const result = await getAvailableGateways(prisma);
      expect(prisma.paymentGatewayPricing.findMany).toHaveBeenCalledWith({
        where: { isAvailable: true },
        orderBy: { displayName: 'asc' },
      });
      expect(result).toEqual([mockPricing]);
    });

    it('returns empty array when no gateways available', async () => {
      const prisma = makePrisma({
        paymentGatewayPricing: {
          findMany: jest.fn().mockResolvedValue([]),
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }) as any;
      const result = await getAvailableGateways(prisma);
      expect(result).toEqual([]);
    });
  });

  describe('calculateRemainingSetupFees', () => {
    it('returns remaining gateways for tenant', async () => {
      const prisma = makePrisma({
        gatewaySetupCharge: {
          ...makePrisma().gatewaySetupCharge,
          findMany: jest.fn().mockResolvedValue([]),
        },
      }) as any;
      const result = await calculateRemainingSetupFees(prisma, 'tenant-1');
      expect(result.tenantId).toBe('tenant-1');
      expect(result.remainingGateways).toHaveLength(1);
      expect(result.remainingGateways[0].gatewayName).toBe('easypaisa');
    });

    it('excludes already paid gateways', async () => {
      const prisma = makePrisma({
        gatewaySetupCharge: {
          ...makePrisma().gatewaySetupCharge,
          findMany: jest.fn().mockResolvedValue([{ ...mockCharge, status: 'PAID' }]),
        },
      }) as any;
      const result = await calculateRemainingSetupFees(prisma, 'tenant-1');
      expect(result.remainingGateways).toHaveLength(0);
    });

    it('throws if tenant not found', async () => {
      const prisma = makePrisma({
        tenant: { ...makePrisma().tenant, findUnique: jest.fn().mockResolvedValue(null) },
      }) as any;
      await expect(calculateRemainingSetupFees(prisma, 'not-found')).rejects.toThrow(
        'Tenant not found'
      );
    });
  });

  describe('enableGateway', () => {
    it('creates a PENDING setup charge', async () => {
      const prisma = makePrisma() as any;
      const result = await enableGateway(prisma, 'tenant-1', 'easypaisa');
      expect(prisma.gatewaySetupCharge.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          gatewayName: 'easypaisa',
          setupFee: 5000,
          status: 'PENDING',
        },
      });
      expect(result.status).toBe('PENDING');
    });

    it('throws if tenant not found', async () => {
      const prisma = makePrisma({
        tenant: { ...makePrisma().tenant, findUnique: jest.fn().mockResolvedValue(null) },
      }) as any;
      await expect(enableGateway(prisma, 'not-found', 'easypaisa')).rejects.toThrow(
        'Tenant not found'
      );
    });

    it('throws if gateway not found', async () => {
      const prisma = makePrisma({
        paymentGatewayPricing: {
          ...makePrisma().paymentGatewayPricing,
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }) as any;
      await expect(enableGateway(prisma, 'tenant-1', 'unknown')).rejects.toThrow(
        'Gateway "unknown" not found'
      );
    });

    it('throws if gateway is not available', async () => {
      const prisma = makePrisma({
        paymentGatewayPricing: {
          ...makePrisma().paymentGatewayPricing,
          findUnique: jest.fn().mockResolvedValue({ ...mockPricing, isAvailable: false }),
        },
      }) as any;
      await expect(enableGateway(prisma, 'tenant-1', 'easypaisa')).rejects.toThrow(
        'Gateway "easypaisa" is not available'
      );
    });

    it('throws if gateway already enabled (PAID)', async () => {
      const prisma = makePrisma({
        gatewaySetupCharge: {
          ...makePrisma().gatewaySetupCharge,
          findUnique: jest.fn().mockResolvedValue({ ...mockCharge, status: 'PAID' }),
        },
      }) as any;
      await expect(enableGateway(prisma, 'tenant-1', 'easypaisa')).rejects.toThrow(
        'already enabled'
      );
    });

    it('throws if gateway already has PENDING charge', async () => {
      const prisma = makePrisma({
        gatewaySetupCharge: {
          ...makePrisma().gatewaySetupCharge,
          findUnique: jest.fn().mockResolvedValue({ ...mockCharge, status: 'PENDING' }),
        },
      }) as any;
      await expect(enableGateway(prisma, 'tenant-1', 'easypaisa')).rejects.toThrow(
        'pending setup charge already exists'
      );
    });
  });

  describe('markSetupFeePaid', () => {
    it('marks charge as PAID and updates tenant gateway count', async () => {
      const prisma = makePrisma({
        gatewaySetupCharge: {
          ...makePrisma().gatewaySetupCharge,
          findUnique: jest.fn().mockResolvedValue(mockCharge),
          update: jest.fn().mockResolvedValue({ ...mockCharge, status: 'PAID', paidDate: new Date() }),
        },
      }) as any;
      const result = await markSetupFeePaid(prisma, 'charge-1');
      expect(result.status).toBe('PAID');
      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { enabledGatewayCount: { increment: 1 } },
      });
    });

    it('throws if charge not found', async () => {
      const prisma = makePrisma({
        gatewaySetupCharge: {
          ...makePrisma().gatewaySetupCharge,
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }) as any;
      await expect(markSetupFeePaid(prisma, 'not-found')).rejects.toThrow(
        'Setup charge not found'
      );
    });

    it('throws if charge already paid', async () => {
      const prisma = makePrisma({
        gatewaySetupCharge: {
          ...makePrisma().gatewaySetupCharge,
          findUnique: jest.fn().mockResolvedValue({ ...mockCharge, status: 'PAID' }),
        },
      }) as any;
      await expect(markSetupFeePaid(prisma, 'charge-1')).rejects.toThrow('already paid');
    });
  });

  describe('getSetupChargeHistory', () => {
    it('returns all charges for a tenant', async () => {
      const prisma = makePrisma() as any;
      const result = await getSetupChargeHistory(prisma, 'tenant-1');
      expect(result).toEqual([mockCharge]);
      expect(prisma.gatewaySetupCharge.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('throws if tenant not found', async () => {
      const prisma = makePrisma({
        tenant: { ...makePrisma().tenant, findUnique: jest.fn().mockResolvedValue(null) },
      }) as any;
      await expect(getSetupChargeHistory(prisma, 'not-found')).rejects.toThrow('Tenant not found');
    });
  });

  describe('getAdminRevenue', () => {
    it('calculates and upserts revenue summary', async () => {
      const paidCharge = { ...mockCharge, status: 'PAID', paidDate: new Date(2024, 0, 15) };
      const prisma = makePrisma({
        gatewaySetupCharge: {
          ...makePrisma().gatewaySetupCharge,
          findMany: jest.fn().mockResolvedValue([paidCharge]),
        },
      }) as any;
      const result = await getAdminRevenue(prisma, 2024, 1);
      expect(prisma.adminRevenueSummary.upsert).toHaveBeenCalled();
      expect(result.periodString).toBe('2024-01');
    });

    it('uses existing subscription revenue when updating', async () => {
      const existingSummary = {
        id: 'rev-1',
        subscriptionRevenue: 10000,
        setupFeeRevenue: 0,
        totalRevenue: 10000,
        periodString: '2024-01',
      };
      const prisma = makePrisma({
        gatewaySetupCharge: {
          ...makePrisma().gatewaySetupCharge,
          findMany: jest.fn().mockResolvedValue([]),
        },
        adminRevenueSummary: {
          findUnique: jest.fn().mockResolvedValue(existingSummary),
          upsert: jest.fn().mockResolvedValue({ ...existingSummary, setupFeeRevenue: 0, totalRevenue: 10000 }),
        },
      }) as any;
      await getAdminRevenue(prisma, 2024, 1);
      const upsertCall = prisma.adminRevenueSummary.upsert.mock.calls[0][0];
      expect(upsertCall.create.subscriptionRevenue).toBe(10000);
    });
  });

  describe('listAllSetupCharges', () => {
    it('returns all charges without filters', async () => {
      const prisma = makePrisma() as any;
      await listAllSetupCharges(prisma);
      expect(prisma.gatewaySetupCharge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
    });

    it('filters by status', async () => {
      const prisma = makePrisma() as any;
      await listAllSetupCharges(prisma, 'PAID');
      expect(prisma.gatewaySetupCharge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'PAID' } })
      );
    });

    it('filters by tenantId', async () => {
      const prisma = makePrisma() as any;
      await listAllSetupCharges(prisma, undefined, 'tenant-1');
      expect(prisma.gatewaySetupCharge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 'tenant-1' } })
      );
    });

    it('filters by both status and tenantId', async () => {
      const prisma = makePrisma() as any;
      await listAllSetupCharges(prisma, 'PAID', 'tenant-1');
      expect(prisma.gatewaySetupCharge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'PAID', tenantId: 'tenant-1' } })
      );
    });
  });
});
