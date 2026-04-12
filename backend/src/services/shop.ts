import { PrismaClient } from '@prisma/client';
import { Role } from '../types';

export async function createShop(
  prisma: PrismaClient,
  data: { name: string; slug: string },
  adminUserId: string
): Promise<object> {
  const existing = await prisma.shop.findUnique({ where: { slug: data.slug } });
  if (existing) throw new Error('Shop with this slug already exists');

  const shop = await prisma.shop.create({ data });

  await prisma.shopUser.create({
    data: {
      shopId: shop.id,
      userId: adminUserId,
      role: 'SHOP_ADMIN' as Role,
    },
  });

  return shop;
}

export async function getShopById(
  prisma: PrismaClient,
  shopId: string
): Promise<object | null> {
  return prisma.shop.findUnique({
    where: { id: shopId },
    include: { users: { include: { user: true } } },
  });
}

export async function updateShop(
  prisma: PrismaClient,
  shopId: string,
  data: { name?: string; isActive?: boolean }
): Promise<object> {
  return prisma.shop.update({
    where: { id: shopId },
    data,
  });
}

export async function listShops(
  prisma: PrismaClient,
  page = 1,
  limit = 20
): Promise<{ shops: object[]; total: number }> {
  const skip = (page - 1) * limit;
  const [shops, total] = await Promise.all([
    prisma.shop.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.shop.count(),
  ]);
  return { shops, total };
}
