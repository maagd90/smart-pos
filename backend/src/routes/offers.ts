import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { shopIsolation } from '../middleware/shopIsolation';
import { requireManager } from '../middleware/rbac';
import { createOfferSchema, updateOfferSchema } from '../services/validation';

const router = Router({ mergeParams: true });

router.use(authenticate, shopIsolation);

/**
 * GET /api/shops/:shopId/offers
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const offers = await prisma.offer.findMany({
      where: { shopId: req.params.shopId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ offers });
  } catch (err) {
    console.error('List offers error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/shops/:shopId/offers
 */
router.post('/', requireManager, async (req: Request, res: Response): Promise<void> => {
  const parsed = createOfferSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    return;
  }

  try {
    const offer = await prisma.offer.create({
      data: {
        ...parsed.data,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
        shopId: req.params.shopId,
      },
    });
    res.status(201).json({ offer });
  } catch (err) {
    console.error('Create offer error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /api/shops/:shopId/offers/:offerId
 */
router.put('/:offerId', requireManager, async (req: Request, res: Response): Promise<void> => {
  const parsed = updateOfferSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    return;
  }

  try {
    const offer = await prisma.offer.update({
      where: { id: req.params.offerId, shopId: req.params.shopId },
      data: {
        ...parsed.data,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
      },
    });
    res.json({ offer });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      res.status(404).json({ message: 'Offer not found' });
      return;
    }
    console.error('Update offer error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /api/shops/:shopId/offers/:offerId
 */
router.delete('/:offerId', requireManager, async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.offer.delete({
      where: { id: req.params.offerId, shopId: req.params.shopId },
    });
    res.json({ message: 'Offer deleted successfully' });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      res.status(404).json({ message: 'Offer not found' });
      return;
    }
    console.error('Delete offer error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
