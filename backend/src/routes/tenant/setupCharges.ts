import { Router, Response } from 'express';
import { param, query } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { handleValidationErrors } from '../../middleware/validation';
import { authenticate, AuthRequest } from '../../middleware/auth';
import {
  getAvailableGateways,
  enableGateway,
  markSetupFeePaid,
  getSetupChargeHistory,
  calculateRemainingSetupFees,
} from '../../services/setupChargeService';

const router = Router();
const prisma = new PrismaClient();

// GET /api/tenant/gateways/available
router.get(
  '/gateways/available',
  authenticate,
  async (_req: AuthRequest, res: Response) => {
    try {
      const gateways = await getAvailableGateways(prisma);
      res.json({ success: true, data: gateways });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// GET /api/tenant/setup-charges?tenantId=xxx
router.get(
  '/setup-charges',
  authenticate,
  [query('tenantId').notEmpty().withMessage('tenantId is required')],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.query.tenantId as string;
      const charges = await getSetupChargeHistory(prisma, tenantId);
      res.json({ success: true, data: charges });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(404).json({ success: false, error: message });
    }
  }
);

// POST /api/tenant/gateways/:gatewayName/enable
router.post(
  '/gateways/:gatewayName/enable',
  authenticate,
  [
    param('gatewayName').notEmpty(),
    query('tenantId').notEmpty().withMessage('tenantId is required'),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.query.tenantId as string;
      const charge = await enableGateway(prisma, tenantId, req.params.gatewayName);
      res.status(201).json({ success: true, data: charge });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to enable gateway';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// POST /api/tenant/setup-charges/:chargeId/pay
router.post(
  '/setup-charges/:chargeId/pay',
  authenticate,
  [param('chargeId').notEmpty()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const charge = await markSetupFeePaid(prisma, req.params.chargeId);
      res.json({ success: true, data: charge });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark charge as paid';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// GET /api/tenant/revenue/summary?tenantId=xxx
router.get(
  '/revenue/summary',
  authenticate,
  [query('tenantId').notEmpty().withMessage('tenantId is required')],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.query.tenantId as string;
      const summary = await calculateRemainingSetupFees(prisma, tenantId);
      res.json({ success: true, data: summary });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(404).json({ success: false, error: message });
    }
  }
);

export default router;
