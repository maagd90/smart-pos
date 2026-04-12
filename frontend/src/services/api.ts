import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'ANALYST';
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  cost: number;
  category: string;
  stock: number;
  minStock: number;
  isActive: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export interface Transaction {
  id: string;
  receiptNumber: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  paymentMethod: string;
  status: string;
  cashier: User;
  customer?: Customer;
  items: TransactionItem[];
  createdAt: string;
}

export interface TransactionItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  segment: string;
  loyaltyPoints: number;
  totalSpent: number;
  visitCount: number;
  lastVisit?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  channel: string;
  segment: string;
  message: string;
  status: string;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  scheduledAt?: string;
  createdAt: string;
}

export interface DashboardData {
  totalSales: number;
  totalTransactions: number;
  totalCustomers: number;
  repeatRate: number;
  salesTrend: { date: string; sales: number; transactions: number }[];
  topProducts: { name: string; sales: number; revenue: number }[];
  customerSegments: { segment: string; count: number }[];
  inventoryHealth: { status: string; count: number }[];
  staffPerformance: { name: string; sales: number; transactions: number }[];
  messagingMetrics: { channel: string; sent: number; delivered: number; opened: number };
  aiInsights: string[];
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  user: User;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface Machine {
  id: string;
  name: string;
  location: string;
  status: 'ONLINE' | 'OFFLINE';
  lastSeen: string;
  version: string;
}

export interface Settings {
  storeName: string;
  currency: string;
  taxRate: number;
  loyaltyPointsRate: number;
  receiptFooter: string;
  enableAI: boolean;
  aiProvider: string;
  enableWhatsApp: boolean;
  enableSMS: boolean;
  enableEmail: boolean;
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }),
  getMe: () => api.get<User>('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// POS
export const posApi = {
  getProducts: (search?: string, category?: string) =>
    api.get<Product[]>('/pos/products', { params: { search, category } }),
  createTransaction: (data: {
    items: { productId: string; quantity: number; discount: number }[];
    paymentMethod: string;
    customerId?: string;
    discount?: number;
    amountTendered?: number;
  }) => api.post<Transaction>('/pos/transactions', data),
  getTransactions: (params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) =>
    api.get<{ transactions: Transaction[]; total: number }>('/pos/transactions', { params }),
  getTransaction: (id: string) => api.get<Transaction>(`/pos/transactions/${id}`),
  refundTransaction: (id: string, reason: string) =>
    api.post<Transaction>(`/pos/transactions/${id}/refund`, { reason }),
  sendReceipt: (id: string, channel: string, recipient: string) =>
    api.post(`/pos/transactions/${id}/receipt`, { channel, recipient }),
};

// Inventory
export const inventoryApi = {
  getProducts: (params?: { search?: string; category?: string; page?: number; limit?: number }) =>
    api.get<{ products: Product[]; total: number }>('/inventory/products', { params }),
  createProduct: (data: Partial<Product>) => api.post<Product>('/inventory/products', data),
  updateProduct: (id: string, data: Partial<Product>) =>
    api.put<Product>(`/inventory/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/inventory/products/${id}`),
  adjustStock: (id: string, quantity: number, reason: string) =>
    api.post(`/inventory/products/${id}/stock`, { quantity, reason }),
  getLowStockAlerts: () => api.get<Product[]>('/inventory/alerts/low-stock'),
};

// Customers
export const customersApi = {
  getCustomers: (params?: { search?: string; segment?: string; page?: number; limit?: number }) =>
    api.get<{ customers: Customer[]; total: number }>('/customers', { params }),
  createCustomer: (data: Partial<Customer>) => api.post<Customer>('/customers', data),
  getCustomer: (id: string) => api.get<Customer>(`/customers/${id}`),
  updateCustomer: (id: string, data: Partial<Customer>) =>
    api.put<Customer>(`/customers/${id}`, data),
  getCustomerTransactions: (id: string) =>
    api.get<Transaction[]>(`/customers/${id}/transactions`),
  adjustLoyalty: (id: string, points: number, reason: string) =>
    api.post(`/customers/${id}/loyalty`, { points, reason }),
};

// Analytics
export const analyticsApi = {
  getDashboard: (period: string) =>
    api.get<DashboardData>('/analytics/dashboard', { params: { period } }),
  getSalesTrends: (period: string) =>
    api.get<{ date: string; sales: number; transactions: number }[]>('/analytics/sales-trends', {
      params: { period },
    }),
  getProductAnalytics: (period: string) =>
    api.get<{ name: string; sales: number; revenue: number }[]>('/analytics/products', {
      params: { period },
    }),
  getCustomerAnalytics: (period: string) =>
    api.get<{ segment: string; count: number; revenue: number }[]>('/analytics/customers', {
      params: { period },
    }),
  getInventoryHealth: () => api.get<{ status: string; count: number }[]>('/analytics/inventory'),
};

// Messaging
export const messagingApi = {
  getCampaigns: () => api.get<Campaign[]>('/messaging/campaigns'),
  createCampaign: (data: Partial<Campaign>) => api.post<Campaign>('/messaging/campaigns', data),
  sendMessage: (data: { channel: string; recipient: string; message: string }) =>
    api.post('/messaging/send', data),
  getMessageHistory: (params?: { page?: number; limit?: number }) =>
    api.get<{ messages: unknown[]; total: number }>('/messaging/history', { params }),
  getTemplates: () =>
    api.get<{ id: string; name: string; content: string; channel: string }[]>('/messaging/templates'),
};

// Admin
export const adminApi = {
  getUsers: () => api.get<User[]>('/admin/users'),
  createUser: (data: Partial<User> & { password: string }) =>
    api.post<User>('/admin/users', data),
  updateUser: (id: string, data: Partial<User>) => api.put<User>(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getAuditLogs: (params?: { page?: number; limit?: number; userId?: string; action?: string }) =>
    api.get<{ logs: AuditLog[]; total: number }>('/admin/audit-logs', { params }),
  getMachines: () => api.get<Machine[]>('/admin/machines'),
};

// AI
export const aiApi = {
  getDemandForecast: (productId: string) =>
    api.get(`/ai/demand-forecast/${productId}`),
  getPriceRecommendations: () => api.get('/ai/price-recommendations'),
  getCustomerInsights: (customerId: string) =>
    api.get(`/ai/customer-insights/${customerId}`),
  generateMessage: (data: { segment: string; channel: string; context?: string }) =>
    api.post<{ message: string }>('/ai/generate-message', data),
  getInventoryForecast: () => api.get('/ai/inventory-forecast'),
};

// Settings
export const settingsApi = {
  getSettings: () => api.get<Settings>('/settings'),
  updateSettings: (data: Partial<Settings>) => api.put<Settings>('/settings', data),
};

export default api;
