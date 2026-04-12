import { Router, Request, Response } from 'express';
import db from '../database/db';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { customer_id, from, to, limit = '50' } = req.query;
    let query = `
      SELECT s.*, c.name as customer_name,
             COUNT(si.id) as item_count
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (customer_id) {
      query += ' AND s.customer_id = ?';
      params.push(customer_id as string);
    }
    if (from) {
      query += ' AND s.created_at >= ?';
      params.push(from as string);
    }
    if (to) {
      query += ' AND s.created_at <= ?';
      params.push(to as string);
    }

    query += ' GROUP BY s.id ORDER BY s.created_at DESC LIMIT ?';
    params.push(parseInt(limit as string));

    const sales = db.prepare(query).all(...params);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

router.get('/stats/dashboard', (req: Request, res: Response) => {
  try {
    const totalRevenue = (db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales').get() as { total: number }).total;
    const totalSales = (db.prepare('SELECT COUNT(*) as count FROM sales').get() as { count: number }).count;
    const totalCustomers = (db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number }).count;
    const totalProducts = (db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }).count;

    const revenueToday = (db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM sales
      WHERE date(created_at) = date('now')
    `).get() as { total: number }).total;

    const topProducts = db.prepare(`
      SELECT p.name, p.category, SUM(si.quantity) as units_sold, SUM(si.total_price) as revenue
      FROM sale_items si JOIN products p ON si.product_id = p.id
      GROUP BY p.id ORDER BY units_sold DESC LIMIT 5
    `).all();

    const recentSales = db.prepare(`
      SELECT s.*, c.name as customer_name FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC LIMIT 5
    `).all();

    const lowStockProducts = db.prepare(`
      SELECT * FROM products WHERE quantity < 20 ORDER BY quantity ASC
    `).all();

    res.json({
      totalRevenue,
      revenueToday,
      totalSales,
      totalCustomers,
      totalProducts,
      topProducts,
      recentSales,
      lowStockProducts,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const sale = db.prepare(`
      SELECT s.*, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!sale) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    const items = db.prepare(`
      SELECT si.*, p.name as product_name, p.category
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `).all(req.params.id);

    res.json({ ...(sale as object), items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sale' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { customer_id, payment_method, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Sale must include at least one item' });
      return;
    }

    const createSale = db.transaction(() => {
      let totalAmount = 0;
      const resolvedItems: { product_id: number; quantity: number; unit_price: number; total_price: number }[] = [];

      for (const item of items) {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id) as { id: number; price: number; quantity: number } | undefined;
        if (!product) throw new Error(`Product ${item.product_id} not found`);
        if (product.quantity < item.quantity) throw new Error(`Insufficient stock for product ${item.product_id}`);

        const unitPrice = item.unit_price ?? product.price;
        const totalPrice = unitPrice * item.quantity;
        totalAmount += totalPrice;

        resolvedItems.push({ product_id: item.product_id, quantity: item.quantity, unit_price: unitPrice, total_price: totalPrice });

        db.prepare('UPDATE products SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(item.quantity, item.product_id);
      }

      const saleResult = db.prepare(`
        INSERT INTO sales (customer_id, total_amount, payment_method)
        VALUES (?, ?, ?)
      `).run(customer_id ?? null, totalAmount, payment_method ?? 'cash');

      const saleId = saleResult.lastInsertRowid;

      for (const item of resolvedItems) {
        db.prepare(`
          INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?)
        `).run(saleId, item.product_id, item.quantity, item.unit_price, item.total_price);
      }

      return db.prepare(`
        SELECT s.*, c.name as customer_name
        FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.id = ?
      `).get(saleId);
    });

    const sale = createSale();
    const saleWithItems = sale as { id: number };
    const items_result = db.prepare(`
      SELECT si.*, p.name as product_name FROM sale_items si
      JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?
    `).all(saleWithItems.id);

    res.status(201).json({ ...saleWithItems, items: items_result });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('Insufficient')) {
        res.status(400).json({ error: error.message });
        return;
      }
    }
    res.status(500).json({ error: 'Failed to create sale' });
  }
});

export default router;
