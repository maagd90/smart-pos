import '../tests/setup';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    transaction: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    customer: {
      update: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';
import { generateAccessToken } from '../src/services/auth';
import { Role, PaymentMethod } from '../src/types';

const prismaMock = new PrismaClient() as any;

function makeToken() {
  return generateAccessToken({ userId: 'cashier-1', email: 'cashier@example.com', role: Role.CASHIER, shopId: 'shop-1' });
}

describe('Transaction Routes', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('GET /api/shops/:shopId/transactions', () => {
    it('should list transactions', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([
        { id: 't-1', total: '50.00', paymentMethod: 'CASH', status: 'COMPLETED', items: [] },
      ]);
      prismaMock.transaction.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/shops/shop-1/transactions')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/shops/:shopId/transactions', () => {
    it('should create transaction', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        { id: 'p-1', price: '10.00', shopId: 'shop-1', isActive: true },
      ]);
      prismaMock.transaction.create.mockResolvedValue({
        id: 't-1',
        total: '10.00',
        paymentMethod: 'CASH',
        status: 'COMPLETED',
        items: [{ productId: 'p-1', quantity: 1, priceAtSale: '10.00' }],
      });

      const res = await request(app)
        .post('/api/shops/shop-1/transactions')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({
          items: [{ productId: 'p-1', quantity: 1 }],
          paymentMethod: PaymentMethod.CASH,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject empty items', async () => {
      const res = await request(app)
        .post('/api/shops/shop-1/transactions')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({ items: [], paymentMethod: 'CASH' });

      expect(res.status).toBe(400);
    });

    it('should reject invalid payment method', async () => {
      const res = await request(app)
        .post('/api/shops/shop-1/transactions')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({
          items: [{ productId: 'p-1', quantity: 1 }],
          paymentMethod: 'INVALID',
        });

      expect(res.status).toBe(400);
    });
  });
});
