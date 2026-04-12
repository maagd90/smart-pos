import { Router } from 'express';
import authRoutes from './auth';
import posRoutes from './pos';
import inventoryRoutes from './inventory';
import customerRoutes from './customers';
import aiRoutes from './ai';
import messagingRoutes from './messaging';
import adminRoutes from './admin';
import settingsRoutes from './settings';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/pos', posRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/customers', customerRoutes);
router.use('/ai', aiRoutes);
router.use('/messaging', messagingRoutes);
router.use('/admin', adminRoutes);
router.use('/settings', settingsRoutes);

export default router;
