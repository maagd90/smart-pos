import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { AuthenticatedRequest } from '../types';
import { loginSchema, registerSchema, validateZod } from '../utils/validators';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateZod(loginSchema, req.body);
    const result = await authService.login(dto);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateZod(registerSchema, req.body);
    const result = await authService.register(dto);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  // JWT is stateless; client discards token
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = await authService.getMe(authReq.user!.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}
