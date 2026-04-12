import db from '../database/db';

interface Message {
  id: number;
  customer_id: number;
  content: string;
  type: string;
  status: string;
  ai_generated: number;
  created_at: string;
}

export function saveMessage(
  customerId: number,
  content: string,
  type: string,
  aiGenerated: boolean,
  status: string = 'pending'
): Message {
  const stmt = db.prepare(`
    INSERT INTO messages (customer_id, content, type, status, ai_generated)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(customerId, content, type, status, aiGenerated ? 1 : 0);
  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid) as Message;
  return message;
}

export function sendMessage(messageId: number): Message {
  db.prepare(`UPDATE messages SET status = 'sent' WHERE id = ?`).run(messageId);
  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId) as Message;
  return message;
}

export function getCustomerMessages(customerId: number): Message[] {
  return db.prepare(`
    SELECT m.*, c.name as customer_name
    FROM messages m
    JOIN customers c ON m.customer_id = c.id
    WHERE m.customer_id = ?
    ORDER BY m.created_at DESC
  `).all(customerId) as Message[];
}

export function getAllMessages(): Message[] {
  return db.prepare(`
    SELECT m.*, c.name as customer_name
    FROM messages m
    JOIN customers c ON m.customer_id = c.id
    ORDER BY m.created_at DESC
  `).all() as Message[];
}
