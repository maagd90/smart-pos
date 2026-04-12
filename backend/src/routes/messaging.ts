import { Router } from 'express';
import * as messagingController from '../controllers/messagingController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.MANAGER, Role.ADMIN));

router.post('/send', messagingController.sendMessage);
router.get('/campaigns', messagingController.getCampaigns);
router.post('/campaigns', messagingController.createCampaign);
router.get('/history', messagingController.getMessageHistory);

export default router;
