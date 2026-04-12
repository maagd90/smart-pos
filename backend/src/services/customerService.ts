import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  PaginationQuery,
  PaginatedResponse,
} from '../types';
import { CustomerSegment, Prisma } from '@prisma/client';

export async function getCustomers(
  query: PaginationQuery & { segment?: CustomerSegment }
): Promise<PaginatedResponse<object>> {
  const page = parseInt(query.page ?? '1', 10);
  const limit = parseInt(query.limit ?? '20', 10);
  const skip = (page - 1) * limit;

  const where: Prisma.CustomerWhereInput = {};
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.segment) where.segment = query.segment;

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { transactions: true, messages: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getCustomerById(id: string): Promise<object> {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      _count: { select: { transactions: true, messages: true } },
    },
  });
  if (!customer) throw new AppError('Customer not found', 404);
  return customer;
}

export async function createCustomer(dto: CreateCustomerDto): Promise<object> {
  if (dto.email) {
    const existing = await prisma.customer.findFirst({ where: { email: dto.email } });
    if (existing) throw new AppError('Customer with this email already exists', 409);
  }
  if (dto.phone) {
    const existing = await prisma.customer.findFirst({ where: { phone: dto.phone } });
    if (existing) throw new AppError('Customer with this phone already exists', 409);
  }

  return prisma.customer.create({ data: dto });
}

export async function updateCustomer(id: string, dto: UpdateCustomerDto): Promise<object> {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw new AppError('Customer not found', 404);

  return prisma.customer.update({ where: { id }, data: dto });
}

export async function getCustomerTransactions(
  customerId: string,
  query: PaginationQuery
): Promise<PaginatedResponse<object>> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new AppError('Customer not found', 404);

  const page = parseInt(query.page ?? '1', 10);
  const limit = parseInt(query.limit ?? '20', 10);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { customerId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { select: { id: true, name: true } } } },
        cashier: { select: { id: true, name: true } },
      },
    }),
    prisma.transaction.count({ where: { customerId } }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getCustomerMessages(
  customerId: string,
  query: PaginationQuery
): Promise<PaginatedResponse<object>> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new AppError('Customer not found', 404);

  const page = parseInt(query.page ?? '1', 10);
  const limit = parseInt(query.limit ?? '20', 10);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.message.findMany({
      where: { customerId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.message.count({ where: { customerId } }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function updateCustomerSegments(): Promise<void> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Mark inactive customers (no purchase in 90 days)
  await prisma.customer.updateMany({
    where: {
      lastPurchaseAt: { lt: ninetyDaysAgo },
      segment: { not: CustomerSegment.INACTIVE },
    },
    data: { segment: CustomerSegment.INACTIVE },
  });

  // Mark active purchasers as REGULAR
  await prisma.customer.updateMany({
    where: {
      lastPurchaseAt: { gte: thirtyDaysAgo },
      segment: CustomerSegment.INACTIVE,
    },
    data: { segment: CustomerSegment.REGULAR },
  });

  // Mark high-loyalty as VIP (1000+ points)
  await prisma.customer.updateMany({
    where: { loyaltyPoints: { gte: 1000 }, segment: { not: CustomerSegment.VIP } },
    data: { segment: CustomerSegment.VIP },
  });
}
