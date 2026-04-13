import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface NavItem {
  label: string;
  path: string;
  roles: UserRole[];
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'All Shops', path: '/platform/shops', roles: ['platform_admin'], icon: '🏪' },
  { label: 'Tenants', path: '/platform/tenants', roles: ['platform_admin'], icon: '🏢' },
  { label: 'System Settings', path: '/platform/settings', roles: ['platform_admin'], icon: '⚙️' },
  { label: 'Dashboard', path: '/shop/:shopId/dashboard', roles: ['shop_admin', 'manager'], icon: '📊' },
  { label: 'POS Terminal', path: '/shop/:shopId/pos', roles: ['cashier'], icon: '🛒' },
  { label: 'Products', path: '/shop/:shopId/products', roles: ['shop_admin', 'manager'], icon: '📦' },
  { label: 'Inventory', path: '/shop/:shopId/inventory', roles: ['shop_admin', 'manager'], icon: '��' },
  { label: 'Customers', path: '/shop/:shopId/customers', roles: ['shop_admin', 'manager'], icon: '👥' },
  { label: 'Transactions', path: '/shop/:shopId/transactions', roles: ['shop_admin', 'manager'], icon: '💳' },
  { label: 'Staff', path: '/shop/:shopId/staff', roles: ['shop_admin'], icon: '👤' },
  { label: 'Analytics', path: '/shop/:shopId/analytics', roles: ['shop_admin', 'manager', 'analyst'], icon: '📈' },
  { label: 'Reports', path: '/shop/:shopId/reports', roles: ['analyst'], icon: '📄' },
  { label: 'Settings', path: '/shop/:shopId/settings', roles: ['shop_admin'], icon: '⚙️' },
  { label: 'WhatsApp', path: '/shop/:shopId/whatsapp', roles: ['shop_admin'], icon: '💬' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const { user } = useAuth();
  const params = useParams<{ shopId?: string }>();
  const shopId = params.shopId || user?.shopId || 'default';

  if (!user) return null;

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const resolvePath = (path: string) => path.replace(':shopId', shopId);

  return (
    <nav
      aria-label="Sidebar navigation"
      style={{
        width: 220,
        minHeight: '100vh',
        background: '#0f1d35',
        color: '#fff',
        display: isOpen ? 'flex' : 'none',
        flexDirection: 'column',
        padding: '0',
        flexShrink: 0,
        boxShadow: '2px 0 12px rgba(0,0,0,0.12)',
      }}
    >
      <div style={{
        padding: '20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 20 }}>🏪</span>
        <span style={{ fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '-0.01em' }}>Smart POS</span>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: '12px 0', flex: 1, overflowY: 'auto' }}>
        {visibleItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={resolvePath(item.path)}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 16px',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                background: isActive ? 'var(--primary)' : 'transparent',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                borderRadius: '0 8px 8px 0',
                marginRight: 8,
                transition: 'all 0.15s',
              })}
            >
              <span style={{ width: 18, textAlign: 'center', fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 11,
        }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontSize: 12 }}>{user.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{user.role}</div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
