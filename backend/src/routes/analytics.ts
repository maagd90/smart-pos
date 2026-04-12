import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { shopIsolation } from '../middleware/shopIsolation';

const router = Router({ mergeParams: true });

router.use(authenticate, shopIsolation);

/**
 * GET /api/shops/:shopId/analytics
 * Shop-level analytics: revenue, orders, customers, top products.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = req.params.shopId;
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      revenueAgg,
      totalCustomers,
      newCustomers,
      topProductsRaw,
      recentOrders,
      ordersByDay,
    ] = await Promise.all([
      prisma.order.count({ where: { shopId, status: 'COMPLETED', createdAt: { gte: since } } }),
      prisma.order.aggregate({
        where: { shopId, status: 'COMPLETED', createdAt: { gte: since } },
        _sum: { total: true },
        _avg: { total: true },
      }),
      prisma.customer.count({ where: { shopId } }),
      prisma.customer.count({ where: { shopId, createdAt: { gte: since } } }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { shopId, status: 'COMPLETED', createdAt: { gte: since } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      prisma.order.findMany({
        where: { shopId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true } } },
      }),
      prisma.order.findMany({
        where: { shopId, status: 'COMPLETED', createdAt: { gte: since } },
        select: { createdAt: true, total: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Enrich top products with names
    const productIds = topProductsRaw.map((r) => r.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productNameMap = new Map(products.map((p) => [p.id, p.name]));

    const topProducts = topProductsRaw.map((r) => ({
      productId: r.productId,
      name: productNameMap.get(r.productId) ?? 'Unknown',
      totalSold: r._sum.quantity ?? 0,
    }));

    res.json({
      period: { days, since },
      totalOrders,
      totalRevenue: revenueAgg._sum.total ?? 0,
      averageOrderValue: revenueAgg._avg.total ?? 0,
      totalCustomers,
      newCustomers,
      topProducts,
      recentOrders,
      ordersByDay,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
