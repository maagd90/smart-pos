import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

type Role = 'OWNER' | 'MANAGER' | 'CASHIER' | 'ANALYST';

const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 4,
  MANAGER: 3,
  ANALYST: 2,
  CASHIER: 1,
};

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function requireMinRole(minRole: Role) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const userLevel = ROLE_HIERARCHY[req.user.role as Role] ?? 0;
    const required = ROLE_HIERARCHY[minRole];
    if (userLevel < required) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
