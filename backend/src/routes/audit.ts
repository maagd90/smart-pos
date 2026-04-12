import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { shopIsolation } from '../middleware/shopIsolation';
import { requireShopAdmin } from '../middleware/rbac';

const router = Router({ mergeParams: true });

router.use(authenticate, shopIsolation, requireShopAdmin);

/**
 * GET /api/shops/:shopId/audit
 * Get audit logs for a shop (paginated).
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const action = req.query.action as string | undefined;

    const where = {
      shopId: req.params.shopId,
      ...(action ? { action: { contains: action, mode: 'insensitive' as const } } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ logs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Audit logs error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
