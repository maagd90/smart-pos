import { Router, Response } from 'express';
import { body, param } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { handleValidationErrors } from '../middleware/validation';
import { authenticate, AuthRequest } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { PaymentMethod } from '../types';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

router.get('/', authenticate, apiRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { shopId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { shopId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      prisma.transaction.count({ where: { shopId } }),
    ]);

    res.json({ success: true, data: { transactions, total, page, limit } });
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post(
  '/',
  authenticate,
  apiRateLimiter,
  [
    body('items').isArray({ min: 1 }),
    body('items.*.productId').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('paymentMethod').isIn(Object.values(PaymentMethod)),
    body('customerId').optional().notEmpty(),
    body('discount').optional().isFloat({ min: 0 }),
    body('tax').optional().isFloat({ min: 0 }),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const { shopId } = req.params;
      const { items, paymentMethod, customerId, discount = 0, tax = 0 } = req.body;
      const cashierId = req.user!.userId;

      const productIds = items.map((i: { productId: string }) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, shopId, isActive: true },
      });

      if (products.length !== productIds.length) {
        res.status(400).json({ success: false, error: 'One or more products not found' });
        return;
      }

      const productMap = new Map(products.map((p) => [p.id, p]));
      let subtotal = 0;

      const transactionItems = items.map((item: { productId: string; quantity: number }) => {
        const product = productMap.get(item.productId)!;
        const priceAtSale = Number(product.price);
        subtotal += priceAtSale * item.quantity;
        return {
          productId: item.productId,
          quantity: item.quantity,
          priceAtSale,
        };
      });

      const total = subtotal - discount + tax;

      const transaction = await prisma.transaction.create({
        data: {
          shopId,
          cashierId,
          customerId: customerId || null,
          total,
          discount,
          tax,
          paymentMethod,
          items: { create: transactionItems },
        },
        include: { items: true },
      });

      if (customerId) {
        const points = Math.floor(total);
        await prisma.customer.update({
          where: { id: customerId },
          data: { loyaltyPoints: { increment: points } },
        });
      }

      res.status(201).json({ success: true, data: transaction });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

router.get(
  '/:transactionId',
  authenticate,
  apiRateLimiter,
  [param('transactionId').notEmpty()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const transaction = await prisma.transaction.findFirst({
        where: { id: req.params.transactionId, shopId: req.params.shopId },
        include: { items: { include: { product: true } } },
      });
      if (!transaction) {
        res.status(404).json({ success: false, error: 'Transaction not found' });
        return;
      }
      res.json({ success: true, data: transaction });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
