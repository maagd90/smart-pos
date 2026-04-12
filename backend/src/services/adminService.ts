import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { CreateUserDto, UpdateUserDto, PaginationQuery, PaginatedResponse, DashboardStats, SalesReport } from '../types';
import { Role } from '@prisma/client';
import { hashPassword } from './authService';
import { Prisma } from '@prisma/client';

export async function getDashboardStats(): Promise<DashboardStats> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [todaySalesAgg, totalCustomers, lowStockItems, recentTransactions, topProductsRaw, salesByDayRaw] =
    await Promise.all([
      prisma.transaction.aggregate({
        where: { createdAt: { gte: todayStart }, status: { not: 'REFUNDED' } },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.customer.count(),
      prisma.inventory.count({
        where: { quantity: { lte: 10 }, product: { isActive: true } },
      }),
      prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { customer: { select: { name: true } } },
      }),
      prisma.transactionItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
      prisma.$queryRaw<Array<{ date: string; total: number; count: bigint }>>`
        SELECT DATE(created_at)::text as date, SUM(total) as total, COUNT(id) as count
        FROM transactions
        WHERE created_at >= ${sevenDaysAgo} AND status != 'REFUNDED'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    ]);

  const productIds = topProductsRaw.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true },
  });

  const topProducts = topProductsRaw.map((p) => {
    const product = products.find((pr) => pr.id === p.productId);
    return {
      name: product?.name ?? '',
      sku: product?.sku ?? '',
      totalSold: p._sum.quantity ?? 0,
      revenue: p._sum.total ?? 0,
    };
  });

  return {
    todaySales: todaySalesAgg._sum.total ?? 0,
    todayTransactions: todaySalesAgg._count.id,
    totalCustomers,
    lowStockItems,
    topProducts,
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      receiptNumber: t.receiptNumber,
      total: t.total,
      paymentMethod: t.paymentMethod,
      createdAt: t.createdAt,
      customerName: t.customer?.name,
    })),
    salesByDay: salesByDayRaw.map((row) => ({
      date: row.date,
      total: Number(row.total),
      count: Number(row.count),
    })),
  };
}

export async function getUsers(query: PaginationQuery): Promise<PaginatedResponse<object>> {
  const page = parseInt(query.page ?? '1', 10);
  const limit = parseInt(query.limit ?? '20', 10);
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createUser(dto: CreateUserDto): Promise<object> {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw new AppError('Email already registered', 409);

  const hashed = await hashPassword(dto.password);
  return prisma.user.create({
    data: { ...dto, password: hashed },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });
}

export async function updateUser(id: string, dto: UpdateUserDto): Promise<object> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('User not found', 404);

  return prisma.user.update({
    where: { id },
    data: dto,
    select: { id: true, email: true, name: true, role: true, isActive: true, updatedAt: true },
  });
}

export async function getSalesReport(startDate: string, endDate: string): Promise<SalesReport> {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new AppError('Invalid date range', 400);
  }

  const [transactions, byPaymentMethod, topItemsRaw, salesByDay] = await Promise.all([
    prisma.transaction.aggregate({
      where: { createdAt: { gte: start, lte: end }, status: { not: 'REFUNDED' } },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.transaction.groupBy({
      by: ['paymentMethod'],
      where: { createdAt: { gte: start, lte: end }, status: { not: 'REFUNDED' } },
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.transactionItem.groupBy({
      by: ['productId'],
      where: { transaction: { createdAt: { gte: start, lte: end }, status: { not: 'REFUNDED' } } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10,
    }),
    prisma.$queryRaw<Array<{ date: string; total: number; count: bigint }>>`
      SELECT DATE(created_at)::text as date, SUM(total) as total, COUNT(id) as count
      FROM transactions
      WHERE created_at >= ${start} AND created_at <= ${end} AND status != 'REFUNDED'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
  ]);

  const productIds = topItemsRaw.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });

  const totalRevenue = transactions._sum.total ?? 0;
  const totalTxn = transactions._count.id;

  return {
    startDate: start,
    endDate: end,
    totalRevenue,
    totalTransactions: totalTxn,
    averageOrderValue: totalTxn > 0 ? totalRevenue / totalTxn : 0,
    topProducts: topItemsRaw.map((p) => ({
      name: products.find((pr) => pr.id === p.productId)?.name ?? '',
      quantity: p._sum.quantity ?? 0,
      revenue: p._sum.total ?? 0,
    })),
    byPaymentMethod: byPaymentMethod.map((p) => ({
      method: p.paymentMethod,
      count: p._count.id,
      total: p._sum.total ?? 0,
    })),
    byDay: salesByDay.map((row) => ({
      date: row.date,
      total: Number(row.total),
      count: Number(row.count),
    })),
  };
}

export async function getAdminCustomers(query: PaginationQuery): Promise<PaginatedResponse<object>> {
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

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { transactions: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
