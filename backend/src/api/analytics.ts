import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireMinRole } from '../middleware/permissions';
import {
  getDashboardData,
  getSalesAnalytics,
  getProductAnalytics,
  getCustomerAnalytics,
  getInventoryHealth,
  getMessagingMetrics,
  getStaffPerformance,
} from '../services/analytics/analyticsService';

export const analyticsRouter = Router();
analyticsRouter.use(authenticate, requireMinRole('ANALYST'));

function parseDateRange(req: { query: Record<string, unknown> }) {
  const end = req.query.endDate ? new Date(String(req.query.endDate)) : new Date();
  const start = req.query.startDate
    ? new Date(String(req.query.startDate))
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return { start, end };
}

analyticsRouter.get('/dashboard', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { start, end } = parseDateRange(req);
    const data = await getDashboardData(start, end);
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

analyticsRouter.get('/sales', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { start, end } = parseDateRange(req);
    const data = await getSalesAnalytics(start, end);
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

analyticsRouter.get('/products', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { start, end } = parseDateRange(req);
    const data = await getProductAnalytics(start, end);
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

analyticsRouter.get('/customers', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getCustomerAnalytics();
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

analyticsRouter.get('/inventory', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getInventoryHealth();
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

analyticsRouter.get('/messaging', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { start, end } = parseDateRange(req);
    const data = await getMessagingMetrics(start, end);
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

analyticsRouter.get('/staff', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { start, end } = parseDateRange(req);
    const data = await getStaffPerformance(start, end);
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
