import { Router } from 'express';
import * as aiController from '../controllers/aiController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.MANAGER, Role.ADMIN, Role.ANALYST));

router.post('/demand-forecast', aiController.getDemandForecast);
router.post('/recommendations/:customerId', aiController.getCustomerRecommendations);
router.post('/price-suggestions', aiController.getPriceSuggestions);
router.get('/insights', aiController.getInsights);

export default router;
