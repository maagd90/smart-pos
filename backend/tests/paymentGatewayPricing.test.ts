import {
  getAllPricings,
  updateGatewayPricing,
  toggleGatewayAvailability,
  createNewGateway,
  getGatewayByName,
} from '../src/services/paymentGatewayPricingService';

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

const makePrisma = (overrides: Partial<any> = {}) => ({
  paymentGatewayPricing: {
    findMany: jest.fn().mockResolvedValue([mockPricing]),
    findUnique: jest.fn().mockResolvedValue(mockPricing),
    create: jest.fn().mockResolvedValue(mockPricing),
    update: jest.fn().mockResolvedValue(mockPricing),
  },
  ...overrides,
});

describe('paymentGatewayPricingService', () => {
  describe('getAllPricings', () => {
    it('returns all gateway pricings ordered by displayName', async () => {
      const prisma = makePrisma() as any;
      const result = await getAllPricings(prisma);
      expect(prisma.paymentGatewayPricing.findMany).toHaveBeenCalledWith({
        orderBy: { displayName: 'asc' },
      });
      expect(result).toEqual([mockPricing]);
    });

    it('returns empty array when no gateways configured', async () => {
      const prisma = makePrisma({
        paymentGatewayPricing: {
          ...makePrisma().paymentGatewayPricing,
          findMany: jest.fn().mockResolvedValue([]),
        },
      }) as any;
      const result = await getAllPricings(prisma);
      expect(result).toEqual([]);
    });
  });

  describe('updateGatewayPricing', () => {
    it('updates the setup fee for a gateway', async () => {
      const updatedPricing = { ...mockPricing, setupFee: 7500 };
      const prisma = makePrisma({
        paymentGatewayPricing: {
          ...makePrisma().paymentGatewayPricing,
          update: jest.fn().mockResolvedValue(updatedPricing),
        },
      }) as any;
      const result = await updateGatewayPricing(prisma, 'easypaisa', 7500);
      expect(prisma.paymentGatewayPricing.update).toHaveBeenCalledWith({
        where: { gatewayName: 'easypaisa' },
        data: { setupFee: 7500 },
      });
      expect(result.setupFee).toBe(7500);
    });

    it('throws if gateway not found', async () => {
      const prisma = makePrisma({
        paymentGatewayPricing: {
          ...makePrisma().paymentGatewayPricing,
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }) as any;
      await expect(updateGatewayPricing(prisma, 'unknown', 1000)).rejects.toThrow(
        'Gateway pricing for "unknown" not found'
      );
    });

    it('allows setting setup fee to zero', async () => {
      const prisma = makePrisma({
        paymentGatewayPricing: {
          ...makePrisma().paymentGatewayPricing,
          update: jest.fn().mockResolvedValue({ ...mockPricing, setupFee: 0 }),
        },
      }) as any;
      const result = await updateGatewayPricing(prisma, 'easypaisa', 0);
      expect(result.setupFee).toBe(0);
    });
  });

  describe('toggleGatewayAvailability', () => {
    it('disables a gateway', async () => {
      const prisma = makePrisma({
        paymentGatewayPricing: {
          ...makePrisma().paymentGatewayPricing,
          update: jest.fn().mockResolvedValue({ ...mockPricing, isAvailable: false }),
        },
      }) as any;
      const result = await toggleGatewayAvailability(prisma, 'easypaisa', false);
      expect(prisma.paymentGatewayPricing.update).toHaveBeenCalledWith({
        where: { gatewayName: 'easypaisa' },
        data: { isAvailable: false },
      });
      expect(result.isAvailable).toBe(false);
    });

    it('enables a gateway', async () => {
      const disabledPricing = { ...mockPricing, isAvailable: false };
      const prisma = makePrisma({
        paymentGatewayPricing: {
          ...makePrisma().paymentGatewayPricing,
          findUnique: jest.fn().mockResolvedValue(disabledPricing),
          update: jest.fn().mockResolvedValue({ ...disabledPricing, isAvailable: true }),
        },
      }) as any;
      const result = await toggleGatewayAvailability(prisma, 'easypaisa', true);
      expect(result.isAvailable).toBe(true);
    });

    it('throws if gateway not found', async () => {
      const prisma = makePrisma({
        paymentGatewayPricing: {
          ...makePrisma().paymentGatewayPricing,
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }) as any;
      await expect(toggleGatewayAvailability(prisma, 'unknown', false)).rejects.toThrow(
        'Gateway pricing for "unknown" not found'
      );
    });
  });

  describe('createNewGateway', () => {
    it('creates a new gateway pricing', async () => {
      const newPricing = {
        id: 'pricing-2',
        gatewayName: 'stripe',
        displayName: 'Stripe',
        setupFee: 10000,
        description: 'Stripe payment gateway',
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const prisma = makePrisma({
        paymentGatewayPricing: {
          ...makePrisma().paymentGatewayPricing,
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(newPricing),
        },
      }) as any;
      const result = await createNewGateway(prisma, 'stripe', 'Stripe', 10000, 'Stripe payment gateway');
      expect(prisma.paymentGatewayPricing.create).toHaveBeenCalledWith({
        data: {
          gatewayName: 'stripe',
          displayName: 'Stripe',
          setupFee: 10000,
          description: 'Stripe payment gateway',
        },
      });
      expect(result.gatewayName).toBe('stripe');
    });

    it('throws if gateway already exists', async () => {
      const prisma = makePrisma() as any;
      await expect(createNewGateway(prisma, 'easypaisa', 'Easypaisa', 5000)).rejects.toThrow(
        'Gateway "easypaisa" already exists'
      );
    });

    it('creates gateway without description', async () => {
      const prisma = makePrisma({
        paymentGatewayPricing: {
          ...makePrisma().paymentGatewayPricing,
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ ...mockPricing, gatewayName: 'jazzcash', description: undefined }),
        },
      }) as any;
      await createNewGateway(prisma, 'jazzcash', 'Jazz Cash', 3000);
      expect(prisma.paymentGatewayPricing.create).toHaveBeenCalledWith({
        data: {
          gatewayName: 'jazzcash',
          displayName: 'Jazz Cash',
          setupFee: 3000,
          description: undefined,
        },
      });
    });
  });

  describe('getGatewayByName', () => {
    it('returns gateway by name', async () => {
      const prisma = makePrisma() as any;
      const result = await getGatewayByName(prisma, 'easypaisa');
      expect(result).toEqual(mockPricing);
    });

    it('throws if gateway not found', async () => {
      const prisma = makePrisma({
        paymentGatewayPricing: {
          ...makePrisma().paymentGatewayPricing,
          findUnique: jest.fn().mockResolvedValue(null),
        },
      }) as any;
      await expect(getGatewayByName(prisma, 'unknown')).rejects.toThrow(
        'Gateway "unknown" not found'
      );
    });
  });
});
