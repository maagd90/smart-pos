import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AuthContext from '../contexts/AuthContext';
import { User } from '../types';

const mockLogout = jest.fn();

const renderSidebar = (user: User, path = '/shop/shop1/dashboard') => {
  return render(
    <AuthContext.Provider value={{ user, token: 'tok', login: jest.fn(), logout: mockLogout, isLoading: false }}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={<Sidebar />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

const platformAdmin: User = { id: 'pa', name: 'Platform Admin', email: 'pa@pos.com', role: 'platform_admin' };
const shopAdmin: User = { id: 'sa', name: 'Shop Admin', email: 'sa@shop.com', role: 'shop_admin', shopId: 'shop1' };
const cashier: User = { id: 'ca', name: 'Cashier Joe', email: 'ca@shop.com', role: 'cashier', shopId: 'shop1' };
const manager: User = { id: 'ma', name: 'Manager', email: 'mg@shop.com', role: 'manager', shopId: 'shop1' };
const analyst: User = { id: 'an', name: 'Analyst', email: 'an@shop.com', role: 'analyst', shopId: 'shop1' };

describe('Navigation / Sidebar', () => {
  beforeEach(() => jest.clearAllMocks());

  // ===== POSITIVE TESTS =====
  test('platform admin sees "All Shops" menu item', () => {
    renderSidebar(platformAdmin);
    expect(screen.getByText('All Shops')).toBeInTheDocument();
  });

  test('platform admin sees "System Settings" menu item', () => {
    renderSidebar(platformAdmin);
    expect(screen.getByText('System Settings')).toBeInTheDocument();
  });

  test('shop admin sees Dashboard menu item', () => {
    renderSidebar(shopAdmin);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('shop admin sees Products, Customers, Staff, Analytics, Settings, WhatsApp', () => {
    renderSidebar(shopAdmin);
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Staff')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
  });

  test('cashier sees POS Terminal', () => {
    renderSidebar(cashier);
    expect(screen.getByText('POS Terminal')).toBeInTheDocument();
  });

  test('manager sees Dashboard, Products, Customers, Analytics', () => {
    renderSidebar(manager);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  test('analyst sees Analytics and Reports', () => {
    renderSidebar(analyst);
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  test('sidebar displays user name and role', () => {
    renderSidebar(shopAdmin);
    expect(screen.getByText(/Shop Admin/i)).toBeInTheDocument();
    expect(screen.getByText(/shop_admin/i)).toBeInTheDocument();
  });

  test('sidebar has accessible nav landmark', () => {
    renderSidebar(shopAdmin);
    expect(screen.getByRole('navigation', { name: /sidebar navigation/i })).toBeInTheDocument();
  });

  // ===== NEGATIVE TESTS =====
  test('cashier does NOT see admin menu items (Staff, Settings)', () => {
    renderSidebar(cashier);
    expect(screen.queryByText('Staff')).not.toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  test('cashier does NOT see Dashboard', () => {
    renderSidebar(cashier);
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  test('analyst does NOT see POS Terminal', () => {
    renderSidebar(analyst);
    expect(screen.queryByText('POS Terminal')).not.toBeInTheDocument();
  });

  test('cashier does NOT see WhatsApp', () => {
    renderSidebar(cashier);
    expect(screen.queryByText('WhatsApp')).not.toBeInTheDocument();
  });

  test('manager does NOT see Staff or Settings (shop_admin only)', () => {
    renderSidebar(manager);
    expect(screen.queryByText('Staff')).not.toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  test('platform admin does NOT see POS Terminal', () => {
    renderSidebar(platformAdmin);
    expect(screen.queryByText('POS Terminal')).not.toBeInTheDocument();
  });

  // ===== EDGE CASES =====
  test('sidebar renders nothing when user is null', () => {
    render(
      <AuthContext.Provider value={{ user: null, token: null, login: jest.fn(), logout: jest.fn(), isLoading: false }}>
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  test('sidebar menu items are links', () => {
    renderSidebar(shopAdmin);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});
