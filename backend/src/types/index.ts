import { Role, CustomerSegment, PaymentMethod, TransactionStatus, MessageChannel, MessageStatus, AIAnalyticsType } from '@prisma/client';
import { Request } from 'express';

export { Role, CustomerSegment, PaymentMethod, TransactionStatus, MessageChannel, MessageStatus, AIAnalyticsType };

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  ip: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface CreateTransactionDto {
  customerId?: string;
  items: CreateTransactionItemDto[];
  paymentMethod?: PaymentMethod;
  discount?: number;
  tax?: number;
  notes?: string;
}

export interface CreateTransactionItemDto {
  productId: string;
  quantity: number;
  discount?: number;
}

export interface CreateProductDto {
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost?: number;
  category: string;
  barcode?: string;
  imageUrl?: string;
  reorderPoint?: number;
  reorderQuantity?: number;
  initialStock?: number;
  location?: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  cost?: number;
  category?: string;
  barcode?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateStockDto {
  quantity: number;
  operation: 'set' | 'add' | 'subtract';
  location?: string;
  batchNumber?: string;
  expiryDate?: string;
}

export interface CreateCustomerDto {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  segment?: CustomerSegment;
  loyaltyPoints?: number;
}

export interface SendMessageDto {
  customerId: string;
  channel: MessageChannel;
  content: string;
  templateId?: string;
}

export interface CreateCampaignDto {
  name: string;
  channel: MessageChannel;
  content: string;
  targetSegment?: CustomerSegment;
  scheduledAt?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: Role;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: Role;
  isActive?: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface DemandForecastDto {
  productId?: string;
  category?: string;
  days?: number;
}

export interface PriceSuggestionDto {
  productId: string;
  targetMargin?: number;
  competitorPrices?: number[];
}

export interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  totalCustomers: number;
  lowStockItems: number;
  topProducts: Array<{ name: string; sku: string; totalSold: number; revenue: number }>;
  recentTransactions: Array<{
    id: string;
    receiptNumber: string;
    total: number;
    paymentMethod: string;
    createdAt: Date;
    customerName?: string;
  }>;
  salesByDay: Array<{ date: string; total: number; count: number }>;
}

export interface SalesReport {
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  byPaymentMethod: Array<{ method: string; count: number; total: number }>;
  byDay: Array<{ date: string; total: number; count: number }>;
}

export interface InventoryReport {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  items: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    reorderPoint: number;
    value: number;
    status: 'ok' | 'low' | 'out';
  }>;
}

export interface AppSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  currency: string;
  taxRate: number;
  loyaltyPointsRate: number;
  receiptFooter: string;
  timezone: string;
}

export interface SocketEvents {
  TRANSACTION_CREATED: string;
  STOCK_UPDATED: string;
  LOW_STOCK_ALERT: string;
  MESSAGE_SENT: string;
  AI_ANALYSIS_COMPLETE: string;
}
