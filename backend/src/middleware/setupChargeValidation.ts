import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export type SetupChargeStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

const VALID_STATUSES: SetupChargeStatus[] = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

export function validateSetupChargeStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const { status } = req.body;
  if (status !== undefined) {
    if (typeof status !== 'string' || !VALID_STATUSES.includes(status as SetupChargeStatus)) {
      res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
      return;
    }
  }
  next();
}

export function validateGatewayName(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const gatewayName = req.params.gatewayName || req.body.gatewayName;
  if (!gatewayName || typeof gatewayName !== 'string' || gatewayName.trim().length === 0) {
    res.status(400).json({ success: false, error: 'Gateway name is required' });
    return;
  }
  const validPattern = /^[a-z0-9_-]+$/;
  if (!validPattern.test(gatewayName)) {
    res.status(400).json({
      success: false,
      error: 'Gateway name must contain only lowercase letters, numbers, hyphens, and underscores',
    });
    return;
  }
  next();
}

export function validateSetupFee(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const { setupFee } = req.body;
  if (setupFee !== undefined) {
    const fee = Number(setupFee);
    if (isNaN(fee) || fee < 0) {
      res.status(400).json({ success: false, error: 'Setup fee must be a non-negative number' });
      return;
    }
  }
  next();
}
