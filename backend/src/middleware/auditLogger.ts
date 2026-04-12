import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

/**
 * Records every request to the AuditLog table after the response is sent.
 * Sensitive fields (passwords, tokens) are stripped from request bodies.
 */
export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();

  res.on('finish', () => {
    const action = `${req.method} ${req.route?.path ?? req.path}`;
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      null;

    const sanitizedBody = sanitizeBody(req.body);

    prisma.auditLog
      .create({
        data: {
          userId: req.user?.userId ?? null,
          shopId: req.params.shopId ?? req.user?.shopId ?? null,
          action,
          entityType: deriveEntityType(req.path),
          entityId: req.params.id ?? req.params.productId ?? req.params.userId ?? null,
          ipAddress,
          userAgent: req.headers['user-agent'] ?? null,
          status: res.statusCode < 400 ? 'SUCCESS' : 'FAILURE',
          statusCode: res.statusCode,
          requestData: JSON.stringify(sanitizedBody),
          responseData: null,
        },
      })
      .catch((err: Error) => {
        // Never throw from audit logger
        console.error('Audit log error:', err.message);
      });

    void startedAt; // suppress unused warning
  });

  next();
}

/**
 * Removes sensitive keys from the request body before logging.
 */
function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  if (!body || typeof body !== 'object') return {};

  const SENSITIVE_KEYS = ['password', 'token', 'authToken', 'accountSid', 'secret', 'key'];
  const sanitized: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(body)) {
    sanitized[k] = SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s)) ? '[REDACTED]' : v;
  }

  return sanitized;
}

/** Derives a simple entity type label from the request path. */
function deriveEntityType(path: string): string | null {
  const segments = path.split('/').filter(Boolean);
  if (segments.includes('auth')) return 'AUTH';
  if (segments.includes('products')) return 'PRODUCT';
  if (segments.includes('customers')) return 'CUSTOMER';
  if (segments.includes('staff')) return 'STAFF';
  if (segments.includes('orders')) return 'ORDER';
  if (segments.includes('offers')) return 'OFFER';
  if (segments.includes('shops')) return 'SHOP';
  if (segments.includes('messaging')) return 'MESSAGING';
  return null;
}
