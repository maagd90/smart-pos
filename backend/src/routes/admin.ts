import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN, Role.MANAGER));

router.get('/dashboard', adminController.getDashboard);
router.get('/customers', adminController.getAdminCustomers);
router.get('/users', authorize(Role.ADMIN), adminController.getUsers);
router.post('/users', authorize(Role.ADMIN), adminController.createUser);
router.put('/users/:id', authorize(Role.ADMIN), adminController.updateUser);
router.get('/reports/sales', adminController.getSalesReport);
router.get('/reports/inventory', adminController.getInventoryReport);

export default router;
