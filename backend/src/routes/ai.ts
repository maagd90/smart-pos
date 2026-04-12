import { Router, Request, Response } from 'express';
import db from '../database/db';
import * as aiService from '../services/aiService';
import { saveMessage } from '../services/messageService';

const router = Router();

router.post('/analyze-demand', async (_req: Request, res: Response) => {
  try {
    const salesData = db.prepare(`
      SELECT p.name as product_name, p.category, si.quantity, si.total_price,
             s.created_at as sale_date
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at >= datetime('now', '-30 days')
      ORDER BY s.created_at DESC
    `).all() as Parameters<typeof aiService.analyzeDemand>[0];

    const analysis = await aiService.analyzeDemand(salesData);
    res.json({ analysis, data_points: salesData.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze demand' });
  }
});

router.post('/customer-insights/:customerId', async (req: Request, res: Response) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.customerId) as Parameters<typeof aiService.getCustomerInsights>[0] | undefined;
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const purchases = db.prepare(`
      SELECT p.name as product_name, p.category, si.quantity, si.total_price,
             s.created_at as sale_date
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.customer_id = ?
      ORDER BY s.created_at DESC
    `).all(req.params.customerId) as Parameters<typeof aiService.getCustomerInsights>[1];

    const insights = await aiService.getCustomerInsights(customer, purchases);
    res.json({ insights, purchase_count: purchases.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get customer insights' });
  }
});

router.post('/deal-recommendations', async (_req: Request, res: Response) => {
  try {
    const inventory = db.prepare('SELECT * FROM products ORDER BY quantity ASC').all() as Parameters<typeof aiService.getDealRecommendations>[0];
    const salesData = db.prepare(`
      SELECT p.name as product_name, p.category, si.quantity, si.total_price,
             s.created_at as sale_date
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at >= datetime('now', '-30 days')
    `).all() as Parameters<typeof aiService.getDealRecommendations>[1];

    const recommendations = await aiService.getDealRecommendations(inventory, salesData);
    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get deal recommendations' });
  }
});

router.post('/generate-message/:customerId', async (req: Request, res: Response) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.customerId) as Parameters<typeof aiService.generateCustomerMessage>[0] | undefined;
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const { deal_type = 'promotion', save = false } = req.body;

    const purchases = db.prepare(`
      SELECT p.name as product_name, p.category, si.quantity, si.total_price,
             s.created_at as sale_date
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.customer_id = ?
      ORDER BY s.created_at DESC LIMIT 10
    `).all(req.params.customerId) as Parameters<typeof aiService.getCustomerInsights>[1];

    const insights = await aiService.getCustomerInsights(customer, purchases);
    const message = await aiService.generateCustomerMessage(customer, insights, deal_type);

    let savedMessage = null;
    if (save) {
      savedMessage = saveMessage(
        parseInt(req.params.customerId),
        message,
        deal_type,
        true,
        'pending'
      );
    }

    res.json({ message, saved: savedMessage });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate message' });
  }
});

export default router;
