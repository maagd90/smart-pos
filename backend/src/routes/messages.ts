import { Router, Request, Response } from 'express';
import { saveMessage, sendMessage, getCustomerMessages, getAllMessages } from '../services/messageService';
import db from '../database/db';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  try {
    const messages = getAllMessages();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.get('/:customerId', (req: Request, res: Response) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.customerId);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const messages = getCustomerMessages(parseInt(req.params.customerId));
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/send/:customerId', (req: Request, res: Response) => {
  try {
    const { content, type = 'promotion', ai_generated = false } = req.body;
    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.customerId);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const message = saveMessage(
      parseInt(req.params.customerId),
      content,
      type,
      ai_generated,
      'sent'
    );
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.put('/:id/status', (req: Request, res: Response) => {
  try {
    const message = sendMessage(parseInt(req.params.id));
    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

export default router;
