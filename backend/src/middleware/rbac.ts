import { Request, Response, NextFunction } from 'express';

type RoleOrRoles = string | string[];

/**
 * Middleware factory that checks the authenticated user has one of the
 * allowed roles.  Must be used AFTER the `authenticate` middleware.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

/**
 * Checks if the user is a PLATFORM_ADMIN.
 */
export function requirePlatformAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'PLATFORM_ADMIN') {
    res.status(403).json({ message: 'Platform admin access required' });
    return;
  }

  next();
}

/**
 * Checks if the user is a SHOP_ADMIN or PLATFORM_ADMIN.
 */
export function requireShopAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const allowed: RoleOrRoles = ['PLATFORM_ADMIN', 'SHOP_ADMIN'];
  if (!allowed.includes(req.user.role)) {
    res.status(403).json({ message: 'Shop admin access required' });
    return;
  }

  next();
}

/**
 * Checks that the user can access managerial resources (SHOP_ADMIN, MANAGER, PLATFORM_ADMIN).
 */
export function requireManager(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const allowed: RoleOrRoles = ['PLATFORM_ADMIN', 'SHOP_ADMIN', 'MANAGER'];
  if (!allowed.includes(req.user.role)) {
    res.status(403).json({ message: 'Manager or higher access required' });
    return;
  }

  next();
}
