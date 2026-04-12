import { Router, Response } from 'express';
import { validationResult } from 'express-validator';
import { authenticate, AuthRequest, auditLog } from '../middleware/auth';
import { transactionValidation, paginationValidation, uuidParam } from '../utils/validators';
import { createTransaction, refundTransaction } from '../services/pos/transactionService';
import { getReceiptData } from '../services/pos/receiptService';
import { sendMessage } from '../services/messaging/messagingService';
import { prisma } from '../db/prismaClient';
import { getPaginationParams, buildPaginationMeta } from '../utils/formatters';

export const posRouter = Router();

posRouter.use(authenticate);

posRouter.post('/transactions', transactionValidation, async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  try {
    const transaction = await createTransaction({
      ...req.body,
      userId: req.user!.id,
    });
    await auditLog(req.user?.id, 'CREATE_TRANSACTION', 'transactions', transaction.id, { total: transaction.total }, req.ip);
    res.status(201).json({ success: true, data: transaction });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message: string };
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

posRouter.get('/transactions', paginationValidation, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { customerId, startDate, endDate, paymentMethod, paymentStatus } = req.query;

    const where: Record<string, unknown> = {};
    if (customerId) where.customerId = String(customerId);
    if (paymentMethod) where.paymentMethod = String(paymentMethod);
    if (paymentStatus) where.paymentStatus = String(paymentStatus);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(String(startDate));
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(String(endDate));
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({ success: true, data: transactions, meta: buildPaginationMeta(total, page, limit) });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

posRouter.get('/transactions/:id', uuidParam, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        transactionItems: { include: { product: true } },
        customer: true,
        user: { select: { id: true, name: true } },
        receipt: true,
      },
    });

    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }
    res.json({ success: true, data: transaction });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

posRouter.post('/transactions/:id/refund', uuidParam, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await refundTransaction(req.params.id, req.body.reason);
    await auditLog(req.user?.id, 'REFUND_TRANSACTION', 'transactions', req.params.id, { reason: req.body.reason }, req.ip);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message: string };
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

posRouter.get('/receipts/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const receipt = await getReceiptData(req.params.id);
    res.json({ success: true, data: receipt });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message: string };
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

posRouter.post('/receipts/:id/send', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: { customer: true, receipt: true },
    });

    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }
    if (!transaction.customer) {
      res.status(400).json({ success: false, message: 'No customer linked to this transaction' });
      return;
    }

    const { channel } = req.body;
    const receiptData = await getReceiptData(req.params.id);
    const content = `Receipt #${receiptData.receiptNumber}\nTotal: $${receiptData.total.toFixed(2)}\nThank you for your purchase!`;

    await sendMessage({
      customerId: transaction.customerId!,
      channel,
      content,
      subject: `Receipt #${receiptData.receiptNumber}`,
      userId: req.user!.id,
      skipSpamCheck: true,
    });

    if (channel === 'EMAIL') {
      await prisma.receipt.update({ where: { transactionId: req.params.id }, data: { emailSent: true } });
    } else if (channel === 'WHATSAPP') {
      await prisma.receipt.update({ where: { transactionId: req.params.id }, data: { whatsappSent: true } });
    }

    res.json({ success: true, message: 'Receipt sent' });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message: string };
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

posRouter.get('/products/search', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = String(req.query.q || '');
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { barcode: { equals: q } },
        ],
      },
      take: 20,
      select: { id: true, name: true, sku: true, barcode: true, price: true, stock: true, category: true },
    });
    res.json({ success: true, data: products });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
