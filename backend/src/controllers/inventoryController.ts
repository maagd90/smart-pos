import { Request, Response, NextFunction } from 'express';
import * as inventoryService from '../services/inventoryService';
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
  validateZod,
} from '../utils/validators';

export async function getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await inventoryService.getProducts(req.query as Record<string, string>);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await inventoryService.getProductById(req.params['id']!);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateZod(createProductSchema, req.body);
    const product = await inventoryService.createProduct(dto);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateZod(updateProductSchema, req.body);
    const product = await inventoryService.updateProduct(req.params['id']!, dto);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await inventoryService.deleteProduct(req.params['id']!);
    res.json({ success: true, message: 'Product deactivated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getLowStockAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const alerts = await inventoryService.getLowStockAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    next(error);
  }
}

export async function updateStock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateZod(updateStockSchema, req.body);
    const inventory = await inventoryService.updateStock(req.params['productId']!, dto);
    res.json({ success: true, data: inventory });
  } catch (error) {
    next(error);
  }
}
