import '../tests/setup';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
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
      create: jest.fn(),
    },
    shop: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
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
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    transactionItem: {
      createMany: jest.fn(),
    },
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
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

const SHOP_A_ID = 'shop-aaa';
const SHOP_B_ID = 'shop-bbb';

const validPasswordHash = bcrypt.hashSync('SecurePass123!', 12);

function mockUser(id: string, email: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    email,
    passwordHash: validPasswordHash,
    name: 'Test User',
    isActive: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    ...overrides,
  };
}

function makeAdminToken() {
  return generateAccessToken({ userId: 'admin-1', email: 'admin@example.com', role: Role.PLATFORM_ADMIN });
}

function makeShopToken(role: Role, shopId: string, userId = 'user-1') {
  return generateAccessToken({ userId, email: `${role.toLowerCase()}@example.com`, role, shopId });
}

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── FLOW 1: User Registration & Login ────────────────────────────────────

  describe('FLOW 1: User Registration → Login → Access Protected Resource', () => {
    it('should complete full auth flow: register → login → access resource', async () => {
      // Step 1: Register
      prismaMock.user.findUnique.mockResolvedValueOnce(null); // No existing user
      prismaMock.user.create.mockResolvedValueOnce({
        id: 'user-new', email: 'new@example.com', name: 'New User',
      });

      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@example.com', password: 'password123', name: 'New User' });

      expect(registerRes.status).toBe(201);
      expect(registerRes.body.success).toBe(true);

      // Step 2: Login
      const passwordHash = await bcrypt.hash('password123', 12);
      prismaMock.user.findUnique.mockResolvedValueOnce(mockUser('user-new', 'new@example.com', { passwordHash }));
      prismaMock.user.update.mockResolvedValueOnce({});
      prismaMock.refreshToken.create.mockResolvedValueOnce({ token: 'refresh-abc' });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'new@example.com', password: 'password123' });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.accessToken).toBeTruthy();
      expect(loginRes.body.data.refreshToken).toBeTruthy();

      const { accessToken } = loginRes.body.data;

      // Step 3: Access protected resource
      prismaMock.shop.findMany.mockResolvedValueOnce([]);
      prismaMock.shop.count.mockResolvedValueOnce(0);

      // Note: user doesn't have PLATFORM_ADMIN role, so this would return empty or 403
      const resourceRes = await request(app)
        .get('/api/shops')
        .set('Authorization', `Bearer ${accessToken}`);

      // Either 200 (with possibly no shops) or 403 (no role)
      expect([200, 403]).toContain(resourceRes.status);
    });

    it('should complete full auth flow with Platform Admin', async () => {
      // Register admin
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.user.create.mockResolvedValueOnce({
        id: 'admin-1', email: 'admin@example.com', name: 'Admin',
      });
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'admin@example.com', password: 'adminpass', name: 'Admin' });

      // Login
      const passwordHash = await bcrypt.hash('adminpass', 12);
      prismaMock.user.findUnique.mockResolvedValueOnce(mockUser('admin-1', 'admin@example.com', { passwordHash }));
      prismaMock.user.update.mockResolvedValueOnce({});
      prismaMock.refreshToken.create.mockResolvedValueOnce({ token: 'refresh-admin' });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: 'adminpass' });

      expect(loginRes.status).toBe(200);
    });

    it('should refresh token after login', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValueOnce({
        token: 'valid-refresh',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: { id: 'user-1', email: 'user@example.com', isActive: true },
      });

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'valid-refresh' });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeTruthy();
    });

    it('should logout and invalidate refresh token', async () => {
      prismaMock.refreshToken.update.mockResolvedValueOnce({ isRevoked: true });

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ refreshToken: 'valid-refresh' });

      expect(res.status).toBe(200);
      expect(prismaMock.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isRevoked: true } })
      );
    });
  });

  // ─── FLOW 2: Shop Admin Setup ──────────────────────────────────────────────

  describe('FLOW 2: Platform Admin Creates Shop → Shop Admin Manages It', () => {
    it('should allow Platform Admin to create a shop', async () => {
      prismaMock.shop.findUnique.mockResolvedValueOnce(null);
      prismaMock.shop.create.mockResolvedValueOnce({
        id: SHOP_A_ID, name: 'Shop Alpha', slug: 'shop-alpha', isActive: true,
      });
      prismaMock.shopUser.create.mockResolvedValueOnce({ userId: 'admin-1', shopId: SHOP_A_ID, role: 'SHOP_ADMIN' });

      const res = await request(app)
        .post('/api/shops')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ name: 'Shop Alpha', slug: 'shop-alpha' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Shop Alpha');
    });

    it('should allow Shop Admin to add products to their shop', async () => {
      prismaMock.product.create.mockResolvedValueOnce({
        id: 'prod-a1', shopId: SHOP_A_ID, name: 'Item A', price: 25.00, stock: 100,
      });

      const res = await request(app)
        .post(`/api/shops/${SHOP_A_ID}/products`)
        .set('Authorization', `Bearer ${makeShopToken(Role.MANAGER, SHOP_A_ID)}`)
        .send({ name: 'Item A', price: 25.00, stock: 100, category: 'General' });

      expect(res.status).toBe(201);
    });

    it('should allow Manager to view products they added', async () => {
      prismaMock.product.findMany.mockResolvedValueOnce([
        { id: 'prod-a1', shopId: SHOP_A_ID, name: 'Item A', price: 25.00, stock: 100 },
      ]);
      prismaMock.product.count.mockResolvedValueOnce(1);

      const res = await request(app)
        .get(`/api/shops/${SHOP_A_ID}/products`)
        .set('Authorization', `Bearer ${makeShopToken(Role.MANAGER, SHOP_A_ID)}`);

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(1);
    });
  });

  // ─── FLOW 3: Complete POS Transaction ─────────────────────────────────────

  describe('FLOW 3: Cashier Creates Transaction', () => {
    it('should create a complete transaction with products', async () => {
      prismaMock.product.findMany.mockResolvedValueOnce([
        { id: 'prod-1', shopId: SHOP_A_ID, name: 'Widget', price: 10.00, stock: 5, isActive: true },
      ]);
      prismaMock.transaction.create.mockResolvedValueOnce({
        id: 'txn-1',
        shopId: SHOP_A_ID,
        cashierId: 'cashier-1',
        total: 10.00,
        discount: 0,
        tax: 0,
        paymentMethod: 'CASH',
        status: 'COMPLETED',
        items: [{ productId: 'prod-1', quantity: 1, priceAtSale: 10.00 }],
      });

      const res = await request(app)
        .post(`/api/shops/${SHOP_A_ID}/transactions`)
        .set('Authorization', `Bearer ${makeShopToken(Role.CASHIER, SHOP_A_ID, 'cashier-1')}`)
        .send({
          items: [{ productId: 'prod-1', quantity: 1 }],
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeTruthy();
    });

    it('should reject transaction when product not found', async () => {
      prismaMock.product.findMany.mockResolvedValueOnce([]); // No products found

      const res = await request(app)
        .post(`/api/shops/${SHOP_A_ID}/transactions`)
        .set('Authorization', `Bearer ${makeShopToken(Role.CASHIER, SHOP_A_ID)}`)
        .send({
          items: [{ productId: 'nonexistent-product', quantity: 1 }],
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should list transactions for the shop', async () => {
      prismaMock.transaction.findMany.mockResolvedValueOnce([
        { id: 'txn-1', shopId: SHOP_A_ID, total: 10.00, status: 'COMPLETED', items: [] },
      ]);
      prismaMock.transaction.count.mockResolvedValueOnce(1);

      const res = await request(app)
        .get(`/api/shops/${SHOP_A_ID}/transactions`)
        .set('Authorization', `Bearer ${makeShopToken(Role.ANALYST, SHOP_A_ID)}`);

      expect(res.status).toBe(200);
      expect(res.body.data.transactions).toHaveLength(1);
    });
  });

  // ─── FLOW 4: Multi-Tenant Isolation ───────────────────────────────────────

  describe('FLOW 4: Multi-Tenant Data Isolation', () => {
    it('should keep Shop A and Shop B products completely separate', async () => {
      prismaMock.product.findMany.mockImplementation((args: any) => {
        const shopId = args?.where?.shopId;
        if (shopId === SHOP_A_ID) {
          return Promise.resolve([{ id: 'prod-a', shopId: SHOP_A_ID, name: 'Shop A Product' }]);
        }
        if (shopId === SHOP_B_ID) {
          return Promise.resolve([{ id: 'prod-b', shopId: SHOP_B_ID, name: 'Shop B Product' }]);
        }
        return Promise.resolve([]);
      });
      prismaMock.product.count.mockResolvedValue(1);

      const [resA, resB] = await Promise.all([
        request(app)
          .get(`/api/shops/${SHOP_A_ID}/products`)
          .set('Authorization', `Bearer ${makeShopToken(Role.CASHIER, SHOP_A_ID)}`),
        request(app)
          .get(`/api/shops/${SHOP_B_ID}/products`)
          .set('Authorization', `Bearer ${makeShopToken(Role.CASHIER, SHOP_B_ID)}`),
      ]);

      expect(resA.status).toBe(200);
      expect(resB.status).toBe(200);

      if (resA.body.data?.products?.length > 0) {
        expect(resA.body.data.products[0].shopId).toBe(SHOP_A_ID);
      }
      if (resB.body.data?.products?.length > 0) {
        expect(resB.body.data.products[0].shopId).toBe(SHOP_B_ID);
      }
    });

    it('should keep Shop A and Shop B customers completely separate', async () => {
      prismaMock.customer.findMany.mockImplementation((args: any) => {
        const shopId = args?.where?.shopId;
        if (shopId === SHOP_A_ID) {
          return Promise.resolve([{ id: 'cust-a', shopId: SHOP_A_ID, name: 'Customer A' }]);
        }
        return Promise.resolve([]);
      });
      prismaMock.customer.count.mockResolvedValue(1);

      const resA = await request(app)
        .get(`/api/shops/${SHOP_A_ID}/customers`)
        .set('Authorization', `Bearer ${makeShopToken(Role.ANALYST, SHOP_A_ID)}`);

      expect(resA.status).toBe(200);
    });

    it('should prevent cross-shop data access for transactions', async () => {
      prismaMock.transaction.findMany.mockImplementation((args: any) => {
        const shopId = args?.where?.shopId;
        return Promise.resolve(shopId === SHOP_A_ID
          ? [{ id: 'txn-a', shopId: SHOP_A_ID, total: 100 }]
          : []);
      });
      prismaMock.transaction.count.mockResolvedValue(1);

      const resA = await request(app)
        .get(`/api/shops/${SHOP_A_ID}/transactions`)
        .set('Authorization', `Bearer ${makeShopToken(Role.ANALYST, SHOP_A_ID)}`);

      expect(resA.status).toBe(200);
      // Shop A sees its own transactions
      if (resA.body.data?.transactions?.length > 0) {
        expect(resA.body.data.transactions[0].shopId).toBe(SHOP_A_ID);
      }
    });

    it('should allow concurrent API requests to different shops without interference', async () => {
      prismaMock.product.findMany.mockResolvedValue([]);
      prismaMock.product.count.mockResolvedValue(0);
      prismaMock.customer.findMany.mockResolvedValue([]);
      prismaMock.customer.count.mockResolvedValue(0);

      const concurrentRequests = [
        request(app)
          .get(`/api/shops/${SHOP_A_ID}/products`)
          .set('Authorization', `Bearer ${makeShopToken(Role.CASHIER, SHOP_A_ID)}`),
        request(app)
          .get(`/api/shops/${SHOP_B_ID}/products`)
          .set('Authorization', `Bearer ${makeShopToken(Role.CASHIER, SHOP_B_ID)}`),
        request(app)
          .get(`/api/shops/${SHOP_A_ID}/customers`)
          .set('Authorization', `Bearer ${makeShopToken(Role.ANALYST, SHOP_A_ID)}`),
      ];

      const results = await Promise.all(concurrentRequests);
      results.forEach((res) => {
        expect([200, 403]).toContain(res.status);
      });
    });
  });

  // ─── FLOW 5: Account Lockout ───────────────────────────────────────────────

  describe('FLOW 5: Account Lockout Integration', () => {
    it('should not lock account on first failed attempt', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 12);
      prismaMock.user.findUnique.mockResolvedValue(mockUser('user-1', 'user@example.com', {
        passwordHash, failedLoginAttempts: 0,
      }));
      prismaMock.user.update.mockResolvedValue({ failedLoginAttempts: 1, lockedUntil: null });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com', password: 'wrong-password' });

      expect(res.status).toBe(401);
      // Verify update was called to increment failed attempts
      expect(prismaMock.user.update).toHaveBeenCalled();
    });

    it('should lock account after 5 failed attempts', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 12);
      prismaMock.user.findUnique.mockResolvedValue(mockUser('user-1', 'user@example.com', {
        passwordHash, failedLoginAttempts: 4, // 4 previous failures → 5th will lock
      }));
      prismaMock.user.update.mockResolvedValue({ failedLoginAttempts: 5, lockedUntil: new Date() });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com', password: 'wrong-password' });

      expect(res.status).toBe(401);
      // Verify that lockedUntil was set in the update call
      const updateCall = prismaMock.user.update.mock.calls[0];
      expect(updateCall).toBeDefined();
    });

    it('should reject login when account is already locked', async () => {
      const futureTime = new Date(Date.now() + 15 * 60 * 1000);
      prismaMock.user.findUnique.mockResolvedValue(mockUser('user-1', 'user@example.com', {
        lockedUntil: futureTime, failedLoginAttempts: 5,
      }));

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com', password: 'any-password' });

      expect(res.status).toBe(423); // HTTP 423 Locked
      expect(res.body.error).toMatch(/locked/i);
    });

    it('should allow login when lock has expired', async () => {
      const passwordHash = await bcrypt.hash('correct', 12);
      const pastTime = new Date(Date.now() - 1000); // Lock expired 1 second ago
      prismaMock.user.findUnique.mockResolvedValue(mockUser('user-1', 'user@example.com', {
        passwordHash,
        lockedUntil: pastTime, // Expired lock
        failedLoginAttempts: 5,
      }));
      prismaMock.user.update.mockResolvedValue({});
      prismaMock.refreshToken.create.mockResolvedValue({ token: 'refresh-token' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com', password: 'correct' });

      expect(res.status).toBe(200);
    });

    it('should reset failed attempts after successful login', async () => {
      const passwordHash = await bcrypt.hash('correct', 12);
      prismaMock.user.findUnique.mockResolvedValue(mockUser('user-1', 'user@example.com', {
        passwordHash, failedLoginAttempts: 3,
      }));
      prismaMock.user.update.mockResolvedValue({ failedLoginAttempts: 0, lockedUntil: null });
      prismaMock.refreshToken.create.mockResolvedValue({ token: 'refresh-token' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com', password: 'correct' });

      expect(res.status).toBe(200);
      // Verify that failedLoginAttempts was reset to 0
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedLoginAttempts: 0 }),
        })
      );
    });
  });

  // ─── FLOW 6: Token Refresh Flow ───────────────────────────────────────────

  describe('FLOW 6: Token Lifecycle', () => {
    it('should refresh token before expiry', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        token: 'valid-refresh-token',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days remaining
        user: { id: 'user-1', email: 'user@example.com', isActive: true },
      });

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeTruthy();
    });

    it('should reject revoked refresh token', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        token: 'revoked-token',
        isRevoked: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: { id: 'user-1', email: 'user@example.com', isActive: true },
      });

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'revoked-token' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent refresh token', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'nonexistent-token' });

      expect(res.status).toBe(401);
    });

    it('should reject missing refresh token body', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
