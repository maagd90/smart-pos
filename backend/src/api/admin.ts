import { Router, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { authenticate, AuthRequest, auditLog } from '../middleware/auth';
import { requireRole, requireMinRole } from '../middleware/permissions';
import { registerValidation, paginationValidation, uuidParam } from '../utils/validators';
import { prisma } from '../db/prismaClient';
import { getPaginationParams, buildPaginationMeta } from '../utils/formatters';
import { BCRYPT_ROUNDS } from '../utils/constants';
import { io } from '../index';

export const adminRouter = Router();
adminRouter.use(authenticate, requireMinRole('MANAGER'));

adminRouter.get('/users', paginationValidation, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
      }),
      prisma.user.count(),
    ]);
    res.json({ success: true, data: users, meta: buildPaginationMeta(total, page, limit) });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

adminRouter.post('/users', requireRole('OWNER'), registerValidation, async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  try {
    const hashed = await bcrypt.hash(req.body.password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: { ...req.body, password: hashed },
      select: { id: true, email: true, name: true, role: true },
    });
    await auditLog(req.user?.id, 'CREATE_USER', 'users', user.id, { name: user.name }, req.ip);
    res.status(201).json({ success: true, data: user });
  } catch (err: unknown) {
    const error = err as { code?: string; message: string };
    if (error.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Email already in use' });
      return;
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

adminRouter.put('/users/:id', requireRole('OWNER'), uuidParam, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { password, ...data } = req.body;
    const updateData: Record<string, unknown> = { ...data };
    if (password) {
      updateData.password = await bcrypt.hash(password as string, BCRYPT_ROUNDS);
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    await auditLog(req.user?.id, 'UPDATE_USER', 'users', user.id, data as Record<string, unknown>, req.ip);
    res.json({ success: true, data: user });
  } catch (err: unknown) {
    const error = err as { code?: string; message: string };
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

adminRouter.delete('/users/:id', requireRole('OWNER'), uuidParam, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    await auditLog(req.user?.id, 'DEACTIVATE_USER', 'users', req.params.id, {}, req.ip);
    res.json({ success: true, message: 'User deactivated' });
  } catch {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

adminRouter.get('/audit-logs', paginationValidation, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { resource, userId } = req.query;
    const where: Record<string, unknown> = {};
    if (resource) where.resource = String(resource);
    if (userId) where.userId = String(userId);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ success: true, data: logs, meta: buildPaginationMeta(total, page, limit) });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

adminRouter.get('/machines', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const machines = await prisma.machine.findMany({ orderBy: { lastSeen: 'desc' } });
    res.json({ success: true, data: machines });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

adminRouter.post('/machines', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const machine = await prisma.machine.create({
      data: { name: req.body.name, userId: req.user?.id },
    });
    io.emit('machine:status', { machineId: machine.id, name: machine.name, status: machine.status });
    res.status(201).json({ success: true, data: machine });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
