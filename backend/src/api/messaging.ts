import { Router, Response } from 'express';
import { validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireMinRole } from '../middleware/permissions';
import { campaignValidation, paginationValidation } from '../utils/validators';
import { sendMessage } from '../services/messaging/messagingService';
import { prisma } from '../db/prismaClient';
import { getPaginationParams, buildPaginationMeta } from '../utils/formatters';

export const messagingRouter = Router();
messagingRouter.use(authenticate);

messagingRouter.get('/campaigns', requireMinRole('MANAGER'), paginationValidation, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { creator: { select: { name: true } }, _count: { select: { messages: true } } },
      }),
      prisma.campaign.count(),
    ]);
    res.json({ success: true, data: campaigns, meta: buildPaginationMeta(total, page, limit) });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

messagingRouter.post('/campaigns', requireMinRole('MANAGER'), campaignValidation, async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  try {
    const campaign = await prisma.campaign.create({
      data: { ...req.body, createdBy: req.user!.id },
    });
    res.status(201).json({ success: true, data: campaign });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

messagingRouter.post('/send', requireMinRole('MANAGER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId, channel, content, subject, skipSpamCheck } = req.body;
    if (!customerId || !channel || !content) {
      res.status(400).json({ success: false, message: 'customerId, channel, and content are required' });
      return;
    }

    const result = await sendMessage({
      customerId,
      channel,
      content,
      subject,
      userId: req.user!.id,
      skipSpamCheck: skipSpamCheck === true,
    });

    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message: string };
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

messagingRouter.get('/history', paginationValidation, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { customerId, channel, status } = req.query;

    const where: Record<string, unknown> = {};
    if (customerId) where.customerId = String(customerId);
    if (channel) where.channel = String(channel);
    if (status) where.status = String(status);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true, phone: true } } },
      }),
      prisma.message.count({ where }),
    ]);

    res.json({ success: true, data: messages, meta: buildPaginationMeta(total, page, limit) });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Templates are stored as settings
messagingRouter.get('/templates', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const templates = await prisma.setting.findMany({
      where: { key: { startsWith: 'template:' } },
    });
    res.json({
      success: true,
      data: templates.map((t) => ({
        id: t.id,
        name: t.key.replace('template:', ''),
        content: t.value,
      })),
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

messagingRouter.post('/templates', requireMinRole('MANAGER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, content } = req.body;
    if (!name || !content) {
      res.status(400).json({ success: false, message: 'name and content are required' });
      return;
    }

    const template = await prisma.setting.upsert({
      where: { key: `template:${name}` },
      update: { value: content, updatedBy: req.user?.id },
      create: { key: `template:${name}`, value: content, updatedBy: req.user?.id },
    });

    res.status(201).json({ success: true, data: template });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
