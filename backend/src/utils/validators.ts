import { z } from 'zod';
import { Role, CustomerSegment, PaymentMethod, MessageChannel } from '@prisma/client';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.nativeEnum(Role).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  cost: z.number().min(0).optional(),
  category: z.string().min(1, 'Category is required'),
  barcode: z.string().optional(),
  imageUrl: z.string().url().optional(),
  reorderPoint: z.number().int().min(0).optional(),
  reorderQuantity: z.number().int().min(0).optional(),
  initialStock: z.number().int().min(0).optional(),
  location: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial().omit({ sku: true });

export const createTransactionSchema = z.object({
  customerId: z.string().uuid().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.number().int().positive('Quantity must be positive'),
      discount: z.number().min(0).max(100).optional(),
    })
  ).min(1, 'At least one item required'),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  discount: z.number().min(0).max(100).optional(),
  tax: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
  segment: z.nativeEnum(CustomerSegment).optional(),
  loyaltyPoints: z.number().int().min(0).optional(),
});

export const sendMessageSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  channel: z.nativeEnum(MessageChannel),
  content: z.string().min(1, 'Content is required'),
  templateId: z.string().optional(),
});

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  channel: z.nativeEnum(MessageChannel),
  content: z.string().min(1, 'Content is required'),
  targetSegment: z.nativeEnum(CustomerSegment).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.nativeEnum(Role),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export const updateStockSchema = z.object({
  quantity: z.number().int().min(0),
  operation: z.enum(['set', 'add', 'subtract']),
  location: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
});

export const settingsSchema = z.object({
  storeName: z.string().optional(),
  storeAddress: z.string().optional(),
  storePhone: z.string().optional(),
  storeEmail: z.string().email().optional(),
  currency: z.string().length(3).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  loyaltyPointsRate: z.number().min(0).optional(),
  receiptFooter: z.string().optional(),
  timezone: z.string().optional(),
});

export function validateZod<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
