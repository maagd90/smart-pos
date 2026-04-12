import { v4 as uuidv4 } from 'uuid';

export function generateReceiptNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timePart = now.getTime().toString(36).toUpperCase();
  return `RCP-${datePart}-${timePart}`;
}

export function generateId(): string {
  return uuidv4();
}

export function paginate<T>(
  items: T[],
  page: number,
  limit: number
): { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } } {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);
  return { data, pagination: { page, limit, total, totalPages } };
}

export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  excludeKeys: string[]
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !excludeKeys.includes(key))
  ) as Partial<T>;
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function calculateLoyaltyPoints(total: number, rate = 1): number {
  return Math.floor(total * rate);
}

export function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[\d\s\-()]{7,15}$/.test(phone);
}

export function dateRangeFromQuery(
  startDate?: string,
  endDate?: string
): { gte?: Date; lte?: Date } {
  const range: { gte?: Date; lte?: Date } = {};
  if (startDate) range.gte = new Date(startDate);
  if (endDate) range.lte = new Date(endDate);
  return range;
}
