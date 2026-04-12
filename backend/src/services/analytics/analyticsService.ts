import { prisma } from '../../db/prismaClient';

export async function getDashboardData(startDate?: Date, endDate?: Date) {
  const end = endDate ?? new Date();
  const start = startDate ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalRevenue,
    transactionCount,
    customerCount,
    topProducts,
    revenueByDay,
    paymentMethods,
    lowStockCount,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { createdAt: { gte: start, lte: end }, paymentStatus: 'COMPLETED' },
      _sum: { total: true },
      _avg: { total: true },
    }),
    prisma.transaction.count({
      where: { createdAt: { gte: start, lte: end }, paymentStatus: 'COMPLETED' },
    }),
    prisma.customer.count(),
    prisma.transactionItem.groupBy({
      by: ['productId'],
      where: { transaction: { createdAt: { gte: start, lte: end }, paymentStatus: 'COMPLETED' } },
      _sum: { quantity: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    }),
    prisma.$queryRaw<Array<{ day: Date; revenue: number; count: bigint }>>`
      SELECT DATE_TRUNC('day', "createdAt") as day,
             SUM(total) as revenue,
             COUNT(*) as count
      FROM transactions
      WHERE "createdAt" >= ${start}
        AND "createdAt" <= ${end}
        AND "paymentStatus" = 'COMPLETED'
      GROUP BY day
      ORDER BY day
    `,
    prisma.transaction.groupBy({
      by: ['paymentMethod'],
      where: { createdAt: { gte: start, lte: end }, paymentStatus: 'COMPLETED' },
      _count: true,
      _sum: { total: true },
    }),
    prisma.product.count({
      where: { isActive: true, stock: { lte: 5 } },
    }),
  ]);

  // Enrich top products with names
  const productIds = topProducts.map((tp) => tp.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, category: true },
  });

  const enrichedTopProducts = topProducts.map((tp) => {
    const p = products.find((pr) => pr.id === tp.productId);
    return {
      productId: tp.productId,
      name: p?.name ?? 'Unknown',
      category: p?.category ?? '',
      quantitySold: tp._sum.quantity ?? 0,
    };
  });

  return {
    revenue: {
      total: totalRevenue._sum.total ?? 0,
      average: totalRevenue._avg.total ?? 0,
    },
    transactions: transactionCount,
    customers: customerCount,
    topProducts: enrichedTopProducts,
    revenueByDay: revenueByDay.map((r) => ({
      day: r.day,
      revenue: Number(r.revenue),
      count: Number(r.count),
    })),
    paymentMethods,
    lowStockCount,
  };
}

export async function getSalesAnalytics(startDate: Date, endDate: Date) {
  const transactions = await prisma.transaction.findMany({
    where: { createdAt: { gte: startDate, lte: endDate }, paymentStatus: 'COMPLETED' },
    select: { total: true, subtotal: true, tax: true, discount: true, paymentMethod: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const totalRevenue = transactions.reduce((s, t) => s + t.total, 0);
  const totalDiscount = transactions.reduce((s, t) => s + t.discount, 0);
  const totalTax = transactions.reduce((s, t) => s + t.tax, 0);

  return {
    totalRevenue,
    totalDiscount,
    totalTax,
    transactionCount: transactions.length,
    avgTransactionValue: transactions.length > 0 ? totalRevenue / transactions.length : 0,
    transactions,
  };
}

export async function getProductAnalytics(startDate: Date, endDate: Date) {
  const items = await prisma.transactionItem.findMany({
    where: { transaction: { createdAt: { gte: startDate, lte: endDate }, paymentStatus: 'COMPLETED' } },
    include: { product: { select: { name: true, category: true, price: true } } },
  });

  const byProduct: Record<string, { name: string; category: string; qty: number; revenue: number }> = {};
  for (const item of items) {
    if (!byProduct[item.productId]) {
      byProduct[item.productId] = {
        name: item.product.name,
        category: item.product.category,
        qty: 0,
        revenue: 0,
      };
    }
    byProduct[item.productId].qty += item.quantity;
    byProduct[item.productId].revenue += item.price * item.quantity - item.discount;
  }

  return Object.entries(byProduct)
    .map(([id, data]) => ({ productId: id, ...data }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getCustomerAnalytics() {
  const segments = await prisma.customer.groupBy({
    by: ['segment'],
    _count: true,
    _sum: { totalSpent: true },
  });

  const newThisMonth = await prisma.customer.count({
    where: { createdAt: { gte: new Date(new Date().setDate(1)) } },
  });

  return { segments, newThisMonth };
}

export async function getInventoryHealth() {
  const [total, lowStock, outOfStock, expiringProducts] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, stock: { lte: 10, gt: 0 } } }),
    prisma.product.count({ where: { isActive: true, stock: 0 } }),
    prisma.product.findMany({
      where: {
        isActive: true,
        expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gte: new Date() },
      },
      select: { id: true, name: true, expiryDate: true, stock: true },
    }),
  ]);

  return { total, lowStock, outOfStock, expiringProducts };
}

export async function getMessagingMetrics(startDate: Date, endDate: Date) {
  const messages = await prisma.message.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    select: { channel: true, status: true },
  });

  const byChannel: Record<string, { sent: number; failed: number; delivered: number }> = {};
  for (const msg of messages) {
    if (!byChannel[msg.channel]) byChannel[msg.channel] = { sent: 0, failed: 0, delivered: 0 };
    if (msg.status === 'SENT' || msg.status === 'DELIVERED' || msg.status === 'READ') {
      byChannel[msg.channel].sent++;
    }
    if (msg.status === 'FAILED') byChannel[msg.channel].failed++;
    if (msg.status === 'DELIVERED' || msg.status === 'READ') byChannel[msg.channel].delivered++;
  }

  return { total: messages.length, byChannel };
}

export async function getStaffPerformance(startDate: Date, endDate: Date) {
  const transactions = await prisma.transaction.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: startDate, lte: endDate }, paymentStatus: 'COMPLETED' },
    _count: true,
    _sum: { total: true },
  });

  const userIds = transactions.map((t) => t.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, role: true },
  });

  return transactions.map((t) => {
    const user = users.find((u) => u.id === t.userId);
    return {
      userId: t.userId,
      name: user?.name ?? 'Unknown',
      role: user?.role ?? 'CASHIER',
      transactionCount: t._count,
      totalRevenue: t._sum.total ?? 0,
    };
  });
}
