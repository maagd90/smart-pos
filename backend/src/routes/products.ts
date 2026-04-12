import { Router, Request, Response } from 'express';
import db from '../database/db';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params: (string | number)[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category as string);
    }
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY created_at DESC';

    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, price, cost, quantity, category, image_url } = req.body;
    if (!name || price === undefined) {
      res.status(400).json({ error: 'Name and price are required' });
      return;
    }
    const result = db.prepare(`
      INSERT INTO products (name, description, price, cost, quantity, category, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, description ?? null, price, cost ?? 0, quantity ?? 0, category ?? null, image_url ?? null);

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const { name, description, price, cost, quantity, category, image_url } = req.body;
    db.prepare(`
      UPDATE products SET name = ?, description = ?, price = ?, cost = ?, quantity = ?,
      category = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(name, description, price, cost, quantity, category, image_url, req.params.id);

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
