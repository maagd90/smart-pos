import { Router } from 'express';
import * as posController from '../controllers/posController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/transactions', posController.getTransactions);
router.post('/transactions', authorize(Role.CASHIER, Role.MANAGER, Role.ADMIN), posController.createTransaction);
router.get('/transactions/:id', posController.getTransactionById);
router.post('/transactions/:id/refund', authorize(Role.MANAGER, Role.ADMIN), posController.refundTransaction);
router.get('/receipt/:id', posController.getReceipt);

export default router;
