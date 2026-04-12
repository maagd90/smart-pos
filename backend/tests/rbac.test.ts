import '../tests/setup';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    shop: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    shopUser: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    customer: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
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
const SHOP_ID = 'shop-test-123';

function makeToken(role: Role, shopId?: string, userId = 'user-1') {
  return generateAccessToken({ userId, email: 'user@example.com', role, shopId });
}

describe('RBAC & Permissions Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── POSITIVE SCENARIOS ─────────────────────────────────────────────────

  describe('POSITIVE: Platform Admin capabilities', () => {
    it('should allow Platform Admin to create a shop', async () => {
      prismaMock.shop.findUnique.mockResolvedValue(null);
      prismaMock.shop.create.mockResolvedValue({ id: 'new-shop', name: 'Test Shop', slug: 'test-shop' });
      prismaMock.shopUser.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/shops')
        .set('Authorization', `Bearer ${makeToken(Role.PLATFORM_ADMIN)}`)
        .send({ name: 'Test Shop', slug: 'test-shop' });

      expect(res.status).toBe(201);
    });

    it('should allow Platform Admin to list all shops', async () => {
      prismaMock.shop.findMany.mockResolvedValue([]);
      prismaMock.shop.count.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/shops')
        .set('Authorization', `Bearer ${makeToken(Role.PLATFORM_ADMIN)}`);

      expect(res.status).toBe(200);
    });

    it('should allow Platform Admin to update a shop', async () => {
      prismaMock.shop.update.mockResolvedValue({ id: SHOP_ID, name: 'Updated' });

      const res = await request(app)
        .patch(`/api/shops/${SHOP_ID}`)
        .set('Authorization', `Bearer ${makeToken(Role.PLATFORM_ADMIN)}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(200);
    });
  });

  describe('POSITIVE: Shop Admin capabilities', () => {
    it('should allow Shop Admin to update their own shop', async () => {
      prismaMock.shop.update.mockResolvedValue({ id: SHOP_ID, name: 'Updated' });

      const res = await request(app)
        .patch(`/api/shops/${SHOP_ID}`)
        .set('Authorization', `Bearer ${makeToken(Role.SHOP_ADMIN, SHOP_ID)}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(200);
    });
  });

  describe('POSITIVE: Manager capabilities', () => {
    it('should allow Manager to create products', async () => {
      prismaMock.product.create.mockResolvedValue({
        id: 'prod-1', shopId: SHOP_ID, name: 'Product', price: 10, stock: 5,
      });

      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/products`)
        .set('Authorization', `Bearer ${makeToken(Role.MANAGER, SHOP_ID)}`)
        .send({ name: 'Product', price: 10, stock: 5, category: 'General' });

      expect(res.status).toBe(201);
    });

    it('should allow Manager to update products', async () => {
      prismaMock.product.findUnique.mockResolvedValue({
        id: 'prod-1', shopId: SHOP_ID, name: 'Product', price: 10, stock: 5, isActive: true,
      });
      prismaMock.product.update.mockResolvedValue({ id: 'prod-1', price: 20 });

      const res = await request(app)
        .patch(`/api/shops/${SHOP_ID}/products/prod-1`)
        .set('Authorization', `Bearer ${makeToken(Role.MANAGER, SHOP_ID)}`)
        .send({ price: 20 });

      expect(res.status).toBe(200);
    });

    it('should allow Manager to view inventory', async () => {
      prismaMock.product.findMany.mockResolvedValue([]);
      prismaMock.product.count.mockResolvedValue(0);

      const res = await request(app)
        .get(`/api/shops/${SHOP_ID}/products`)
        .set('Authorization', `Bearer ${makeToken(Role.MANAGER, SHOP_ID)}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POSITIVE: Cashier capabilities', () => {
    it('should allow Cashier to list products', async () => {
      prismaMock.product.findMany.mockResolvedValue([]);
      prismaMock.product.count.mockResolvedValue(0);

      const res = await request(app)
        .get(`/api/shops/${SHOP_ID}/products`)
        .set('Authorization', `Bearer ${makeToken(Role.CASHIER, SHOP_ID)}`);

      expect(res.status).toBe(200);
    });

    it('should allow Cashier to create customers', async () => {
      prismaMock.customer.create.mockResolvedValue({
        id: 'cust-1', shopId: SHOP_ID, name: 'Customer', email: 'c@example.com',
      });

      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/customers`)
        .set('Authorization', `Bearer ${makeToken(Role.CASHIER, SHOP_ID)}`)
        .send({ name: 'Customer', email: 'c@example.com' });

      expect(res.status).toBe(201);
    });
  });

  describe('POSITIVE: Analyst capabilities', () => {
    it('should allow Analyst to view transactions', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([]);
      prismaMock.transaction.count.mockResolvedValue(0);

      const res = await request(app)
        .get(`/api/shops/${SHOP_ID}/transactions`)
        .set('Authorization', `Bearer ${makeToken(Role.ANALYST, SHOP_ID)}`);

      expect(res.status).toBe(200);
    });

    it('should allow Analyst to view customers', async () => {
      prismaMock.customer.findMany.mockResolvedValue([]);
      prismaMock.customer.count.mockResolvedValue(0);

      const res = await request(app)
        .get(`/api/shops/${SHOP_ID}/customers`)
        .set('Authorization', `Bearer ${makeToken(Role.ANALYST, SHOP_ID)}`);

      expect(res.status).toBe(200);
    });
  });

  // ─── NEGATIVE SCENARIOS ──────────────────────────────────────────────────

  describe('NEGATIVE: Unauthorized access attempts', () => {
    it('should reject Cashier creating a shop → 403', async () => {
      const res = await request(app)
        .post('/api/shops')
        .set('Authorization', `Bearer ${makeToken(Role.CASHIER, SHOP_ID)}`)
        .send({ name: 'New Shop', slug: 'new-shop' });

      expect(res.status).toBe(403);
    });

    it('should reject Analyst creating a shop → 403', async () => {
      const res = await request(app)
        .post('/api/shops')
        .set('Authorization', `Bearer ${makeToken(Role.ANALYST, SHOP_ID)}`)
        .send({ name: 'New Shop', slug: 'new-shop' });

      expect(res.status).toBe(403);
    });

    it('should reject Manager creating a shop → 403', async () => {
      const res = await request(app)
        .post('/api/shops')
        .set('Authorization', `Bearer ${makeToken(Role.MANAGER, SHOP_ID)}`)
        .send({ name: 'New Shop', slug: 'new-shop' });

      expect(res.status).toBe(403);
    });

    it('should reject Cashier creating a product → 403', async () => {
      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/products`)
        .set('Authorization', `Bearer ${makeToken(Role.CASHIER, SHOP_ID)}`)
        .send({ name: 'Product', price: 10 });

      expect(res.status).toBe(403);
    });

    it('should reject Analyst creating a product → 403', async () => {
      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/products`)
        .set('Authorization', `Bearer ${makeToken(Role.ANALYST, SHOP_ID)}`)
        .send({ name: 'Product', price: 10 });

      expect(res.status).toBe(403);
    });

    it('should reject Cashier updating a product → 403', async () => {
      const res = await request(app)
        .patch(`/api/shops/${SHOP_ID}/products/prod-1`)
        .set('Authorization', `Bearer ${makeToken(Role.CASHIER, SHOP_ID)}`)
        .send({ price: 99 });

      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated access to any endpoint', async () => {
      const endpoints = [
        { method: 'get', url: '/api/shops' },
        { method: 'post', url: '/api/shops' },
        { method: 'get', url: `/api/shops/${SHOP_ID}/products` },
        { method: 'post', url: `/api/shops/${SHOP_ID}/products` },
      ];

      for (const ep of endpoints) {
        const res = await (request(app) as any)[ep.method](ep.url);
        expect(res.status).toBe(401);
      }
    });
  });

  // ─── EDGE CASES ──────────────────────────────────────────────────────────

  describe('EDGE CASES: Role boundaries', () => {
    it('should respect role hierarchy - Manager cannot do Shop Admin actions on shop creation', async () => {
      const res = await request(app)
        .post('/api/shops')
        .set('Authorization', `Bearer ${makeToken(Role.MANAGER, SHOP_ID)}`)
        .send({ name: 'New Shop', slug: 'new-shop' });

      expect(res.status).toBe(403);
    });

    it('should allow Shop Admin to update shop (has higher role)', async () => {
      prismaMock.shop.update.mockResolvedValue({ id: SHOP_ID, name: 'Updated' });

      const res = await request(app)
        .patch(`/api/shops/${SHOP_ID}`)
        .set('Authorization', `Bearer ${makeToken(Role.SHOP_ADMIN, SHOP_ID)}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(200);
    });

    it('should return 401 for malformed Bearer token', async () => {
      const res = await request(app)
        .get('/api/shops')
        .set('Authorization', 'Bearer not.a.valid.jwt.token.here');

      expect(res.status).toBe(401);
    });

    it('should return 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/shops');
      expect(res.status).toBe(401);
    });

    it('should return 401 when Authorization header format is wrong', async () => {
      const res = await request(app)
        .get('/api/shops')
        .set('Authorization', 'Basic dXNlcjpwYXNz');

      expect(res.status).toBe(401);
    });

    it('should handle role check with no role in token', async () => {
      const tokenWithoutRole = generateAccessToken({ userId: 'user-1', email: 'user@example.com' });

      const res = await request(app)
        .post('/api/shops')
        .set('Authorization', `Bearer ${tokenWithoutRole}`)
        .send({ name: 'New Shop', slug: 'new-shop' });

      expect(res.status).toBe(403);
    });
  });
});
