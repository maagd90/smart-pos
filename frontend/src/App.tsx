import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import POSPage from './pages/POSPage';
import AdminPanel from './pages/AdminPanel';
import AnalyticsPage from './pages/AnalyticsPage';
import CustomerManagement from './pages/CustomerManagement';
import InventoryPage from './pages/InventoryPage';
import MessagingPage from './pages/MessagingPage';
import Sidebar from './components/Common/Sidebar';
import Navbar from './components/Common/Navbar';
import LoadingSpinner from './components/Common/LoadingSpinner';
import { User } from './services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  user: User | null;
  isAuthenticated: boolean;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, user, isAuthenticated, allowedRoles }) => {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode; user: User; logout: () => void }> = ({ children, user, logout }) => (
  <div className="flex h-screen bg-gray-50">
    <Sidebar user={user} />
    <div className="flex-1 flex flex-col overflow-hidden">
      <Navbar user={user} logout={logout} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  </div>
);

const App: React.FC = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  const getDefaultRoute = () => {
    if (!user) return '/login';
    if (user.role === 'CASHIER') return '/pos';
    return '/analytics';
  };

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <LoginPage login={login} />} />
        <Route path="/" element={<ProtectedRoute user={user} isAuthenticated={isAuthenticated}><Navigate to={getDefaultRoute()} replace /></ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute user={user} isAuthenticated={isAuthenticated} allowedRoles={['OWNER','MANAGER','CASHIER']}><Layout user={user!} logout={logout}><POSPage /></Layout></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute user={user} isAuthenticated={isAuthenticated} allowedRoles={['OWNER','MANAGER','ANALYST']}><Layout user={user!} logout={logout}><AnalyticsPage /></Layout></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute user={user} isAuthenticated={isAuthenticated} allowedRoles={['OWNER','MANAGER','ANALYST']}><Layout user={user!} logout={logout}><CustomerManagement /></Layout></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute user={user} isAuthenticated={isAuthenticated} allowedRoles={['OWNER','MANAGER']}><Layout user={user!} logout={logout}><InventoryPage /></Layout></ProtectedRoute>} />
        <Route path="/messaging" element={<ProtectedRoute user={user} isAuthenticated={isAuthenticated} allowedRoles={['OWNER','MANAGER']}><Layout user={user!} logout={logout}><MessagingPage /></Layout></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute user={user} isAuthenticated={isAuthenticated} allowedRoles={['OWNER','MANAGER']}><Layout user={user!} logout={logout}><AdminPanel /></Layout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
