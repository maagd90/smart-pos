import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/environment';
import { AppError } from '../middleware/errorHandler';
import { JwtPayload, LoginDto, RegisterDto } from '../types';
import { Role } from '@prisma/client';

const SALT_ROUNDS = 12;

export async function login(dto: LoginDto): Promise<{ token: string; user: object }> {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401);
  }

  const passwordMatch = await bcrypt.compare(dto.password, user.password);
  if (!passwordMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
  const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export async function register(dto: RegisterDto): Promise<{ token: string; user: object }> {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      role: dto.role ?? Role.CASHIER,
    },
  });

  const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
  const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export async function getMe(userId: string): Promise<object> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw new AppError('Current password is incorrect', 400);

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
}
