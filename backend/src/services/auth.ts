import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { JwtPayload, Role } from '../types';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required');
  return jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(): string {
  return uuidv4();
}

export function verifyAccessToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required');
  return jwt.verify(token, secret) as JwtPayload;
}

export async function loginUser(
  prisma: PrismaClient,
  email: string,
  password: string,
  shopId?: string
): Promise<{ accessToken: string; refreshToken: string; user: object }> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    throw new Error('Invalid credentials');
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new Error('Account is temporarily locked. Please try again later.');
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    const newFailedAttempts = user.failedLoginAttempts + 1;
    const updateData: {
      failedLoginAttempts: number;
      lockedUntil?: Date;
    } = { failedLoginAttempts: newFailedAttempts };

    if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCK_DURATION_MINUTES);
      updateData.lockedUntil = lockedUntil;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    throw new Error('Invalid credentials');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  let role: Role | undefined;
  if (shopId) {
    const shopUser = await prisma.shopUser.findUnique({
      where: { shopId_userId: { shopId, userId: user.id } },
    });
    role = shopUser?.role as Role | undefined;
  }

  const jwtPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    shopId,
    role,
  };

  const accessToken = generateAccessToken(jwtPayload);
  const refreshToken = generateRefreshToken();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role,
    },
  };
}

export async function refreshAccessToken(
  prisma: PrismaClient,
  refreshToken: string
): Promise<{ accessToken: string }> {
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
    throw new Error('Invalid or expired refresh token');
  }

  if (!tokenRecord.user.isActive) {
    throw new Error('User account is inactive');
  }

  const jwtPayload: JwtPayload = {
    userId: tokenRecord.user.id,
    email: tokenRecord.user.email,
  };

  const accessToken = generateAccessToken(jwtPayload);
  return { accessToken };
}

export async function revokeRefreshToken(
  prisma: PrismaClient,
  refreshToken: string
): Promise<void> {
  await prisma.refreshToken.update({
    where: { token: refreshToken },
    data: { isRevoked: true },
  });
}
