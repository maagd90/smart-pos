import { v4 as uuidv4 } from 'uuid';

export function generateReceiptNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCP-${timestamp}-${random}`;
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function calculateLoyaltyPoints(amount: number): number {
  return Math.floor(amount);
}

export function getPaginationParams(
  page: unknown,
  limit: unknown,
  defaultLimit = 20
): { skip: number; take: number; page: number; limit: number } {
  const p = Math.max(1, parseInt(String(page || '1'), 10));
  const l = Math.min(100, Math.max(1, parseInt(String(limit || String(defaultLimit)), 10)));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}

export function generateSku(): string {
  return `SKU-${uuidv4().substring(0, 8).toUpperCase()}`;
}

export function daysBetween(date1: Date, date2: Date): number {
  const diff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean } {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
