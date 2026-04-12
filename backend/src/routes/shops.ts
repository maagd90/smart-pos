import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { requirePlatformAdmin } from '../middleware/rbac';
import { createShopSchema, updateShopSchema } from '../services/validation';

const router = Router();

// All platform routes require authentication and PLATFORM_ADMIN role
router.use(authenticate, requirePlatformAdmin);

/**
 * GET /api/platform/shops
 * List all shops with pagination.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        skip,
        take: limit,
        include: {
          _count: { select: { users: true, products: true, orders: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shop.count(),
    ]);

    res.json({ shops, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List shops error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/platform/shops
 * Create a new shop.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = createShopSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    return;
  }

  try {
    const existing = await prisma.shop.findUnique({ where: { slug: parsed.data.slug } });
    if (existing) {
      res.status(409).json({ message: 'Slug already in use' });
      return;
    }

    const shop = await prisma.shop.create({ data: parsed.data });
    res.status(201).json({ shop });
  } catch (err) {
    console.error('Create shop error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/platform/shops/:id
 * Get a specific shop with full details.
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { users: true, products: true, orders: true, customers: true } },
      },
    });

    if (!shop) {
      res.status(404).json({ message: 'Shop not found' });
      return;
    }

    res.json({ shop });
  } catch (err) {
    console.error('Get shop error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /api/platform/shops/:id
 * Update a shop.
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const parsed = updateShopSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    return;
  }

  try {
    const shop = await prisma.shop.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json({ shop });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      res.status(404).json({ message: 'Shop not found' });
      return;
    }
    console.error('Update shop error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /api/platform/shops/:id
 * Delete a shop.
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.shop.delete({ where: { id: req.params.id } });
    res.json({ message: 'Shop deleted successfully' });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      res.status(404).json({ message: 'Shop not found' });
      return;
    }
    console.error('Delete shop error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/platform/analytics
 * Cross-shop platform analytics.
 */
router.get('/platform/analytics', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalShops,
      activeShops,
      totalOrders,
      totalRevenue,
      totalCustomers,
      recentOrders,
    ] = await Promise.all([
      prisma.shop.count(),
      prisma.shop.count({ where: { status: 'ACTIVE' } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.customer.count(),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { shop: { select: { name: true } } },
      }),
    ]);

    res.json({
      totalShops,
      activeShops,
      totalOrders,
      totalRevenue: totalRevenue._sum.total ?? 0,
      totalCustomers,
      recentOrders,
    });
  } catch (err) {
    console.error('Platform analytics error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
