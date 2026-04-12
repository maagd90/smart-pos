import { prisma } from '../../db/prismaClient';
import { createError } from '../../middleware/errorHandler';
import { formatCurrency, formatDate } from '../../utils/formatters';

export interface ReceiptData {
  receiptNumber: string;
  date: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    discount: number;
    subtotal: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customer?: {
    name: string;
    loyaltyPoints: number;
  };
  cashier: string;
}

export async function getReceiptData(transactionId: string): Promise<ReceiptData> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      transactionItems: { include: { product: true } },
      customer: true,
      user: true,
      receipt: true,
    },
  });

  if (!transaction) throw createError('Transaction not found', 404);

  return {
    receiptNumber: transaction.receiptNumber,
    date: formatDate(transaction.createdAt),
    items: transaction.transactionItems.map((ti) => ({
      name: ti.product.name,
      quantity: ti.quantity,
      price: ti.price,
      discount: ti.discount,
      subtotal: ti.price * ti.quantity - ti.discount,
    })),
    subtotal: transaction.subtotal,
    tax: transaction.tax,
    discount: transaction.discount,
    total: transaction.total,
    paymentMethod: transaction.paymentMethod,
    customer: transaction.customer
      ? {
          name: transaction.customer.name,
          loyaltyPoints: transaction.customer.loyaltyPoints,
        }
      : undefined,
    cashier: transaction.user.name,
  };
}

export function formatReceiptText(data: ReceiptData): string {
  const line = '─'.repeat(40);
  let text = `
${line}
         SMART POS RECEIPT
${line}
Receipt: ${data.receiptNumber}
Date:    ${data.date}
Cashier: ${data.cashier}
${line}
ITEMS:
`;
  for (const item of data.items) {
    text += `${item.name}\n`;
    text += `  ${item.quantity} x ${formatCurrency(item.price)}`;
    if (item.discount > 0) {
      text += ` - ${formatCurrency(item.discount)} discount`;
    }
    text += ` = ${formatCurrency(item.subtotal)}\n`;
  }
  text += `${line}
Subtotal: ${formatCurrency(data.subtotal)}
Tax:      ${formatCurrency(data.tax)}
Discount: ${formatCurrency(data.discount)}
TOTAL:    ${formatCurrency(data.total)}
Payment:  ${data.paymentMethod}
${line}
`;
  if (data.customer) {
    text += `Customer: ${data.customer.name}\n`;
    text += `Loyalty Points: ${data.customer.loyaltyPoints}\n`;
    text += `${line}\n`;
  }
  text += `    Thank you for your purchase!\n`;
  text += `${line}\n`;
  return text;
}
