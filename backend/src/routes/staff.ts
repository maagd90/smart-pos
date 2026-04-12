import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { shopIsolation } from '../middleware/shopIsolation';
import { requireShopAdmin } from '../middleware/rbac';
import { createStaffSchema, updateStaffSchema } from '../services/validation';

const router = Router({ mergeParams: true });

router.use(authenticate, shopIsolation, requireShopAdmin);

const SALT_ROUNDS = 12;

/**
 * GET /api/shops/:shopId/staff
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const staff = await prisma.user.findMany({
      where: { shopId: req.params.shopId, role: { not: 'PLATFORM_ADMIN' } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        shopId: true,
        createdAt: true,
        lockedUntil: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ staff });
  } catch (err) {
    console.error('List staff error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/shops/:shopId/staff
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = createStaffSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, SALT_ROUNDS);

    const staff = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
        role: parsed.data.role,
        shopId: req.params.shopId,
      },
      select: { id: true, name: true, email: true, role: true, shopId: true, createdAt: true },
    });

    res.status(201).json({ staff });
  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /api/shops/:shopId/staff/:userId
 */
router.put('/:userId', async (req: Request, res: Response): Promise<void> => {
  const parsed = updateStaffSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    return;
  }

  try {
    const updateData: Record<string, unknown> = { ...parsed.data };

    if (parsed.data.password) {
      updateData.password = await bcrypt.hash(parsed.data.password, SALT_ROUNDS);
    }

    const staff = await prisma.user.update({
      where: { id: req.params.userId, shopId: req.params.shopId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, shopId: true, updatedAt: true },
    });

    res.json({ staff });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      res.status(404).json({ message: 'Staff member not found' });
      return;
    }
    console.error('Update staff error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /api/shops/:shopId/staff/:userId
 */
router.delete('/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    // Prevent deleting yourself
    if (req.params.userId === req.user!.userId) {
      res.status(400).json({ message: 'Cannot remove yourself' });
      return;
    }

    await prisma.user.delete({
      where: { id: req.params.userId, shopId: req.params.shopId },
    });

    res.json({ message: 'Staff member removed successfully' });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      res.status(404).json({ message: 'Staff member not found' });
      return;
    }
    console.error('Delete staff error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
