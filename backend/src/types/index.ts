export enum Role {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  SHOP_ADMIN = 'SHOP_ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  ANALYST = 'ANALYST',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  DIGITAL = 'DIGITAL',
}

export enum TransactionStatus {
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  PENDING = 'PENDING',
}

export interface JwtPayload {
  userId: string;
  email: string;
  shopId?: string;
  role?: Role;
}

export interface AuthenticatedRequest extends Express.Request {
  user?: JwtPayload;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
