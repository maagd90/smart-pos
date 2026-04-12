import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { shopIsolation } from '../middleware/shopIsolation';
import { encrypt, decryptNullable } from '../services/encryption';
import { createCustomerSchema, updateCustomerSchema } from '../services/validation';

const router = Router({ mergeParams: true });

router.use(authenticate, shopIsolation);

/**
 * GET /api/shops/:shopId/customers
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search as string | undefined;

    const where = {
      shopId: req.params.shopId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rawCustomers, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.customer.count({ where }),
    ]);

    // Decrypt phone numbers before returning
    const customers = rawCustomers.map((c) => ({
      ...c,
      phone: decryptNullable(c.phone),
    }));

    res.json({ customers, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List customers error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/shops/:shopId/customers
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = createCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    return;
  }

  try {
    const encryptedPhone = parsed.data.phone ? encrypt(parsed.data.phone) : undefined;

    const customer = await prisma.customer.create({
      data: {
        ...parsed.data,
        phone: encryptedPhone,
        shopId: req.params.shopId,
      },
    });

    res.status(201).json({
      customer: { ...customer, phone: parsed.data.phone ?? null },
    });
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /api/shops/:shopId/customers/:customerId
 */
router.put('/:customerId', async (req: Request, res: Response): Promise<void> => {
  const parsed = updateCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    return;
  }

  try {
    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.phone !== undefined) {
      updateData.phone = parsed.data.phone ? encrypt(parsed.data.phone) : null;
    }

    const customer = await prisma.customer.update({
      where: { id: req.params.customerId, shopId: req.params.shopId },
      data: updateData,
    });

    res.json({
      customer: { ...customer, phone: parsed.data.phone ?? decryptNullable(customer.phone) },
    });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }
    console.error('Update customer error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
