export type UserRole = 'platform_admin' | 'shop_admin' | 'manager' | 'cashier' | 'analyst';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  shopId?: string;
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface Order {
  id: string;
  items: CartItem[];
  customerId?: string;
  discount: number;
  tax: number;
  total: number;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface ShopContextType {
  currentShop: Shop | null;
  setCurrentShop: (shop: Shop | null) => void;
}
