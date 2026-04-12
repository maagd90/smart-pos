import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { Role } from '../types';

const roleHierarchy: Record<Role, number> = {
  [Role.PLATFORM_ADMIN]: 5,
  [Role.SHOP_ADMIN]: 4,
  [Role.MANAGER]: 3,
  [Role.CASHIER]: 2,
  [Role.ANALYST]: 1,
};

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const userRole = req.user.role;
    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

export function requireMinRole(minRole: Role) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const userRole = req.user.role;
    if (!userRole || roleHierarchy[userRole] < roleHierarchy[minRole]) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
