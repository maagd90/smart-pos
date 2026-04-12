import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/products', inventoryController.getProducts);
router.post('/products', authorize(Role.MANAGER, Role.ADMIN), inventoryController.createProduct);
router.get('/products/:id', inventoryController.getProductById);
router.put('/products/:id', authorize(Role.MANAGER, Role.ADMIN), inventoryController.updateProduct);
router.delete('/products/:id', authorize(Role.ADMIN), inventoryController.deleteProduct);
router.get('/alerts', inventoryController.getLowStockAlerts);
router.put('/stock/:productId', authorize(Role.MANAGER, Role.ADMIN), inventoryController.updateStock);

export default router;
