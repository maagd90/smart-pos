export type Role = 'PLATFORM_ADMIN' | 'SHOP_ADMIN' | 'MANAGER' | 'CASHIER' | 'ANALYST';
export type ShopStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
export type OfferType = 'PERCENTAGE' | 'FIXED' | 'BUY_X_GET_Y';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  shopId: string | null;
  createdAt: string;
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  status: ShopStatus;
  plan: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    products: number;
    orders: number;
    customers: number;
  };
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string | null;
  price: number;
  cost: number | null;
  stock: number;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  email: string | null;
  phone: string | null;
  totalSpent: number;
  visitCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Pick<Product, 'id' | 'name'>;
}

export interface Order {
  id: string;
  shopId: string;
  customerId: string | null;
  total: number;
  discount: number;
  tax: number;
  status: OrderStatus;
  paymentMethod: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Pick<Customer, 'id' | 'name'> | null;
  items: OrderItem[];
}

export interface MessagingConfig {
  id: string;
  shopId: string;
  provider: string;
  accountSid: string | null;
  authToken: string | null;
  whatsappNumber: string | null;
  webhookUrl: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  shopId: string;
  name: string;
  description: string | null;
  discount: number;
  type: OfferType;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Shortcut {
  id: string;
  userId: string;
  shopId: string | null;
  label: string;
  icon: string;
  path: string;
  order: number;
  custom: boolean;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  shopId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  status: string;
  statusCode: number | null;
  createdAt: string;
  user?: Pick<User, 'name' | 'email' | 'role'> | null;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: T[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}
