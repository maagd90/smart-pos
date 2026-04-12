import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  shopId: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Verifies the Bearer JWT in the Authorization header.
 * Also checks the token against the blacklist.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    // Check token blacklist
    const blacklisted = await prisma.tokenBlacklist.findUnique({ where: { token } });
    if (blacklisted) {
      res.status(401).json({ message: 'Token has been revoked' });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired' });
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    next(err);
  }
}

/** Optionally attaches user if token is present, but does not block the request. */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return next();

    const blacklisted = await prisma.tokenBlacklist.findUnique({ where: { token } });
    if (blacklisted) return next();

    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
}
