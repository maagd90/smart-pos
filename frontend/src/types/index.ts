export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  sku?: string;
  low_stock_threshold?: number;
  image_url?: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  created_at?: string;
  total_spent?: number;
}

export interface SaleItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Sale {
  id: number;
  customer_id?: number;
  customer_name?: string;
  items: SaleItem[];
  total_amount: number;
  payment_method: 'cash' | 'card' | 'mobile';
  created_at: string;
  status?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DashboardStats {
  revenue: {
    today: number;
    week: number;
    month: number;
  };
  total_sales: number;
  total_customers: number;
  low_stock_count: number;
  sales_by_day: { date: string; total: number }[];
  sales_by_category: { category: string; total: number }[];
  top_products: { name: string; quantity: number; revenue: number }[];
  recent_sales: Sale[];
}

export interface Message {
  id: number;
  customer_id: number;
  customer_name?: string;
  type: 'promotion' | 'deal' | 'follow_up';
  content: string;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
}

export interface AIInsight {
  product?: string;
  category?: string;
  recommendation?: string;
  confidence?: number;
  [key: string]: any;
}
