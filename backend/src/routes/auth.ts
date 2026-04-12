import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { handleValidationErrors } from '../middleware/validation';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authenticate, AuthRequest } from '../middleware/auth';
import { loginUser, refreshAccessToken, revokeRefreshToken, hashPassword } from '../services/auth';
import { apiRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const prisma = new PrismaClient();

router.post(
  '/register',
  authRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().notEmpty(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(409).json({ success: false, error: 'Email already registered' });
        return;
      }

      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: { email, passwordHash, name },
        select: { id: true, email: true, name: true, createdAt: true },
      });

      res.status(201).json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

router.post(
  '/login',
  authRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { email, password, shopId } = req.body;
      const result = await loginUser(prisma, email, password, shopId);
      res.json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      const status = message.includes('locked') ? 423 : 401;
      res.status(status).json({ success: false, error: message });
    }
  }
);

router.post(
  '/refresh',
  [body('refreshToken').notEmpty()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      const result = await refreshAccessToken(prisma, refreshToken);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }
  }
);

router.post(
  '/logout',
  authenticate,
  apiRateLimiter,
  [body('refreshToken').notEmpty()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      await revokeRefreshToken(prisma, refreshToken);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Failed to logout' });
    }
  }
);

export default router;
