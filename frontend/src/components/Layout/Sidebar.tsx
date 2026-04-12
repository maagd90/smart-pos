import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../types';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  roles: Role[];
}

const PLATFORM_NAV: NavItem[] = [
  { label: 'Dashboard', icon: '🏠', path: '/platform/dashboard', roles: ['PLATFORM_ADMIN'] },
  { label: 'Shops', icon: '🏪', path: '/platform/shops', roles: ['PLATFORM_ADMIN'] },
  { label: 'Subscriptions', icon: '💳', path: '/platform/subscriptions', roles: ['PLATFORM_ADMIN'] },
  { label: 'Analytics', icon: '📊', path: '/platform/analytics', roles: ['PLATFORM_ADMIN'] },
  { label: 'Settings', icon: '⚙️', path: '/platform/settings', roles: ['PLATFORM_ADMIN'] },
];

const SHOP_ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', icon: '🏠', path: '/shop/{shopId}/admin', roles: ['SHOP_ADMIN', 'MANAGER'] },
  { label: 'POS', icon: '🛒', path: '/shop/{shopId}/pos', roles: ['SHOP_ADMIN', 'MANAGER', 'CASHIER'] },
  { label: 'Products', icon: '📦', path: '/shop/{shopId}/admin/products', roles: ['SHOP_ADMIN', 'MANAGER'] },
  { label: 'Inventory', icon: '🗄️', path: '/shop/{shopId}/inventory', roles: ['SHOP_ADMIN', 'MANAGER'] },
  { label: 'Customers', icon: '👥', path: '/shop/{shopId}/admin/customers', roles: ['SHOP_ADMIN', 'MANAGER'] },
  { label: 'Staff', icon: '👤', path: '/shop/{shopId}/admin/staff', roles: ['SHOP_ADMIN'] },
  { label: 'Offers', icon: '🎁', path: '/shop/{shopId}/admin/offers', roles: ['SHOP_ADMIN', 'MANAGER'] },
  { label: 'WhatsApp', icon: '💬', path: '/shop/{shopId}/admin/messaging', roles: ['SHOP_ADMIN'] },
  { label: 'Analytics', icon: '📊', path: '/shop/{shopId}/analytics', roles: ['SHOP_ADMIN', 'MANAGER', 'ANALYST'] },
  { label: 'Settings', icon: '⚙️', path: '/shop/{shopId}/admin/settings', roles: ['SHOP_ADMIN'] },
];

const CASHIER_NAV: NavItem[] = [
  { label: 'POS', icon: '🛒', path: '/shop/{shopId}/pos', roles: ['CASHIER'] },
  { label: 'Customers', icon: '👥', path: '/shop/{shopId}/customers', roles: ['CASHIER'] },
];

function resolvePath(path: string, shopId: string | undefined): string {
  return shopId ? path.replace('{shopId}', shopId) : path;
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { shopId } = useParams<{ shopId?: string }>();

  if (!user) return null;

  let navItems: NavItem[] = [];
  if (user.role === 'PLATFORM_ADMIN') {
    navItems = PLATFORM_NAV;
  } else if (user.role === 'CASHIER') {
    navItems = CASHIER_NAV;
  } else {
    navItems = SHOP_ADMIN_NAV;
  }

  const resolvedShopId = shopId ?? user.shopId ?? undefined;

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <aside style={styles.sidebar}>
      {/* Branding */}
      <div style={styles.brand}>
        <span style={styles.brandIcon}>🏪</span>
        <span style={styles.brandName}>Smart POS</span>
      </div>

      {/* User Info */}
      <div style={styles.userInfo}>
        <div style={styles.avatar}>{user.name.charAt(0).toUpperCase()}</div>
        <div>
          <div style={styles.userName}>{user.name}</div>
          <div style={styles.userRole}>{user.role.replace('_', ' ')}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {filteredNav.map((item) => {
          const resolvedPath = resolvePath(item.path, resolvedShopId);
          const isActive = location.pathname === resolvedPath;

          return (
            <Link
              key={item.path}
              to={resolvedPath}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={() => void logout()}
        style={styles.logoutBtn}
      >
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 240,
    minHeight: '100vh',
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 16px 0',
    flexShrink: 0,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '20px 16px',
    borderBottom: '1px solid #334155',
  },
  brandIcon: { fontSize: 24 },
  brandName: { fontWeight: 700, fontSize: 18 },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '16px',
    borderBottom: '1px solid #334155',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
  },
  userName: { fontWeight: 600, fontSize: 14 },
  userRole: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  nav: {
    flex: 1,
    padding: '8px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    color: '#cbd5e1',
    textDecoration: 'none',
    borderRadius: 6,
    margin: '0 8px',
    fontSize: 14,
    transition: 'background 0.15s',
  },
  navItemActive: {
    backgroundColor: '#3b82f6',
    color: '#fff',
  },
  navIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    margin: '0 8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#f87171',
    cursor: 'pointer',
    borderRadius: 6,
    fontSize: 14,
    width: 'calc(100% - 16px)',
  },
};
