import '../tests/setup';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    customer: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
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
import { encrypt } from '../src/services/encryption';
import { Role } from '../src/types';

const prismaMock = new PrismaClient() as any;

function makeToken() {
  return generateAccessToken({ userId: 'user-1', email: 'cashier@example.com', role: Role.CASHIER, shopId: 'shop-1' });
}

describe('Customer Routes', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('GET /api/shops/:shopId/customers', () => {
    it('should list customers with decrypted phone', async () => {
      const phone = '+1234567890';
      const phoneEncrypted = encrypt(phone);

      prismaMock.customer.findMany.mockResolvedValue([
        { id: 'c-1', name: 'Alice', phoneEncrypted, email: null, loyaltyPoints: 0, optedIn: true },
      ]);
      prismaMock.customer.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/shops/shop-1/customers')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customers[0].phone).toBe(phone);
    });
  });

  describe('POST /api/shops/:shopId/customers', () => {
    it('should create customer', async () => {
      prismaMock.customer.create.mockResolvedValue({
        id: 'c-1',
        shopId: 'shop-1',
        name: 'Bob',
        phoneEncrypted: null,
        email: null,
        loyaltyPoints: 0,
        optedIn: true,
      });

      const res = await request(app)
        .post('/api/shops/shop-1/customers')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({ name: 'Bob' });

      expect(res.status).toBe(201);
    });
  });
});
