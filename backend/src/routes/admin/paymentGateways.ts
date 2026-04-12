import { Router, Response } from 'express';
import { body, param, query } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { handleValidationErrors } from '../../middleware/validation';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../types';
import {
  getAllPricings,
  updateGatewayPricing,
  toggleGatewayAvailability,
  createNewGateway,
} from '../../services/paymentGatewayPricingService';
import {
  getAdminRevenue,
  listAllSetupCharges,
  getSetupChargeHistory,
} from '../../services/setupChargeService';

const router = Router();
const prisma = new PrismaClient();

// GET /api/admin/payment-gateways
router.get(
  '/',
  authenticate,
  requireRole(Role.PLATFORM_ADMIN),
  async (_req: AuthRequest, res: Response) => {
    try {
      const pricings = await getAllPricings(prisma);
      res.json({ success: true, data: pricings });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// POST /api/admin/payment-gateways
router.post(
  '/',
  authenticate,
  requireRole(Role.PLATFORM_ADMIN),
  [
    body('gatewayName').trim().notEmpty().withMessage('Gateway name is required'),
    body('displayName').trim().notEmpty().withMessage('Display name is required'),
    body('setupFee').isFloat({ min: 0 }).withMessage('Setup fee must be a non-negative number'),
    body('description').optional().isString(),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const { gatewayName, displayName, setupFee, description } = req.body;
      const pricing = await createNewGateway(prisma, gatewayName, displayName, setupFee, description);
      res.status(201).json({ success: true, data: pricing });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create gateway';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// PUT /api/admin/payment-gateways/:gatewayName
router.put(
  '/:gatewayName',
  authenticate,
  requireRole(Role.PLATFORM_ADMIN),
  [
    param('gatewayName').notEmpty(),
    body('setupFee').optional().isFloat({ min: 0 }).withMessage('Setup fee must be a non-negative number'),
    body('isAvailable').optional().isBoolean(),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const { gatewayName } = req.params;
      const { setupFee, isAvailable } = req.body;

      if (typeof setupFee !== 'number' && typeof isAvailable !== 'boolean') {
        res.status(400).json({ success: false, error: 'No valid fields to update' });
        return;
      }

      let result;
      if (typeof setupFee === 'number') {
        result = await updateGatewayPricing(prisma, gatewayName, setupFee);
      }
      if (typeof isAvailable === 'boolean') {
        result = await toggleGatewayAvailability(prisma, gatewayName, isAvailable);
      }
      res.json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update gateway';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// GET /api/admin/revenue/summary
router.get(
  '/revenue/summary',
  authenticate,
  requireRole(Role.PLATFORM_ADMIN),
  [
    query('year').isInt({ min: 2000, max: 2100 }).withMessage('Valid year is required'),
    query('month').isInt({ min: 1, max: 12 }).withMessage('Valid month (1-12) is required'),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const year = parseInt(req.query.year as string);
      const month = parseInt(req.query.month as string);
      const summary = await getAdminRevenue(prisma, year, month);
      res.json({ success: true, data: summary });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// GET /api/admin/revenue/by-gateway
router.get(
  '/revenue/by-gateway',
  authenticate,
  requireRole(Role.PLATFORM_ADMIN),
  async (_req: AuthRequest, res: Response) => {
    try {
      const charges = await listAllSetupCharges(prisma, 'PAID');
      const byGateway: Record<string, number> = {};
      for (const charge of charges) {
        byGateway[charge.gatewayName] = (byGateway[charge.gatewayName] || 0) + charge.setupFee;
      }
      res.json({ success: true, data: byGateway });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// GET /api/admin/payment-gateways/tenants/:tenantId/setup-charges
router.get(
  '/tenants/:tenantId/setup-charges',
  authenticate,
  requireRole(Role.PLATFORM_ADMIN),
  [param('tenantId').notEmpty()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const charges = await getSetupChargeHistory(prisma, req.params.tenantId);
      res.json({ success: true, data: charges });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(404).json({ success: false, error: message });
    }
  }
);

// GET /api/admin/payment-gateways/setup-charges
router.get(
  '/setup-charges',
  authenticate,
  requireRole(Role.PLATFORM_ADMIN),
  [
    query('status').optional().isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED']),
    query('tenantId').optional().isString(),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const tenantId = req.query.tenantId as string | undefined;
      const charges = await listAllSetupCharges(prisma, status, tenantId);
      res.json({ success: true, data: charges });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
