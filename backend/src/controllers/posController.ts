import { Request, Response, NextFunction } from 'express';
import * as posService from '../services/posService';
import { AuthenticatedRequest } from '../types';
import { createTransactionSchema, validateZod } from '../utils/validators';

export async function getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await posService.getTransactions(req.query as Record<string, string>);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const dto = validateZod(createTransactionSchema, req.body);
    const transaction = await posService.createTransaction(dto, authReq.user!.userId);
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
}

export async function getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const transaction = await posService.getTransactionById(req.params['id']!);
    res.json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
}

export async function refundTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { itemIds } = req.body as { itemIds?: string[] };
    const transaction = await posService.refundTransaction(req.params['id']!, itemIds);
    res.json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
}

export async function getReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const receipt = await posService.getReceipt(req.params['id']!);
    res.json({ success: true, data: receipt });
  } catch (error) {
    next(error);
  }
}
