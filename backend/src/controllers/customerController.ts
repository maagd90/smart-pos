import { Request, Response, NextFunction } from 'express';
import * as customerService from '../services/customerService';
import {
  createCustomerSchema,
  updateCustomerSchema,
  validateZod,
} from '../utils/validators';

export async function getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await customerService.getCustomers(req.query as Record<string, string>);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const customer = await customerService.getCustomerById(req.params['id']!);
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
}

export async function createCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateZod(createCustomerSchema, req.body);
    const customer = await customerService.createCustomer(dto);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateZod(updateCustomerSchema, req.body);
    const customer = await customerService.updateCustomer(req.params['id']!, dto);
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await customerService.getCustomerTransactions(
      req.params['id']!,
      req.query as Record<string, string>
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await customerService.getCustomerMessages(
      req.params['id']!,
      req.query as Record<string, string>
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}
