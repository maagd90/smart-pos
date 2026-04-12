import { prisma } from '../config/database';
import { AppSettings } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  storeName: 'Smart POS Store',
  storeAddress: '123 Main Street',
  storePhone: '+1234567890',
  storeEmail: 'store@example.com',
  currency: 'USD',
  taxRate: 8.5,
  loyaltyPointsRate: 1,
  receiptFooter: 'Thank you for your purchase!',
  timezone: 'UTC',
};

export async function getSettings(): Promise<AppSettings> {
  const record = await prisma.settings.findUnique({ where: { key: 'store' } });
  if (!record) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(record.value as Partial<AppSettings>) };
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const merged = { ...current, ...updates };

  await prisma.settings.upsert({
    where: { key: 'store' },
    create: { key: 'store', value: merged },
    update: { value: merged },
  });

  return merged;
}
