import { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { authenticate, AuthRequest, auditLog } from '../middleware/auth';
import { requireRole } from '../middleware/permissions';
import { loginValidation, registerValidation, changePasswordValidation } from '../utils/validators';
import { loginUser, registerUser, changePassword } from '../services/auth/authService';
import { prisma } from '../db/prismaClient';

export const authRouter = Router();

authRouter.post('/login', loginValidation, async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  try {
    const result = await loginUser(req.body.email, req.body.password);
    await auditLog(result.user.id, 'LOGIN', 'auth', undefined, {}, req.ip);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message: string };
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

authRouter.post(
  '/register',
  authenticate,
  requireRole('OWNER'),
  registerValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const user = await registerUser(req.body.email, req.body.password, req.body.name, req.body.role);
      await auditLog(req.user?.id, 'CREATE_USER', 'users', user.id, { name: user.name }, req.ip);
      res.status(201).json({ success: true, data: user });
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message: string };
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  }
);

authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

authRouter.post('/logout', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  await auditLog(req.user?.id, 'LOGOUT', 'auth', undefined, {}, req.ip);
  res.json({ success: true, message: 'Logged out successfully' });
});

authRouter.put(
  '/change-password',
  authenticate,
  changePasswordValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      await changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
      await auditLog(req.user?.id, 'CHANGE_PASSWORD', 'auth', undefined, {}, req.ip);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message: string };
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  }
);
