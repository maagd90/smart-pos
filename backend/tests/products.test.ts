import '../tests/setup';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    product: {
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
import { Role } from '../src/types';

const prismaMock = new PrismaClient() as any;

function makeToken(role: Role = Role.MANAGER) {
  return generateAccessToken({ userId: 'user-1', email: 'manager@example.com', role, shopId: 'shop-1' });
}

describe('Product Routes', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('GET /api/shops/:shopId/products', () => {
    it('should list products', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        { id: 'p-1', name: 'Widget', price: '9.99', stock: 10, isActive: true },
      ]);
      prismaMock.product.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/shops/shop-1/products')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/shops/:shopId/products', () => {
    it('should create product', async () => {
      prismaMock.product.create.mockResolvedValue({
        id: 'p-1', name: 'Widget', price: '9.99', stock: 0, shopId: 'shop-1',
      });

      const res = await request(app)
        .post('/api/shops/shop-1/products')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({ name: 'Widget', price: 9.99, stock: 10 });

      expect(res.status).toBe(201);
    });

    it('should reject invalid price', async () => {
      const res = await request(app)
        .post('/api/shops/shop-1/products')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({ name: 'Widget', price: -1 });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/shops/:shopId/products/:productId', () => {
    it('should deactivate product', async () => {
      prismaMock.product.update.mockResolvedValue({ id: 'p-1', isActive: false });

      const res = await request(app)
        .delete('/api/shops/shop-1/products/p-1')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
    });
  });
});
