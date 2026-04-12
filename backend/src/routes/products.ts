import { Router, Response } from 'express';
import { body, param } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { handleValidationErrors } from '../middleware/validation';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireMinRole } from '../middleware/rbac';
import { Role } from '../types';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { shopId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const category = req.query.category as string | undefined;

    const where = {
      shopId,
      isActive: true,
      ...(category ? { category } : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.product.count({ where }),
    ]);

    res.json({ success: true, data: { products, total, page, limit } });
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post(
  '/',
  authenticate,
  requireMinRole(Role.MANAGER),
  [
    body('name').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('stock').optional().isInt({ min: 0 }),
    body('category').optional().trim(),
    body('description').optional().trim(),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const { shopId } = req.params;
      const product = await prisma.product.create({
        data: { ...req.body, shopId },
      });
      res.status(201).json({ success: true, data: product });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

router.get(
  '/:productId',
  authenticate,
  [param('productId').notEmpty()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const product = await prisma.product.findFirst({
        where: { id: req.params.productId, shopId: req.params.shopId },
      });
      if (!product) {
        res.status(404).json({ success: false, error: 'Product not found' });
        return;
      }
      res.json({ success: true, data: product });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

router.patch(
  '/:productId',
  authenticate,
  requireMinRole(Role.MANAGER),
  [param('productId').notEmpty()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const product = await prisma.product.update({
        where: { id: req.params.productId },
        data: req.body,
      });
      res.json({ success: true, data: product });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

router.delete(
  '/:productId',
  authenticate,
  requireMinRole(Role.MANAGER),
  [param('productId').notEmpty()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      await prisma.product.update({
        where: { id: req.params.productId },
        data: { isActive: false },
      });
      res.json({ success: true, message: 'Product deactivated' });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
