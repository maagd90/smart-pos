import { prisma } from '../../db/prismaClient';
import { createError } from '../../middleware/errorHandler';
import { io } from '../../index';

export async function adjustStock(
  productId: string,
  userId: string,
  type: 'ADDITION' | 'SUBTRACTION' | 'WASTE' | 'CORRECTION',
  quantity: number,
  reason?: string
) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw createError('Product not found', 404);

  const delta =
    type === 'ADDITION'
      ? quantity
      : type === 'SUBTRACTION' || type === 'WASTE'
      ? -quantity
      : quantity - product.stock; // CORRECTION sets absolute quantity

  const newStock = product.stock + delta;
  if (newStock < 0) throw createError('Stock cannot go below 0', 400);

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    await tx.stockAdjustment.create({
      data: { productId, userId, type, quantity, reason },
    });
  });

  const updated = await prisma.product.findUnique({ where: { id: productId } });
  if (updated) {
    io.emit('inventory:update', {
      productId: updated.id,
      name: updated.name,
      stock: updated.stock,
    });

    if (updated.stock <= updated.minStock) {
      io.emit('alert:low-stock', {
        productId: updated.id,
        name: updated.name,
        stock: updated.stock,
        minStock: updated.minStock,
      });
    }
  }

  return updated;
}

export async function getLowStockAlerts() {
  return prisma.product.findMany({
    where: {
      isActive: true,
      stock: { lte: prisma.product.fields.minStock as unknown as number },
    },
    orderBy: { stock: 'asc' },
  });
}

export async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, sku: true, stock: true, minStock: true, reorderPoint: true, category: true },
  });
  return products.filter((p) => p.stock <= p.minStock);
}
