import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { shopIsolation } from '../middleware/shopIsolation';
import { requireShopAdmin } from '../middleware/rbac';
import { encrypt, decryptNullable } from '../services/encryption';
import { messagingConfigSchema, testMessageSchema } from '../services/validation';

const router = Router({ mergeParams: true });

router.use(authenticate, shopIsolation);

/**
 * GET /api/shops/:shopId/messaging
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await prisma.messagingConfig.findUnique({
      where: { shopId: req.params.shopId },
    });

    if (!config) {
      res.json({ config: null });
      return;
    }

    // Return masked credentials
    res.json({
      config: {
        ...config,
        accountSid: config.accountSid ? '***' + config.accountSid.slice(-4) : null,
        authToken: config.authToken ? '[REDACTED]' : null,
      },
    });
  } catch (err) {
    console.error('Get messaging config error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/shops/:shopId/messaging/configure
 */
router.post(
  '/configure',
  requireShopAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = messagingConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
      return;
    }

    try {
      const { accountSid, authToken, whatsappNumber, webhookUrl } = parsed.data;

      const config = await prisma.messagingConfig.upsert({
        where: { shopId: req.params.shopId },
        create: {
          shopId: req.params.shopId,
          accountSid: encrypt(accountSid),
          authToken: encrypt(authToken),
          whatsappNumber,
          webhookUrl,
          enabled: true,
        },
        update: {
          accountSid: encrypt(accountSid),
          authToken: encrypt(authToken),
          whatsappNumber,
          webhookUrl,
          enabled: true,
        },
      });

      res.json({
        config: {
          ...config,
          accountSid: '***' + accountSid.slice(-4),
          authToken: '[REDACTED]',
        },
        message: 'Messaging configured successfully',
      });
    } catch (err) {
      console.error('Configure messaging error:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * POST /api/shops/:shopId/messaging/test
 * Send a test WhatsApp message using Twilio.
 */
router.post('/test', requireShopAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = testMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
    return;
  }

  try {
    const config = await prisma.messagingConfig.findUnique({
      where: { shopId: req.params.shopId },
    });

    if (!config || !config.enabled) {
      res.status(400).json({ message: 'Messaging is not configured' });
      return;
    }

    const accountSid = decryptNullable(config.accountSid);
    const authToken = decryptNullable(config.authToken);

    if (!accountSid || !authToken || !config.whatsappNumber) {
      res.status(400).json({ message: 'Messaging credentials are incomplete' });
      return;
    }

    // Dynamically import twilio to avoid loading it when not needed
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);

    await client.messages.create({
      from: `whatsapp:${config.whatsappNumber}`,
      to: `whatsapp:${parsed.data.to}`,
      body: parsed.data.message,
    });

    res.json({ message: 'Test message sent successfully' });
  } catch (err) {
    console.error('Test message error:', err);
    res.status(500).json({ message: 'Failed to send test message' });
  }
});

export default router;
