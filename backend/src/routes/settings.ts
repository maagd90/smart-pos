import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', settingsController.getSettings);
router.put('/', authorize(Role.ADMIN), settingsController.updateSettings);

export default router;
