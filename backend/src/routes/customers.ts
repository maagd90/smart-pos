import { Router } from 'express';
import * as customerController from '../controllers/customerController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', customerController.getCustomers);
router.post('/', authorize(Role.CASHIER, Role.MANAGER, Role.ADMIN), customerController.createCustomer);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', authorize(Role.MANAGER, Role.ADMIN), customerController.updateCustomer);
router.get('/:id/transactions', customerController.getCustomerTransactions);
router.get('/:id/messages', customerController.getCustomerMessages);

export default router;
