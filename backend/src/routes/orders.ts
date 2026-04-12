import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { shopIsolation } from '../middleware/shopIsolation';
import { createOrderSchema } from '../services/validation';

const router = Router({ mergeParams: true });

router.use(authenticate, shopIsolation);

/**
 * POST /api/shops/:shopId/orders
 * Create a new order (POS checkout).
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    return;
  }

  const { customerId, discount = 0, tax = 0, paymentMethod, items } = parsed.data;

  try {
    // Validate all products exist in this shop and have sufficient stock
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, shopId: req.params.shopId, isActive: true },
    });

    if (products.length !== productIds.length) {
      res.status(400).json({ message: 'One or more products are invalid or unavailable' });
      return;
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Check stock
    for (const item of items) {
      const product = productMap.get(item.productId)!;
      if (product.stock < item.quantity) {
        res.status(400).json({
          message: `Insufficient stock for product "${product.name}"`,
        });
        return;
      }
    }

    // Calculate total
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal - discount + tax;

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          shopId: req.params.shopId,
          customerId: customerId ?? null,
          total,
          discount,
          tax,
          status: 'COMPLETED',
          paymentMethod: paymentMethod ?? null,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: { items: { include: { product: true } }, customer: true },
      });

      // Update stock for each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Update customer stats
      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            totalSpent: { increment: total },
            visitCount: { increment: 1 },
          },
        });
      }

      return createdOrder;
    });

    res.status(201).json({ order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/shops/:shopId/orders
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { shopId: req.params.shopId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
      }),
      prisma.order.count({ where: { shopId: req.params.shopId } }),
    ]);

    res.json({ orders, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List orders error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/shops/:shopId/orders/:orderId
 */
router.get('/:orderId', async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId, shopId: req.params.shopId },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res.json({ order });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
