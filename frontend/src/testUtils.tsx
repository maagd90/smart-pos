import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import ShopContext from '../contexts/ShopContext';
import { User, Shop } from '../types';

interface WrapperOptions {
  user?: User | null;
  token?: string | null;
  shop?: Shop | null;
  initialEntries?: string[];
}

export const mockLogin = jest.fn();
export const mockLogout = jest.fn();

export const createWrapper = (options: WrapperOptions = {}) => {
  const {
    user = null,
    token = null,
    shop = null,
    initialEntries = ['/'],
  } = options;

  return ({ children }: { children: React.ReactNode }) => (
    <AuthContext.Provider value={{ user, token, login: mockLogin, logout: mockLogout, isLoading: false }}>
      <ShopContext.Provider value={{ currentShop: shop, setCurrentShop: jest.fn() }}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </ShopContext.Provider>
    </AuthContext.Provider>
  );
};

export const renderWithProviders = (
  ui: React.ReactElement,
  options: WrapperOptions & Omit<RenderOptions, 'wrapper'> = {}
) => {
  const { user, token, shop, initialEntries, ...renderOptions } = options;
  const Wrapper = createWrapper({ user, token, shop, initialEntries });
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

export const mockShopAdmin: User = {
  id: 'u1',
  name: 'Shop Owner',
  email: 'owner@shop.com',
  role: 'shop_admin',
  shopId: 'shop1',
};

export const mockCashier: User = {
  id: 'u2',
  name: 'John Cashier',
  email: 'cashier@shop.com',
  role: 'cashier',
  shopId: 'shop1',
};

export const mockPlatformAdmin: User = {
  id: 'u3',
  name: 'Platform Admin',
  email: 'admin@platform.com',
  role: 'platform_admin',
};

export const mockManager: User = {
  id: 'u4',
  name: 'Store Manager',
  email: 'manager@shop.com',
  role: 'manager',
  shopId: 'shop1',
};

export const mockAnalyst: User = {
  id: 'u5',
  name: 'Data Analyst',
  email: 'analyst@shop.com',
  role: 'analyst',
  shopId: 'shop1',
};
