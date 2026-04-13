import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ShopProvider } from './contexts/ShopContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import AdminPanel from './pages/AdminPanel';
import Analytics from './pages/Analytics';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';
import WhatsAppWizard from './pages/WhatsAppWizard';
import NotFound from './pages/NotFound';
import TenantsList from './pages/admin/TenantsList';
import TenantDetails from './pages/admin/TenantDetails';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ShopProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="shop/:shopId/dashboard" element={<Dashboard />} />
              <Route path="shop/:shopId/pos" element={<POS />} />
              <Route
                path="shop/:shopId/admin"
                element={
                  <ProtectedRoute allowedRoles={['shop_admin', 'platform_admin']}>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              <Route path="shop/:shopId/analytics" element={<Analytics />} />
              <Route path="shop/:shopId/customers" element={<Customers />} />
              <Route path="shop/:shopId/products" element={<Products />} />
              <Route path="shop/:shopId/inventory" element={<Inventory />} />
              <Route path="shop/:shopId/transactions" element={<Transactions />} />
              <Route path="shop/:shopId/whatsapp" element={<WhatsAppWizard />} />
              <Route path="shop/:shopId/staff" element={<AdminPanel />} />
              <Route path="shop/:shopId/settings" element={<Settings />} />
              <Route path="platform/shops" element={<Dashboard />} />
              <Route path="platform/settings" element={<Dashboard />} />
              <Route path="platform/tenants" element={<TenantsList />} />
              <Route path="platform/tenants/:id" element={<TenantDetails />} />
              <Route path="platform/tenants/:id/edit" element={<TenantsList />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ShopProvider>
    </AuthProvider>
  );
};

export default App;
