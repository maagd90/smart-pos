import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

/**
 * Ensures that shop-scoped routes are only accessible by users who belong
 * to that shop (or by a PLATFORM_ADMIN).
 *
 * Expects `:shopId` param to be present on the route.
 */
export async function shopIsolation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  // Platform admins can access all shops
  if (req.user.role === 'PLATFORM_ADMIN') {
    return next();
  }

  const shopId = req.params.shopId;
  if (!shopId) {
    res.status(400).json({ message: 'Shop ID is required' });
    return;
  }

  // Verify the shop exists
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) {
    res.status(404).json({ message: 'Shop not found' });
    return;
  }

  if (shop.status === 'SUSPENDED') {
    res.status(403).json({ message: 'Shop is suspended' });
    return;
  }

  // Verify the user belongs to this shop
  if (req.user.shopId !== shopId) {
    res.status(403).json({ message: 'Access to this shop is not allowed' });
    return;
  }

  next();
}
