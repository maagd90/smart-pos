import '../tests/setup';

// Mock PrismaClient BEFORE importing app
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    shopUser: {
      findUnique: jest.fn(),
    },
    $disconnect: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

import request from 'supertest';
import app from '../src/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prismaMock = new PrismaClient() as any;

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'new@example.com',
        name: 'New User',
        createdAt: new Date(),
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@example.com', password: 'password123', name: 'New User' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject duplicate email', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'existing@example.com', password: 'password123', name: 'User' });

      expect(res.status).toBe(409);
    });

    it('should validate email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'password123', name: 'User' });

      expect(res.status).toBe(400);
    });

    it('should validate password length', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'short', name: 'User' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const passwordHash = await bcrypt.hash('password123', 12);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash,
        name: 'Test User',
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
      prismaMock.user.update.mockResolvedValue({});
      prismaMock.refreshToken.create.mockResolvedValue({ token: 'refresh-token' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeTruthy();
      expect(res.body.data.refreshToken).toBeTruthy();
    });

    it('should reject invalid credentials', async () => {
      const passwordHash = await bcrypt.hash('correct', 12);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
      prismaMock.user.update.mockResolvedValue({});

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });

      expect(res.status).toBe(401);
    });

    it('should reject inactive user', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        isActive: false,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        token: 'valid-refresh',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
        user: { id: 'user-1', email: 'test@example.com', isActive: true },
      });

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'valid-refresh' });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeTruthy();
    });

    it('should reject expired refresh token', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        token: 'expired',
        isRevoked: false,
        expiresAt: new Date(Date.now() - 1000),
        user: { id: 'user-1', email: 'test@example.com', isActive: true },
      });

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'expired' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /health', () => {
    it('should return ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
