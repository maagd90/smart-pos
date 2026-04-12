import { prisma } from '../../db/prismaClient';
import { createError } from '../../middleware/errorHandler';
import { generateReceiptNumber } from '../../utils/formatters';
import { io } from '../../index';

export interface TransactionItemInput {
  productId: string;
  quantity: number;
  price?: number;
  discount?: number;
}

export interface CreateTransactionInput {
  customerId?: string;
  userId: string;
  machineId?: string;
  items: TransactionItemInput[];
  paymentMethod: 'CASH' | 'CARD' | 'DIGITAL_WALLET';
  tax?: number;
  discount?: number;
  notes?: string;
}

export async function createTransaction(input: CreateTransactionInput) {
  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  if (products.length !== productIds.length) {
    throw createError('One or more products not found or inactive', 400);
  }

  // Validate stock and compute prices
  const itemsWithPrice = input.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) throw createError(`Product ${item.productId} not found`, 400);
    if (product.stock < item.quantity) {
      throw createError(`Insufficient stock for ${product.name}`, 400);
    }
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: item.price ?? product.price,
      discount: item.discount ?? 0,
      productName: product.name,
    };
  });

  const subtotal = itemsWithPrice.reduce(
    (sum, i) => sum + i.price * i.quantity - i.discount,
    0
  );
  const tax = input.tax ?? 0;
  const discount = input.discount ?? 0;
  const total = subtotal + tax - discount;
  const receiptNumber = generateReceiptNumber();

  const transaction = await prisma.$transaction(async (tx) => {
    // Create transaction
    const t = await tx.transaction.create({
      data: {
        receiptNumber,
        customerId: input.customerId,
        userId: input.userId,
        machineId: input.machineId,
        items: itemsWithPrice as unknown as Parameters<typeof tx.transaction.create>[0]['data']['items'],
        subtotal,
        tax,
        discount,
        total,
        paymentMethod: input.paymentMethod,
        paymentStatus: 'COMPLETED',
        notes: input.notes,
      },
    });

    // Create transaction items and decrement stock
    for (const item of itemsWithPrice) {
      await tx.transactionItem.create({
        data: {
          transactionId: t.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
        },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Create receipt
    await tx.receipt.create({
      data: { transactionId: t.id, receiptNumber },
    });

    // Update customer if provided
    if (input.customerId) {
      await tx.customer.update({
        where: { id: input.customerId },
        data: {
          totalSpent: { increment: total },
          visitCount: { increment: 1 },
          loyaltyPoints: { increment: Math.floor(total) },
          lastVisit: new Date(),
        },
      });
    }

    return t;
  });

  // Emit real-time event
  try {
    io.emit('transaction:new', { transactionId: transaction.id, total, receiptNumber });

    // Check low stock after transaction
    for (const item of itemsWithPrice) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product && product.stock <= product.minStock) {
        io.emit('alert:low-stock', {
          productId: product.id,
          name: product.name,
          stock: product.stock,
          minStock: product.minStock,
        });
      }
    }
  } catch {
    // Socket errors should not fail the transaction
  }

  return transaction;
}

export async function refundTransaction(transactionId: string, reason?: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { transactionItems: true },
  });

  if (!transaction) throw createError('Transaction not found', 404);
  if (transaction.paymentStatus === 'REFUNDED') {
    throw createError('Transaction already refunded', 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transactionId },
      data: { paymentStatus: 'REFUNDED', notes: reason },
    });

    // Restore stock
    for (const item of transaction.transactionItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    // Reverse loyalty points if customer linked
    if (transaction.customerId) {
      await tx.customer.update({
        where: { id: transaction.customerId },
        data: {
          totalSpent: { decrement: transaction.total },
          loyaltyPoints: { decrement: Math.floor(transaction.total) },
          visitCount: { decrement: 1 },
        },
      });
    }
  });

  return { success: true };
}
