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
      create: jest.fn(),
      findUnique: jest.fn(),
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

function makeToken(role: Role = Role.PLATFORM_ADMIN) {
  return generateAccessToken({ userId: 'user-1', email: 'admin@example.com', role });
}

describe('Shop Routes', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('GET /api/shops', () => {
    it('should list shops', async () => {
      prismaMock.shop.findMany.mockResolvedValue([
        { id: 'shop-1', name: 'Shop One', slug: 'shop-one', isActive: true },
      ]);
      prismaMock.shop.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/shops')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should require auth', async () => {
      const res = await request(app).get('/api/shops');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/shops', () => {
    it('should create shop as PLATFORM_ADMIN', async () => {
      prismaMock.shop.findUnique.mockResolvedValue(null);
      prismaMock.shop.create.mockResolvedValue({
        id: 'shop-1', name: 'New Shop', slug: 'new-shop',
      });
      prismaMock.shopUser.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/shops')
        .set('Authorization', `Bearer ${makeToken(Role.PLATFORM_ADMIN)}`)
        .send({ name: 'New Shop', slug: 'new-shop' });

      expect(res.status).toBe(201);
    });

    it('should reject non-admin', async () => {
      const res = await request(app)
        .post('/api/shops')
        .set('Authorization', `Bearer ${makeToken(Role.CASHIER)}`)
        .send({ name: 'New Shop', slug: 'new-shop' });

      expect(res.status).toBe(403);
    });
  });
});
