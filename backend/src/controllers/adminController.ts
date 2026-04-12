import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/adminService';
import { createUserSchema, updateUserSchema, validateZod } from '../utils/validators';

export async function getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await adminService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getAdminCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await adminService.getAdminCustomers(req.query as Record<string, string>);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await adminService.getUsers(req.query as Record<string, string>);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateZod(createUserSchema, req.body);
    const user = await adminService.createUser(dto);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateZod(updateUserSchema, req.body);
    const user = await adminService.updateUser(req.params['id']!, dto);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function getSalesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const now = new Date();
    const start = startDate ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = endDate ?? now.toISOString();
    const report = await adminService.getSalesReport(start, end);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function getInventoryReport(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { getInventoryReport } = await import('../services/inventoryService');
    const report = await getInventoryReport();
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}
