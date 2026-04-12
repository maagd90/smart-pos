import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { loginSchema, registerSchema } from '../services/validation';
import { isAccountLocked, recordFailedAttempt, resetLockout } from '../services/accountSecurity';
import { authenticate } from '../middleware/auth';
import { requirePlatformAdmin } from '../middleware/rbac';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

const SALT_ROUNDS = 12;
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function generateTokens(userId: string, email: string, role: string, shopId: string | null) {
  const secret = process.env.JWT_SECRET!;
  const refreshSecret = process.env.JWT_REFRESH_SECRET!;

  const accessToken = jwt.sign({ userId, email, role, shopId }, secret, {
    expiresIn: TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign({ userId }, refreshSecret, {
    expiresIn: REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
}

/**
 * POST /api/auth/login
 * Authenticate with email + password, receive JWT tokens.
 */
router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    return;
  }

  const { email, password } = parsed.data;

  try {
    // Account lockout check
    const locked = await isAccountLocked(email);
    if (locked) {
      res.status(423).json({ message: 'Account is temporarily locked due to too many failed attempts' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Record the attempt using a dummy delay to prevent timing attacks
      await bcrypt.compare(password, '$2b$12$invalid.hash.padding.for.timing');
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      await recordFailedAttempt(email);
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          status: 'FAILURE',
          ipAddress:
            (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
            req.socket.remoteAddress ||
            null,
          userAgent: req.headers['user-agent'] ?? null,
        },
      });
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    await resetLockout(user.id);
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role, user.shopId);

    // Persist refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        shopId: user.shopId,
        action: 'LOGIN_SUCCESS',
        status: 'SUCCESS',
        ipAddress:
          (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
          req.socket.remoteAddress ||
          null,
        userAgent: req.headers['user-agent'] ?? null,
      },
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopId: user.shopId,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/auth/refresh
 * Exchange a valid refresh token for a new access token.
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ message: 'Refresh token required' });
    return;
  }

  try {
    const refreshSecret = process.env.JWT_REFRESH_SECRET!;
    const decoded = jwt.verify(refreshToken, refreshSecret) as { userId: string };

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id,
      user.email,
      user.role,
      user.shopId
    );

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: user.id, expiresAt },
    });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }
    console.error('Refresh token error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Blacklist the access token and invalidate the refresh token.
 */
router.post('/logout', authenticate, async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization!.slice(7);
  const { refreshToken } = req.body;

  try {
    await prisma.tokenBlacklist.create({ data: { token } });

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/auth/register
 * Register a new user (platform admin only).
 */
router.post(
  '/register',
  authenticate,
  requirePlatformAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
      return;
    }

    const { name, email, password, role, shopId } = parsed.data;

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(409).json({ message: 'Email already in use' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const user = await prisma.user.create({
        data: { name, email, password: hashedPassword, role, shopId: shopId ?? null },
        select: { id: true, name: true, email: true, role: true, shopId: true, createdAt: true },
      });

      res.status(201).json({ user });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * GET /api/auth/me
 * Return the currently authenticated user's profile.
 */
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, shopId: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
