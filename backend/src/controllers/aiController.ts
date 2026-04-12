import { Request, Response, NextFunction } from 'express';
import * as aiService from '../services/aiService';
import { validateZod } from '../utils/validators';
import { z } from 'zod';

const demandForecastSchema = z.object({
  productId: z.string().uuid().optional(),
  category: z.string().optional(),
  days: z.number().int().min(1).max(365).optional(),
});

const priceSuggestionSchema = z.object({
  productId: z.string().uuid(),
  targetMargin: z.number().min(0).max(100).optional(),
  competitorPrices: z.array(z.number().positive()).optional(),
});

export async function getDemandForecast(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateZod(demandForecastSchema, req.body);
    const result = await aiService.getDemandForecast(dto);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await aiService.getCustomerRecommendations(req.params['customerId']!);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getPriceSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateZod(priceSuggestionSchema, req.body);
    const result = await aiService.getPriceSuggestions(dto);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getInsights(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await aiService.getInsights();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
