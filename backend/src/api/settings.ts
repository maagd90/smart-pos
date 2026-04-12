import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireMinRole } from '../middleware/permissions';
import { prisma } from '../db/prismaClient';

export const settingsRouter = Router();
settingsRouter.use(authenticate);

settingsRouter.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { not: { startsWith: 'template:' } } },
      orderBy: { key: 'asc' },
    });
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    res.json({ success: true, data: map });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

settingsRouter.put('/', requireMinRole('MANAGER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updates = req.body as Record<string, string>;
    const ops = Object.entries(updates).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value, updatedBy: req.user?.id },
        create: { key, value, updatedBy: req.user?.id },
      })
    );
    await prisma.$transaction(ops);
    res.json({ success: true, message: 'Settings updated' });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

settingsRouter.get('/ai', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: 'ai:' } },
    });
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key.replace('ai:', '')] = s.value;
    res.json({ success: true, data: map });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

settingsRouter.put('/ai', requireMinRole('OWNER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updates = req.body as Record<string, string>;
    const ops = Object.entries(updates).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key: `ai:${key}` },
        update: { value, updatedBy: req.user?.id },
        create: { key: `ai:${key}`, value, updatedBy: req.user?.id },
      })
    );
    await prisma.$transaction(ops);
    res.json({ success: true, message: 'AI settings updated' });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

settingsRouter.get('/messaging', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: 'messaging:' } },
    });
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key.replace('messaging:', '')] = s.value;
    res.json({ success: true, data: map });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
