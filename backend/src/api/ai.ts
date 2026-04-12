import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireMinRole } from '../middleware/permissions';
import { prisma } from '../db/prismaClient';
import {
  analyzeDemand,
  generatePriceRecommendations,
  getCustomerInsights,
  generateMessageContent,
  analyzeInventoryNeeds,
} from '../services/ai/aiService';
import { ProductSummary, PricingData, StockSummary } from '../services/ai/tokenOptimizer';

export const aiRouter = Router();
aiRouter.use(authenticate);

aiRouter.post('/demand-forecast', requireMinRole('ANALYST'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        transactionItems: {
          where: { transaction: { createdAt: { gte: ninetyDaysAgo }, paymentStatus: 'COMPLETED' } },
          select: { quantity: true, transaction: { select: { createdAt: true } } },
        },
      },
      take: 50,
    });

    const summaries: ProductSummary[] = products.map((p) => {
      const sold30 = p.transactionItems.filter((i) => i.transaction.createdAt >= thirtyDaysAgo).reduce((s, i) => s + i.quantity, 0);
      const sold90 = p.transactionItems.reduce((s, i) => s + i.quantity, 0);
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        minStock: p.minStock,
        soldLast30Days: sold30,
        soldLast90Days: sold90,
      };
    });

    const forecast = await analyzeDemand(summaries);
    res.json({ success: true, data: forecast });
  } catch (err: unknown) {
    const error = err as { message: string };
    res.status(500).json({ success: false, message: error.message });
  }
});

aiRouter.post('/price-recommendations', requireMinRole('MANAGER'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        transactionItems: {
          where: { transaction: { createdAt: { gte: thirtyDaysAgo }, paymentStatus: 'COMPLETED' } },
          select: { quantity: true },
        },
      },
      take: 50,
    });

    const pricingData: PricingData[] = products.map((p) => {
      const sold30 = p.transactionItems.reduce((s, i) => s + i.quantity, 0);
      const margin = p.costPrice > 0 ? ((p.price - p.costPrice) / p.price) * 100 : 0;
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        currentPrice: p.price,
        costPrice: p.costPrice,
        currentMargin: margin,
        soldLast30Days: sold30,
      };
    });

    const recommendations = await generatePriceRecommendations(pricingData);
    res.json({ success: true, data: recommendations });
  } catch (err: unknown) {
    const error = err as { message: string };
    res.status(500).json({ success: false, message: error.message });
  }
});

aiRouter.get('/customer-insights/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const insights = await getCustomerInsights(req.params.id);
    if (!insights) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }
    res.json({ success: true, data: insights });
  } catch (err: unknown) {
    const error = err as { message: string };
    res.status(500).json({ success: false, message: error.message });
  }
});

aiRouter.post('/generate-message', requireMinRole('MANAGER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId, offers } = req.body;
    if (!customerId) {
      res.status(400).json({ success: false, message: 'customerId required' });
      return;
    }
    const result = await generateMessageContent(customerId, offers ?? []);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const error = err as { message: string };
    res.status(500).json({ success: false, message: error.message });
  }
});

aiRouter.get('/inventory-forecast', requireMinRole('ANALYST'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        transactionItems: {
          where: { transaction: { createdAt: { gte: thirtyDaysAgo }, paymentStatus: 'COMPLETED' } },
          select: { quantity: true },
        },
      },
    });

    const stockSummaries: StockSummary[] = products.map((p) => {
      const sold30 = p.transactionItems.reduce((s, i) => s + i.quantity, 0);
      const avgDaily = sold30 / 30;
      const daysUntilStockout = avgDaily > 0 ? Math.floor(p.stock / avgDaily) : 999;
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        currentStock: p.stock,
        minStock: p.minStock,
        reorderPoint: p.reorderPoint,
        avgDailySales: avgDaily,
        daysUntilStockout,
      };
    });

    const forecast = await analyzeInventoryNeeds(stockSummaries);
    res.json({ success: true, data: forecast });
  } catch (err: unknown) {
    const error = err as { message: string };
    res.status(500).json({ success: false, message: error.message });
  }
});
