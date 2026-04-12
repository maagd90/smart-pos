import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { shopIsolation } from '../middleware/shopIsolation';
import { requireManager } from '../middleware/rbac';
import { createProductSchema, updateProductSchema } from '../services/validation';

const router = Router({ mergeParams: true });

router.use(authenticate, shopIsolation);

/**
 * GET /api/shops/:shopId/products
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;

    const where = {
      shopId: req.params.shopId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { sku: { contains: search, mode: 'insensitive' as const } },
              { barcode: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(category ? { category } : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.product.count({ where }),
    ]);

    res.json({ products, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List products error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/shops/:shopId/products
 */
router.post('/', requireManager, async (req: Request, res: Response): Promise<void> => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    return;
  }

  try {
    const product = await prisma.product.create({
      data: { ...parsed.data, shopId: req.params.shopId },
    });
    res.status(201).json({ product });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /api/shops/:shopId/products/:productId
 */
router.put('/:productId', requireManager, async (req: Request, res: Response): Promise<void> => {
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    return;
  }

  try {
    const product = await prisma.product.update({
      where: { id: req.params.productId, shopId: req.params.shopId },
      data: parsed.data,
    });
    res.json({ product });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    console.error('Update product error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /api/shops/:shopId/products/:productId
 */
router.delete('/:productId', requireManager, async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.product.delete({
      where: { id: req.params.productId, shopId: req.params.shopId },
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    console.error('Delete product error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
