import '../tests/setup';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    shopUser: {
      findUnique: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    customer: {
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
import bcrypt from 'bcrypt';
import { generateAccessToken } from '../src/services/auth';
import { Role } from '../src/types';

const prismaMock = new PrismaClient() as any;
const SHOP_ID = 'shop-test-123';

const validUserHash = bcrypt.hashSync('ValidPass123!', 12);

function mockActiveUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: validUserHash,
    name: 'Test User',
    isActive: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    ...overrides,
  };
}

describe('API Input Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── AUTH VALIDATION ─────────────────────────────────────────────────────

  describe('POST /api/auth/register - Validation', () => {
    it('POSITIVE: should accept valid email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'user-1', email: 'valid@example.com', name: 'User',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'valid@example.com', password: 'password123', name: 'User' });

      expect(res.status).toBe(201);
    });

    it('POSITIVE: should accept valid password (8+ chars)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'user-1', email: 'test@example.com', name: 'User',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'validpassword', name: 'User' });

      expect(res.status).toBe(201);
    });

    it('NEGATIVE: should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'password123', name: 'User' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('NEGATIVE: should reject email without domain', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'user@', password: 'password123', name: 'User' });

      expect(res.status).toBe(400);
    });

    it('NEGATIVE: should reject password too short (< 8 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'short', name: 'User' });

      expect(res.status).toBe(400);
    });

    it('NEGATIVE: should reject missing email field', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: 'password123', name: 'User' });

      expect(res.status).toBe(400);
    });

    it('NEGATIVE: should reject missing password field', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', name: 'User' });

      expect(res.status).toBe(400);
    });

    it('NEGATIVE: should reject blank name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123', name: '' });

      expect(res.status).toBe(400);
    });

    it('EDGE: should accept email with subdomain (valid@sub.example.com)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({ id: 'u1', email: 'valid@sub.example.com', name: 'User' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'valid@sub.example.com', password: 'password123', name: 'User' });

      expect(res.status).toBe(201);
    });

    it('EDGE: should handle very long password (1000 chars)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({ id: 'u1', email: 'long@example.com', name: 'User' });

      const longPassword = 'A'.repeat(1000);
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'long@example.com', password: longPassword, name: 'User' });

      // Should handle without crashing (accept or reject, but not 500)
      expect([201, 400]).toContain(res.status);
    });
  });

  describe('POST /api/auth/login - Validation', () => {
    it('POSITIVE: should accept valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockActiveUser());
      prismaMock.user.update.mockResolvedValue({});
      prismaMock.refreshToken.create.mockResolvedValue({ token: 'refresh' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com', password: 'ValidPass123!' });

      expect(res.status).toBe(200);
    });

    it('NEGATIVE: should reject blank email → 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: '', password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('NEGATIVE: should reject blank password → 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com', password: '' });

      expect(res.status).toBe(400);
    });

    it('NEGATIVE: should reject invalid email format → 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('NEGATIVE: should reject missing fields → 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });

    it('EDGE: SQL injection attempt in email field → sanitized (not 500)', async () => {
      const sqlInjection = "' OR 1=1; DROP TABLE users; --";
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: sqlInjection, password: 'password123' });

      // Should return 400 (invalid email format) not 500 (server error)
      expect(res.status).toBe(400);
      expect(res.status).not.toBe(500);
    });

    it('EDGE: XSS payload in email field → sanitized (not 500)', async () => {
      const xssPayload = '<script>alert("xss")</script>@evil.com';
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: xssPayload, password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.status).not.toBe(500);
    });

    it('EDGE: NoSQL injection attempt → rejected', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: { $gt: '' }, password: 'password123' });

      expect([400, 401]).toContain(res.status);
      expect(res.status).not.toBe(500);
    });
  });

  // ─── PRODUCT VALIDATION ───────────────────────────────────────────────────

  describe('POST /api/shops/:shopId/products - Validation', () => {
    const token = () => generateAccessToken({
      userId: 'user-1', email: 'mgr@example.com', role: Role.MANAGER, shopId: SHOP_ID,
    });

    it('POSITIVE: should accept valid product data', async () => {
      prismaMock.product.create.mockResolvedValue({
        id: 'prod-1', shopId: SHOP_ID, name: 'Widget', price: 9.99, stock: 10,
      });

      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/products`)
        .set('Authorization', `Bearer ${token()}`)
        .send({ name: 'Widget', price: 9.99, stock: 10, category: 'Electronics' });

      expect(res.status).toBe(201);
    });

    it('POSITIVE: should accept product with zero stock', async () => {
      prismaMock.product.create.mockResolvedValue({
        id: 'prod-2', shopId: SHOP_ID, name: 'No Stock', price: 5, stock: 0,
      });

      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/products`)
        .set('Authorization', `Bearer ${token()}`)
        .send({ name: 'No Stock', price: 5, stock: 0 });

      expect(res.status).toBe(201);
    });

    it('POSITIVE: should accept decimal price', async () => {
      prismaMock.product.create.mockResolvedValue({
        id: 'prod-3', shopId: SHOP_ID, name: 'Item', price: 99.99, stock: 1,
      });

      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/products`)
        .set('Authorization', `Bearer ${token()}`)
        .send({ name: 'Item', price: 99.99, stock: 1 });

      expect(res.status).toBe(201);
    });

    it('NEGATIVE: should reject missing product name → 400', async () => {
      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/products`)
        .set('Authorization', `Bearer ${token()}`)
        .send({ price: 10, stock: 5 });

      expect(res.status).toBe(400);
    });

    it('NEGATIVE: should reject negative price → 400', async () => {
      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/products`)
        .set('Authorization', `Bearer ${token()}`)
        .send({ name: 'Product', price: -10, stock: 5 });

      expect(res.status).toBe(400);
    });

    it('NEGATIVE: should reject negative stock → 400', async () => {
      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/products`)
        .set('Authorization', `Bearer ${token()}`)
        .send({ name: 'Product', price: 10, stock: -1 });

      expect(res.status).toBe(400);
    });

    it('NEGATIVE: should reject non-numeric price → 400', async () => {
      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/products`)
        .set('Authorization', `Bearer ${token()}`)
        .send({ name: 'Product', price: 'free', stock: 5 });

      expect(res.status).toBe(400);
    });

    it('EDGE: should handle very long product name', async () => {
      const longName = 'A'.repeat(10000);
      prismaMock.product.create.mockResolvedValue({
        id: 'prod-x', shopId: SHOP_ID, name: longName, price: 1, stock: 1,
      });

      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/products`)
        .set('Authorization', `Bearer ${token()}`)
        .send({ name: longName, price: 1, stock: 1 });

      expect([201, 400]).toContain(res.status);
    });

    it('EDGE: should sanitize XSS in product name', async () => {
      prismaMock.product.create.mockResolvedValue({
        id: 'prod-x', shopId: SHOP_ID, name: 'Safe Product', price: 1, stock: 1,
      });

      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/products`)
        .set('Authorization', `Bearer ${token()}`)
        .send({ name: '<script>alert(1)</script>', price: 1, stock: 1 });

      expect(res.status).not.toBe(500);
    });
  });

  // ─── CUSTOMER VALIDATION ──────────────────────────────────────────────────

  describe('POST /api/shops/:shopId/customers - Validation', () => {
    const token = () => generateAccessToken({
      userId: 'user-1', email: 'cashier@example.com', role: Role.CASHIER, shopId: SHOP_ID,
    });

    it('POSITIVE: should accept valid customer data', async () => {
      prismaMock.customer.create.mockResolvedValue({
        id: 'cust-1', shopId: SHOP_ID, name: 'Jane Doe', email: 'jane@example.com',
      });

      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/customers`)
        .set('Authorization', `Bearer ${token()}`)
        .send({ name: 'Jane Doe', email: 'jane@example.com' });

      expect(res.status).toBe(201);
    });

    it('NEGATIVE: should reject blank customer name → 400', async () => {
      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/customers`)
        .set('Authorization', `Bearer ${token()}`)
        .send({ name: '', email: 'jane@example.com' });

      expect(res.status).toBe(400);
    });

    it('NEGATIVE: should reject invalid email format → 400', async () => {
      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/customers`)
        .set('Authorization', `Bearer ${token()}`)
        .send({ name: 'Jane', email: 'not-an-email' });

      expect(res.status).toBe(400);
    });

    it('EDGE: should handle empty string vs null', async () => {
      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/customers`)
        .set('Authorization', `Bearer ${token()}`)
        .send({ name: '   ', email: 'jane@example.com' });

      expect(res.status).toBe(400);
    });

    it('EDGE: should handle special UTF-8 characters in name', async () => {
      prismaMock.customer.create.mockResolvedValue({
        id: 'cust-2', shopId: SHOP_ID, name: 'Müller García 张伟', email: 'special@example.com',
      });

      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/customers`)
        .set('Authorization', `Bearer ${token()}`)
        .send({ name: 'Müller García 张伟', email: 'special@example.com' });

      expect([201, 400]).toContain(res.status);
      expect(res.status).not.toBe(500);
    });

    it('EDGE: should handle emoji in customer name', async () => {
      prismaMock.customer.create.mockResolvedValue({
        id: 'cust-3', shopId: SHOP_ID, name: '😊 Customer', email: 'emoji@example.com',
      });

      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/customers`)
        .set('Authorization', `Bearer ${token()}`)
        .send({ name: '😊 Customer', email: 'emoji@example.com' });

      expect([201, 400]).toContain(res.status);
      expect(res.status).not.toBe(500);
    });
  });

  // ─── TRANSACTION VALIDATION ───────────────────────────────────────────────

  describe('POST /api/shops/:shopId/transactions - Validation', () => {
    const token = () => generateAccessToken({
      userId: 'user-1', email: 'cashier@example.com', role: Role.CASHIER, shopId: SHOP_ID,
    });

    it('NEGATIVE: should reject empty items array → 400', async () => {
      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/transactions`)
        .set('Authorization', `Bearer ${token()}`)
        .send({ items: [], paymentMethod: 'CASH' });

      expect(res.status).toBe(400);
    });

    it('NEGATIVE: should reject invalid payment method → 400', async () => {
      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/transactions`)
        .set('Authorization', `Bearer ${token()}`)
        .send({ items: [{ productId: 'p1', quantity: 1 }], paymentMethod: 'BITCOIN' });

      expect(res.status).toBe(400);
    });

    it('NEGATIVE: should reject zero quantity → 400', async () => {
      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/transactions`)
        .set('Authorization', `Bearer ${token()}`)
        .send({
          items: [{ productId: 'p1', quantity: 0 }],
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(400);
    });

    it('NEGATIVE: should reject negative quantity → 400', async () => {
      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/transactions`)
        .set('Authorization', `Bearer ${token()}`)
        .send({
          items: [{ productId: 'p1', quantity: -1 }],
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(400);
    });

    it('NEGATIVE: should reject negative discount', async () => {
      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/transactions`)
        .set('Authorization', `Bearer ${token()}`)
        .send({
          items: [{ productId: 'p1', quantity: 1 }],
          paymentMethod: 'CASH',
          discount: -10,
        });

      expect(res.status).toBe(400);
    });

    it('NEGATIVE: should reject negative tax', async () => {
      const res = await request(app)
        .post(`/api/shops/${SHOP_ID}/transactions`)
        .set('Authorization', `Bearer ${token()}`)
        .send({
          items: [{ productId: 'p1', quantity: 1 }],
          paymentMethod: 'CASH',
          tax: -5,
        });

      expect(res.status).toBe(400);
    });
  });

  // ─── SECURITY INJECTION TESTS ─────────────────────────────────────────────

  describe('SECURITY: Injection attack prevention', () => {
    it('should reject SQL injection in register email', async () => {
      const injections = [
        "admin'--",
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "admin'/*",
      ];

      for (const injection of injections) {
        const res = await request(app)
          .post('/api/auth/register')
          .send({ email: injection, password: 'password123', name: 'User' });

        expect(res.status).toBe(400);
        expect(res.status).not.toBe(500);
      }
    });

    it('should reject XSS payloads in login', async () => {
      const xssPayloads = [
        '<script>alert(1)</script>@evil.com',
        'javascript:alert(1)@evil.com',
        '"><img src=x onerror=alert(1)>@evil.com',
      ];

      for (const payload of xssPayloads) {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ email: payload, password: 'password123' });

        expect(res.status).toBe(400);
        expect(res.status).not.toBe(500);
      }
    });

    it('should handle null bytes in input', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test\x00@example.com', password: 'password123' });

      expect(res.status).not.toBe(500);
    });
  });
});
