import { Router, Response } from 'express';
import { body, param } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { handleValidationErrors } from '../middleware/validation';
import { authenticate, AuthRequest } from '../middleware/auth';
import { encrypt, decrypt } from '../services/encryption';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { shopId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: { shopId },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.customer.count({ where: { shopId } }),
    ]);

    const decryptedCustomers = customers.map((c) => ({
      ...c,
      phone: c.phoneEncrypted
        ? (() => { try { return decrypt(c.phoneEncrypted!); } catch { return null; } })()
        : null,
      phoneEncrypted: undefined,
    }));

    res.json({ success: true, data: { customers: decryptedCustomers, total, page, limit } });
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post(
  '/',
  authenticate,
  [
    body('name').trim().notEmpty(),
    body('phone').optional().isMobilePhone('any'),
    body('email').optional().isEmail(),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const { shopId } = req.params;
      const { name, phone, email, optedIn } = req.body;

      const phoneEncrypted = phone ? encrypt(phone) : undefined;

      const customer = await prisma.customer.create({
        data: { shopId, name, phoneEncrypted, email, optedIn: optedIn ?? true },
      });

      res.status(201).json({
        success: true,
        data: { ...customer, phone, phoneEncrypted: undefined },
      });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

router.get(
  '/:customerId',
  authenticate,
  [param('customerId').notEmpty()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const customer = await prisma.customer.findFirst({
        where: { id: req.params.customerId, shopId: req.params.shopId },
      });
      if (!customer) {
        res.status(404).json({ success: false, error: 'Customer not found' });
        return;
      }
      const phone = customer.phoneEncrypted
        ? (() => { try { return decrypt(customer.phoneEncrypted!); } catch { return null; } })()
        : null;
      res.json({ success: true, data: { ...customer, phone, phoneEncrypted: undefined } });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
