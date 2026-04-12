import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db/prismaClient';
import { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS } from '../../utils/constants';
import { createError } from '../../middleware/errorHandler';

export interface LoginResult {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw createError('Invalid credentials', 401);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw createError('Invalid credentials', 401);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: string
): Promise<{ id: string; email: string; name: string; role: string }> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw createError('Email already in use', 409);
  }

  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name,
      role: role as 'OWNER' | 'MANAGER' | 'CASHIER' | 'ANALYST',
    },
    select: { id: true, email: true, name: true, role: true },
  });

  return user;
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw createError('User not found', 404);

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw createError('Current password is incorrect', 400);

  const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
}
