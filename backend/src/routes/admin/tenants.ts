import { Router, Response } from 'express';
import { body, param, query } from 'express-validator';
import { PrismaClient, TenantStatus } from '@prisma/client';
import { handleValidationErrors } from '../../middleware/validation';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../types';
import {
  createTenant,
  listTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
  getTenantStatus,
} from '../../services/tenantService';
import { runTenantSetup } from '../../services/setupService';

const router = Router();
const prisma = new PrismaClient();

// POST /api/admin/tenants
router.post(
  '/',
  authenticate,
  requireRole(Role.PLATFORM_ADMIN),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('adminEmail').isEmail().withMessage('Valid admin email is required'),
    body('adminName').trim().notEmpty().withMessage('Admin name is required'),
    body('domain').optional().isString(),
    body('subscriptionPlan').optional().isIn(['FREE', 'PRO', 'ENTERPRISE']),
    body('maxStaff').optional().isInt({ min: 1, max: 1000 }),
    body('ipWhitelist').optional().isArray(),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenant = await createTenant(prisma, req.body);

      // Run setup asynchronously (non-blocking)
      runTenantSetup(prisma, tenant.id).catch((err) => {
        console.error('[TenantSetup] Background setup failed:', err.message);
      });

      res.status(201).json({ success: true, data: tenant });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create tenant';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// GET /api/admin/tenants
router.get(
  '/',
  authenticate,
  requireRole(Role.PLATFORM_ADMIN),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['CREATING', 'ACTIVE', 'SUSPENDED', 'FAILED']),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as TenantStatus | undefined;
      const result = await listTenants(prisma, page, limit, status);
      res.json({ success: true, data: result });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// GET /api/admin/tenants/:id
router.get(
  '/:id',
  authenticate,
  requireRole(Role.PLATFORM_ADMIN),
  [param('id').notEmpty()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenant = await getTenantById(prisma, req.params.id);
      if (!tenant) {
        res.status(404).json({ success: false, error: 'Tenant not found' });
        return;
      }
      res.json({ success: true, data: tenant });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// GET /api/admin/tenants/:id/status
router.get(
  '/:id/status',
  authenticate,
  requireRole(Role.PLATFORM_ADMIN),
  [param('id').notEmpty()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const status = await getTenantStatus(prisma, req.params.id);
      res.json({ success: true, data: status });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(404).json({ success: false, error: message });
    }
  }
);

// PUT /api/admin/tenants/:id
router.put(
  '/:id',
  authenticate,
  requireRole(Role.PLATFORM_ADMIN),
  [
    param('id').notEmpty(),
    body('name').optional().trim().notEmpty(),
    body('adminEmail').optional().isEmail(),
    body('ipWhitelist').optional().isArray(),
    body('status').optional().isIn(['ACTIVE', 'SUSPENDED', 'FAILED']),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenant = await updateTenant(prisma, req.params.id, req.body);
      res.json({ success: true, data: tenant });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update tenant';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// DELETE /api/admin/tenants/:id
router.delete(
  '/:id',
  authenticate,
  requireRole(Role.PLATFORM_ADMIN),
  [param('id').notEmpty()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await deleteTenant(prisma, req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete tenant';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// POST /api/admin/tenants/:id/retry
router.post(
  '/:id/retry',
  authenticate,
  requireRole(Role.PLATFORM_ADMIN),
  [param('id').notEmpty()],
  handleValidationErrors,
  async (req: AuthRequest, res: Response) => {
    try {
      const tenant = await getTenantById(prisma, req.params.id);
      if (!tenant) {
        res.status(404).json({ success: false, error: 'Tenant not found' });
        return;
      }
      if (tenant.status !== 'FAILED') {
        res.status(400).json({ success: false, error: 'Only failed tenants can be retried' });
        return;
      }
      await prisma.tenant.update({ where: { id: req.params.id }, data: { status: 'CREATING' } });
      await prisma.tenantSetup.update({
        where: { tenantId: req.params.id },
        data: { errorMessage: null, currentStep: 'CREATE_RECORD', steps: [] },
      });

      runTenantSetup(prisma, req.params.id).catch((err) => {
        console.error('[TenantSetup] Retry setup failed:', err.message);
      });

      res.json({ success: true, data: { message: 'Retry started' } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retry';
      res.status(400).json({ success: false, error: message });
    }
  }
);

export default router;
