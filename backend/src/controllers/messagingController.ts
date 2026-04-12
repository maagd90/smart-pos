import { Request, Response, NextFunction } from 'express';
import * as messagingService from '../services/messagingService';
import { sendMessageSchema, createCampaignSchema, validateZod } from '../utils/validators';

export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateZod(sendMessageSchema, req.body);
    const message = await messagingService.sendMessage(dto);
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
}

export async function getCampaigns(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await messagingService.getCampaigns();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function createCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateZod(createCampaignSchema, req.body);
    const result = await messagingService.createCampaign(dto);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getMessageHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await messagingService.getMessageHistory(req.query as Record<string, string>);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}
