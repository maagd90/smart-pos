import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ShopProvider } from './contexts/ShopContext';
import { useAuth } from './hooks/useAuth';
import { MainLayout } from './components/Layout/MainLayout';
import type { Role } from './types';

// Pages
import Login from './pages/auth/Login';
import PlatformDashboard from './pages/platform/Dashboard';
import PlatformShops from './pages/platform/Shops';
import PlatformSubscriptions from './pages/platform/Subscriptions';
import PlatformAnalytics from './pages/platform/Analytics';
import PlatformSettings from './pages/platform/Settings';
import ShopAdminDashboard from './pages/shop/admin/Dashboard';
import Staff from './pages/shop/admin/Staff';
import Products from './pages/shop/admin/Products';
import AdminCustomers from './pages/shop/admin/Customers';
import Messaging from './pages/shop/admin/Messaging';
import Offers from './pages/shop/admin/Offers';
import ShopSettings from './pages/shop/admin/Settings';
import POS from './pages/shop/POS';
import ShopAnalytics from './pages/shop/Analytics';
import Inventory from './pages/shop/Inventory';
import ShopCustomers from './pages/shop/Customers';

// ─── Route Guards ─────────────────────────────────────────────────────────────

function RequireAuth({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div style={loadingStyle}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

function RedirectByRole() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div style={loadingStyle}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'PLATFORM_ADMIN') return <Navigate to="/platform/dashboard" replace />;
  if (user.shopId) return <Navigate to={`/shop/${user.shopId}/admin`} replace />;
  return <Navigate to="/login" replace />;
}

const PLATFORM_ROLES: Role[] = ['PLATFORM_ADMIN'];
const SHOP_ADMIN_ROLES: Role[] = ['PLATFORM_ADMIN', 'SHOP_ADMIN'];
const MANAGER_ROLES: Role[] = ['PLATFORM_ADMIN', 'SHOP_ADMIN', 'MANAGER'];
const SHOP_ROLES: Role[] = ['PLATFORM_ADMIN', 'SHOP_ADMIN', 'MANAGER', 'CASHIER', 'ANALYST'];

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  fontSize: 16,
  color: '#64748b',
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={
        <div style={{ ...loadingStyle, flexDirection: 'column', gap: 16 }}>
          <span style={{ fontSize: 48 }}>🚫</span>
          <h2>Unauthorized</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      } />

      {/* Root redirect */}
      <Route path="/" element={<RedirectByRole />} />

      {/* Platform Admin */}
      <Route element={<RequireAuth allowedRoles={PLATFORM_ROLES} />}>
        <Route path="/platform/dashboard" element={<PlatformDashboard />} />
        <Route path="/platform/shops" element={<PlatformShops />} />
        <Route path="/platform/subscriptions" element={<PlatformSubscriptions />} />
        <Route path="/platform/analytics" element={<PlatformAnalytics />} />
        <Route path="/platform/settings" element={<PlatformSettings />} />
      </Route>

      {/* Shop Admin */}
      <Route element={<RequireAuth allowedRoles={SHOP_ADMIN_ROLES} />}>
        <Route path="/shop/:shopId/admin" element={<ShopAdminDashboard />} />
        <Route path="/shop/:shopId/admin/staff" element={<Staff />} />
        <Route path="/shop/:shopId/admin/messaging" element={<Messaging />} />
        <Route path="/shop/:shopId/admin/settings" element={<ShopSettings />} />
      </Route>

      {/* Manager + Shop Admin */}
      <Route element={<RequireAuth allowedRoles={MANAGER_ROLES} />}>
        <Route path="/shop/:shopId/admin/products" element={<Products />} />
        <Route path="/shop/:shopId/admin/customers" element={<AdminCustomers />} />
        <Route path="/shop/:shopId/admin/offers" element={<Offers />} />
        <Route path="/shop/:shopId/inventory" element={<Inventory />} />
      </Route>

      {/* All shop roles */}
      <Route element={<RequireAuth allowedRoles={SHOP_ROLES} />}>
        <Route path="/shop/:shopId/pos" element={<POS />} />
        <Route path="/shop/:shopId/analytics" element={<ShopAnalytics />} />
        <Route path="/shop/:shopId/customers" element={<ShopCustomers />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ShopProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: 8, fontSize: 14 },
            }}
          />
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
