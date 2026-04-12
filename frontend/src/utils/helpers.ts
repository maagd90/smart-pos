import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { CustomerSegment, PaymentMethod, TransactionStatus, MessageStatus, MessageChannel } from '../types';

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatDate(dateStr: string, fmt = 'MMM dd, yyyy'): string {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM dd, yyyy HH:mm');
  } catch {
    return dateStr;
  }
}

export function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function segmentColor(segment: CustomerSegment): string {
  const map: Record<CustomerSegment, string> = {
    VIP: 'bg-purple-100 text-purple-800',
    REGULAR: 'bg-blue-100 text-blue-800',
    INACTIVE: 'bg-gray-100 text-gray-600',
    NEW: 'bg-green-100 text-green-800',
  };
  return map[segment] ?? 'bg-gray-100 text-gray-600';
}

export function paymentMethodLabel(method: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    CASH: 'Cash',
    CARD: 'Card',
    DIGITAL_WALLET: 'Digital Wallet',
  };
  return map[method] ?? method;
}

export function transactionStatusColor(status: TransactionStatus): string {
  const map: Record<TransactionStatus, string> = {
    COMPLETED: 'bg-green-100 text-green-800',
    REFUNDED: 'bg-yellow-100 text-yellow-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

export function messageStatusColor(status: MessageStatus): string {
  const map: Record<MessageStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    SENT: 'bg-blue-100 text-blue-800',
    DELIVERED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

export function channelIcon(channel: MessageChannel): string {
  const map: Record<MessageChannel, string> = {
    SMS: '📱',
    WHATSAPP: '💬',
    EMAIL: '📧',
  };
  return map[channel] ?? '📨';
}

export function truncate(str: string, len = 50): string {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function stockStatusColor(quantity: number, reorderPoint: number): string {
  if (quantity === 0) return 'text-red-600 bg-red-50';
  if (quantity <= reorderPoint) return 'text-yellow-600 bg-yellow-50';
  return 'text-green-600 bg-green-50';
}

export function stockStatusLabel(quantity: number, reorderPoint: number): string {
  if (quantity === 0) return 'Out of Stock';
  if (quantity <= reorderPoint) return 'Low Stock';
  return 'In Stock';
}
