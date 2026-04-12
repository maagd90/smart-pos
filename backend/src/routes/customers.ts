import { Router, Request, Response } from 'express';
import db from '../database/db';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params: string[] = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY created_at DESC';

    const customers = db.prepare(query).all(...params);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

router.get('/:id/purchases', (req: Request, res: Response) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const purchases = db.prepare(`
      SELECT s.id as sale_id, s.total_amount, s.payment_method, s.created_at,
             p.name as product_name, p.category, si.quantity, si.unit_price, si.total_price
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      WHERE s.customer_id = ?
      ORDER BY s.created_at DESC
    `).all(req.params.id);

    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer purchases' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { name, email, phone, address } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO customers (name, email, phone, address)
      VALUES (?, ?, ?, ?)
    `).run(name, email ?? null, phone ?? null, address ?? null);

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(customer);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const { name, email, phone, address } = req.body;
    db.prepare(`
      UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?
    `).run(name, email, phone, address, req.params.id);

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    res.json(customer);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;
