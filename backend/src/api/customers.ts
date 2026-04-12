import { Router, Response } from 'express';
import { validationResult } from 'express-validator';
import { authenticate, AuthRequest, auditLog } from '../middleware/auth';
import { customerValidation, paginationValidation, uuidParam } from '../utils/validators';
import { prisma } from '../db/prismaClient';
import { getPaginationParams, buildPaginationMeta, calculateLoyaltyPoints } from '../utils/formatters';

export const customersRouter = Router();

customersRouter.use(authenticate);

customersRouter.get('/', paginationValidation, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { search, segment } = req.query;

    const where: Record<string, unknown> = {};
    if (segment) where.segment = String(segment);
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search) } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          segment: true,
          loyaltyPoints: true,
          totalSpent: true,
          visitCount: true,
          lastVisit: true,
          createdAt: true,
        },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({ success: true, data: customers, meta: buildPaginationMeta(total, page, limit) });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

customersRouter.post('/', customerValidation, async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  try {
    const customer = await prisma.customer.create({ data: req.body });
    await auditLog(req.user?.id, 'CREATE_CUSTOMER', 'customers', customer.id, { name: customer.name }, req.ip);
    res.status(201).json({ success: true, data: customer });
  } catch (err: unknown) {
    const error = err as { code?: string; message: string };
    if (error.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Phone or email already exists' });
      return;
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

customersRouter.get('/segments', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const segments = await prisma.customer.groupBy({
      by: ['segment'],
      _count: true,
      _sum: { totalSpent: true },
      _avg: { totalSpent: true },
    });
    res.json({ success: true, data: segments });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

customersRouter.get('/:id', uuidParam, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, total: true, paymentMethod: true, createdAt: true, receiptNumber: true },
        },
        _count: { select: { messages: true, transactions: true } },
      },
    });

    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }
    res.json({ success: true, data: customer });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

customersRouter.put('/:id', uuidParam, customerValidation, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await auditLog(req.user?.id, 'UPDATE_CUSTOMER', 'customers', customer.id, req.body as Record<string, unknown>, req.ip);
    res.json({ success: true, data: customer });
  } catch (err: unknown) {
    const error = err as { code?: string; message: string };
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

customersRouter.get('/:id/transactions', uuidParam, paginationValidation, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { customerId: req.params.id },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { transactionItems: { include: { product: { select: { name: true } } } } },
      }),
      prisma.transaction.count({ where: { customerId: req.params.id } }),
    ]);
    res.json({ success: true, data: transactions, meta: buildPaginationMeta(total, page, limit) });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

customersRouter.post('/:id/loyalty', uuidParam, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, points, reason } = req.body;

    if (!['add', 'redeem'].includes(action) || typeof points !== 'number' || points <= 0) {
      res.status(400).json({ success: false, message: 'Invalid loyalty action or points' });
      return;
    }

    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    if (action === 'redeem' && customer.loyaltyPoints < points) {
      res.status(400).json({ success: false, message: 'Insufficient loyalty points' });
      return;
    }

    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data: { loyaltyPoints: action === 'add' ? { increment: points } : { decrement: points } },
    });

    await auditLog(
      req.user?.id,
      action === 'add' ? 'ADD_LOYALTY' : 'REDEEM_LOYALTY',
      'customers',
      req.params.id,
      { points, reason } as Record<string, unknown>,
      req.ip
    );

    res.json({ success: true, data: { loyaltyPoints: updated.loyaltyPoints } });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
