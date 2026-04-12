import { z } from 'zod';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['PLATFORM_ADMIN', 'SHOP_ADMIN', 'MANAGER', 'CASHIER', 'ANALYST']),
  shopId: z.string().cuid().optional(),
});

// ─── Shop ─────────────────────────────────────────────────────────────────────

export const createShopSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  plan: z.string().optional(),
});

export const updateShopSchema = createShopSchema
  .partial()
  .extend({ status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional() });

// ─── Staff ────────────────────────────────────────────────────────────────────

export const createStaffSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
  role: z.enum(['SHOP_ADMIN', 'MANAGER', 'CASHIER', 'ANALYST']),
});

export const updateStaffSchema = createStaffSchema.partial().omit({ password: true }).extend({
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .optional(),
});

// ─── Product ──────────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive('Price must be positive'),
  cost: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  sku: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  imageUrl: z.string().url().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

// ─── Customer ─────────────────────────────────────────────────────────────────

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ─── Order ────────────────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  customerId: z.string().cuid().optional(),
  discount: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  paymentMethod: z.string().max(50).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
      })
    )
    .min(1, 'Order must have at least one item'),
});

// ─── Messaging ────────────────────────────────────────────────────────────────

export const messagingConfigSchema = z.object({
  accountSid: z.string().min(1).max(100),
  authToken: z.string().min(1).max(100),
  whatsappNumber: z.string().min(1).max(20),
  webhookUrl: z.string().url().max(500).optional(),
});

export const testMessageSchema = z.object({
  to: z.string().min(1).max(20),
  message: z.string().min(1).max(1000),
});

// ─── Offer ────────────────────────────────────────────────────────────────────

export const createOfferSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  discount: z.number().positive(),
  type: z.enum(['PERCENTAGE', 'FIXED', 'BUY_X_GET_Y']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

export const updateOfferSchema = createOfferSchema.partial();

// ─── Shortcut ─────────────────────────────────────────────────────────────────

export const createShortcutSchema = z.object({
  label: z.string().min(1).max(100),
  icon: z.string().min(1).max(50),
  path: z.string().min(1).max(500),
  order: z.number().int().nonnegative().optional(),
});

export const updateShortcutSchema = createShortcutSchema.partial();
