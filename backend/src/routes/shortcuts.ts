import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { shopIsolation } from '../middleware/shopIsolation';
import { createShortcutSchema, updateShortcutSchema } from '../services/validation';

const router = Router({ mergeParams: true });

router.use(authenticate, shopIsolation);

/**
 * GET /api/shops/:shopId/shortcuts
 * Get shortcuts for the current user.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const shortcuts = await prisma.shortcut.findMany({
      where: { userId: req.user!.userId, shopId: req.params.shopId },
      orderBy: { order: 'asc' },
    });
    res.json({ shortcuts });
  } catch (err) {
    console.error('Get shortcuts error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/shops/:shopId/shortcuts
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = createShortcutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    return;
  }

  try {
    const shortcut = await prisma.shortcut.create({
      data: {
        ...parsed.data,
        userId: req.user!.userId,
        shopId: req.params.shopId,
        custom: true,
      },
    });
    res.status(201).json({ shortcut });
  } catch (err) {
    console.error('Create shortcut error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /api/shops/:shopId/shortcuts/:shortcutId
 */
router.put('/:shortcutId', async (req: Request, res: Response): Promise<void> => {
  const parsed = updateShortcutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    return;
  }

  try {
    const shortcut = await prisma.shortcut.update({
      where: { id: req.params.shortcutId, userId: req.user!.userId },
      data: parsed.data,
    });
    res.json({ shortcut });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      res.status(404).json({ message: 'Shortcut not found' });
      return;
    }
    console.error('Update shortcut error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /api/shops/:shopId/shortcuts/:shortcutId
 */
router.delete('/:shortcutId', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.shortcut.delete({
      where: { id: req.params.shortcutId, userId: req.user!.userId },
    });
    res.json({ message: 'Shortcut deleted successfully' });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      res.status(404).json({ message: 'Shortcut not found' });
      return;
    }
    console.error('Delete shortcut error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
