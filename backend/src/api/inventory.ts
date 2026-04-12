import { Router, Response } from 'express';
import { validationResult } from 'express-validator';
import { authenticate, AuthRequest, auditLog } from '../middleware/auth';
import { requireMinRole } from '../middleware/permissions';
import {
  productValidation,
  stockAdjustmentValidation,
  paginationValidation,
  uuidParam,
} from '../utils/validators';
import { adjustStock, getLowStockProducts } from '../services/inventory/inventoryService';
import { prisma } from '../db/prismaClient';
import { getPaginationParams, buildPaginationMeta } from '../utils/formatters';

export const inventoryRouter = Router();

inventoryRouter.use(authenticate);

inventoryRouter.get('/products', paginationValidation, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { category, search, lowStock } = req.query;

    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = String(category);
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { sku: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (lowStock === 'true') {
      // Fetch all active products and filter where stock <= minStock
      const all = await prisma.product.findMany({ where, orderBy: { name: 'asc' } });
      const filtered = all.filter((p) => p.stock <= p.minStock);
      const paginated = filtered.slice(skip, skip + take);
      res.json({ success: true, data: paginated, meta: buildPaginationMeta(filtered.length, page, limit) });
      return;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      prisma.product.count({ where }),
    ]);

    res.json({ success: true, data: products, meta: buildPaginationMeta(total, page, limit) });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

inventoryRouter.post(
  '/products',
  requireMinRole('MANAGER'),
  productValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const product = await prisma.product.create({ data: req.body });
      await auditLog(req.user?.id, 'CREATE_PRODUCT', 'products', product.id, { name: product.name }, req.ip);
      res.status(201).json({ success: true, data: product });
    } catch (err: unknown) {
      const error = err as { code?: string; message: string };
      if (error.code === 'P2002') {
        res.status(409).json({ success: false, message: 'SKU or barcode already exists' });
        return;
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
);

inventoryRouter.put(
  '/products/:id',
  requireMinRole('MANAGER'),
  uuidParam,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: req.body,
      });
      await auditLog(req.user?.id, 'UPDATE_PRODUCT', 'products', product.id, req.body as Record<string, unknown>, req.ip);
      res.json({ success: true, data: product });
    } catch (err: unknown) {
      const error = err as { code?: string; message: string };
      if (error.code === 'P2025') {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
);

inventoryRouter.delete(
  '/products/:id',
  requireMinRole('MANAGER'),
  uuidParam,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await prisma.product.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      await auditLog(req.user?.id, 'DELETE_PRODUCT', 'products', req.params.id, {}, req.ip);
      res.json({ success: true, message: 'Product deactivated' });
    } catch {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  }
);

inventoryRouter.post(
  '/adjustments',
  requireMinRole('MANAGER'),
  stockAdjustmentValidation,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const product = await adjustStock(
        req.body.productId,
        req.user!.id,
        req.body.type,
        req.body.quantity,
        req.body.reason
      );
      await auditLog(req.user?.id, 'STOCK_ADJUSTMENT', 'products', req.body.productId, req.body as Record<string, unknown>, req.ip);
      res.json({ success: true, data: product });
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message: string };
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  }
);

inventoryRouter.get('/alerts', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const alerts = await getLowStockProducts();
    res.json({ success: true, data: alerts });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

inventoryRouter.get('/categories', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: true,
      orderBy: { category: 'asc' },
    });
    res.json({ success: true, data: categories.map((c) => ({ name: c.category, count: c._count })) });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
