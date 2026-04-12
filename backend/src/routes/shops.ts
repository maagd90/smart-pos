import { Router, Response } from 'express';
import { body, param } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { handleValidationErrors } from '../middleware/validation';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { createShop, getShopById, updateShop, listShops } from '../services/shop';
import { Role } from '../types';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await listShops(prisma, page, limit);
    res.json({ success: true, data: result });
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post(
  '/',
  authenticate,
  requireRole(Role.PLATFORM_ADMIN),
  [
    body('name').trim().notEmpty(),
    body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const shop = await createShop(prisma, req.body, req.user!.userId);
      res.status(201).json({ success: true, data: shop });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create shop';
      res.status(400).json({ success: false, error: message });
    }
  }
);

router.get(
  '/:shopId',
  authenticate,
  [param('shopId').notEmpty()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const shop = await getShopById(prisma, req.params.shopId);
      if (!shop) {
        res.status(404).json({ success: false, error: 'Shop not found' });
        return;
      }
      res.json({ success: true, data: shop });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

router.patch(
  '/:shopId',
  authenticate,
  requireRole(Role.PLATFORM_ADMIN, Role.SHOP_ADMIN),
  [param('shopId').notEmpty()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const shop = await updateShop(prisma, req.params.shopId, req.body);
      res.json({ success: true, data: shop });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
