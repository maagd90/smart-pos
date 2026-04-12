// Enums matching backend Prisma schema
export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER';
export type CustomerSegment = 'VIP' | 'REGULAR' | 'INACTIVE' | 'NEW';
export type PaymentMethod = 'CASH' | 'CARD' | 'DIGITAL_WALLET';
export type TransactionStatus = 'COMPLETED' | 'REFUNDED' | 'CANCELLED';
export type MessageChannel = 'SMS' | 'WHATSAPP' | 'EMAIL';
export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';

// Auth
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Product / Inventory
export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost?: number;
  category: string;
  barcode?: string;
  imageUrl?: string;
  isActive: boolean;
  reorderPoint: number;
  reorderQuantity: number;
  createdAt: string;
  updatedAt: string;
  stock?: StockItem;
}

export interface StockItem {
  id: string;
  productId: string;
  quantity: number;
  location?: string;
  batchNumber?: string;
  expiryDate?: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost?: number;
  category: string;
  barcode?: string;
  reorderPoint?: number;
  reorderQuantity?: number;
  initialStock?: number;
  location?: string;
}

export interface UpdateStockData {
  quantity: number;
  operation: 'set' | 'add' | 'subtract';
  location?: string;
  batchNumber?: string;
  expiryDate?: string;
}

export interface LowStockAlert {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  reorderPoint: number;
}

// Customer
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  segment: CustomerSegment;
  loyaltyPoints: number;
  totalSpent: number;
  visitCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerData {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface UpdateCustomerData {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  segment?: CustomerSegment;
  loyaltyPoints?: number;
}

// POS / Transactions
export interface CartItemType {
  product: Product;
  quantity: number;
  discount: number;
  unitPrice: number;
}

export interface TransactionItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  receiptNumber: string;
  customerId?: string;
  customer?: Customer;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  notes?: string;
  createdAt: string;
  cashierName?: string;
}

export interface CreateTransactionData {
  customerId?: string;
  items: { productId: string; quantity: number; discount?: number }[];
  paymentMethod?: PaymentMethod;
  discount?: number;
  tax?: number;
  notes?: string;
}

// Messaging
export interface Message {
  id: string;
  customerId: string;
  customer?: Customer;
  channel: MessageChannel;
  content: string;
  status: MessageStatus;
  sentAt?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  channel: MessageChannel;
  content: string;
  targetSegment?: CustomerSegment;
  scheduledAt?: string;
  sentCount: number;
  status: string;
  createdAt: string;
}

export interface CreateCampaignData {
  name: string;
  channel: MessageChannel;
  content: string;
  targetSegment?: CustomerSegment;
  scheduledAt?: string;
}

export interface SendMessageData {
  customerId: string;
  channel: MessageChannel;
  content: string;
  templateId?: string;
}

// Admin / Dashboard
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
    createdAt: string;
    customerName?: string;
  }>;
  salesByDay: Array<{ date: string; total: number; count: number }>;
}

export interface SalesReport {
  startDate: string;
  endDate: string;
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

// Settings
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

export interface FeatureFlags {
  aiEnabled: boolean;
  messagingEnabled: boolean;
  loyaltyEnabled: boolean;
  analyticsEnabled: boolean;
}

// Pagination
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// AI
export interface AIInsight {
  type: string;
  title: string;
  description: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: Role;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: Role;
  isActive?: boolean;
}
