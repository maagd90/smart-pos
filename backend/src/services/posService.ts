import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { CreateTransactionDto, PaginationQuery, PaginatedResponse } from '../types';
import { PaymentMethod, TransactionStatus } from '@prisma/client';
import { generateReceiptNumber } from '../utils/helpers';

export async function createTransaction(
  dto: CreateTransactionDto,
  cashierId: string
): Promise<object> {
  if (!dto.items || dto.items.length === 0) {
    throw new AppError('Transaction must have at least one item', 400);
  }

  // Fetch all products
  const productIds = dto.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: { inventory: true },
  });

  if (products.length !== dto.items.length) {
    throw new AppError('One or more products not found or inactive', 400);
  }

  // Validate stock
  for (const item of dto.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) throw new AppError(`Product ${item.productId} not found`, 400);
    const available = product.inventory?.quantity ?? 0;
    if (available < item.quantity) {
      throw new AppError(`Insufficient stock for product: ${product.name}`, 400);
    }
  }

  // Calculate totals
  let subtotal = 0;
  const itemsWithTotals = dto.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    const itemDiscount = item.discount ?? 0;
    const itemTotal = product.price * item.quantity * (1 - itemDiscount / 100);
    subtotal += itemTotal;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price,
      discount: itemDiscount,
      total: itemTotal,
    };
  });

  const discount = dto.discount ?? 0;
  const taxRate = dto.tax ?? 0;
  const discountedSubtotal = subtotal * (1 - discount / 100);
  const tax = discountedSubtotal * (taxRate / 100);
  const total = discountedSubtotal + tax;
  const receiptNumber = generateReceiptNumber();

  const transaction = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        customerId: dto.customerId ?? null,
        cashierId,
        total,
        subtotal,
        tax,
        discount,
        paymentMethod: dto.paymentMethod ?? PaymentMethod.CASH,
        status: TransactionStatus.COMPLETED,
        notes: dto.notes ?? null,
        receiptNumber,
        items: {
          create: itemsWithTotals,
        },
      },
      include: {
        items: { include: { product: true } },
        customer: true,
        cashier: { select: { id: true, name: true, email: true } },
      },
    });

    // Deduct stock
    for (const item of dto.items) {
      await tx.inventory.update({
        where: { productId: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    // Update customer last purchase and loyalty points
    if (dto.customerId) {
      const pointsEarned = Math.floor(total);
      await tx.customer.update({
        where: { id: dto.customerId },
        data: {
          lastPurchaseAt: new Date(),
          loyaltyPoints: { increment: pointsEarned },
        },
      });
    }

    return created;
  });

  return transaction;
}

export async function getTransactions(
  query: PaginationQuery & { startDate?: string; endDate?: string; cashierId?: string }
): Promise<PaginatedResponse<object>> {
  const page = parseInt(query.page ?? '1', 10);
  const limit = parseInt(query.limit ?? '20', 10);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.startDate) where['createdAt'] = { gte: new Date(query.startDate) };
  if (query.endDate) {
    where['createdAt'] = {
      ...(where['createdAt'] as object ?? {}),
      lte: new Date(query.endDate),
    };
  }
  if (query.cashierId) where['cashierId'] = query.cashierId;

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getTransactionById(id: string): Promise<object> {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      customer: true,
      cashier: { select: { id: true, name: true, email: true } },
      items: { include: { product: true } },
    },
  });
  if (!transaction) throw new AppError('Transaction not found', 404);
  return transaction;
}

export async function refundTransaction(
  id: string,
  itemIds?: string[]
): Promise<object> {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!transaction) throw new AppError('Transaction not found', 404);
  if (transaction.status === TransactionStatus.REFUNDED) {
    throw new AppError('Transaction already refunded', 400);
  }

  const isPartial = itemIds && itemIds.length > 0 && itemIds.length < transaction.items.length;
  const status = isPartial ? TransactionStatus.PARTIAL_REFUND : TransactionStatus.REFUNDED;

  const itemsToRefund = itemIds
    ? transaction.items.filter((i) => itemIds.includes(i.id))
    : transaction.items;

  const updated = await prisma.$transaction(async (tx) => {
    // Restore stock
    for (const item of itemsToRefund) {
      await tx.inventory.update({
        where: { productId: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
    }

    return tx.transaction.update({
      where: { id },
      data: { status },
      include: {
        items: { include: { product: true } },
        customer: true,
        cashier: { select: { id: true, name: true } },
      },
    });
  });

  return updated;
}

export async function getReceipt(id: string): Promise<object> {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      customer: true,
      cashier: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
  });
  if (!transaction) throw new AppError('Transaction not found', 404);

  const settings = await prisma.settings.findUnique({ where: { key: 'store' } });
  const storeData = settings?.value as Record<string, unknown> ?? {};

  return {
    receiptNumber: transaction.receiptNumber,
    store: storeData,
    transaction,
    generatedAt: new Date(),
  };
}
