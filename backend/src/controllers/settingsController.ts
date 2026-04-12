import { Request, Response, NextFunction } from 'express';
import * as receiptService from '../services/receiptService';
import { settingsSchema, validateZod } from '../utils/validators';

export async function getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await receiptService.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updates = validateZod(settingsSchema, req.body);
    const settings = await receiptService.updateSettings(updates);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}
