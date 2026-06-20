import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { AccountRolesPage } from './pages/account/AccountRolesPage';
import { AccountStoresPage } from './pages/account/AccountStoresPage';
import { AccountUsersPage } from './pages/account/AccountUsersPage';
import { DevDashboardPage } from './pages/DevDashboardPage';
import { HomeRedirect, LoginPage } from './pages/LoginPage';
import { PlatformAccountsPage } from './pages/platform/PlatformAccountsPage';
import { PlatformAiKeysPage } from './pages/platform/PlatformAiKeysPage';
import { RefundPolicyPage } from './pages/store/RefundPolicyPage';
import { ReportSettingsPage } from './pages/store/ReportSettingsPage';
import { StoreSettingsPage } from './pages/store/StoreSettingsPage';
import './app.css';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<HomeRedirect />} />
                <Route path="platform/accounts" element={<PlatformAccountsPage />} />
                <Route path="platform/ai-keys" element={<PlatformAiKeysPage />} />
                <Route path="account/stores" element={<AccountStoresPage />} />
                <Route path="account/users" element={<AccountUsersPage />} />
                <Route path="account/roles" element={<AccountRolesPage />} />
                <Route path="store/settings" element={<StoreSettingsPage />} />
                <Route path="store/refund-policy" element={<RefundPolicyPage />} />
                <Route path="store/report-settings" element={<ReportSettingsPage />} />
                <Route path="dev" element={<DevDashboardPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
