import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface NavItem {
  label: string;
  path: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'All Shops', path: '/platform/shops', roles: ['platform_admin'] },
  { label: 'System Settings', path: '/platform/settings', roles: ['platform_admin'] },
  { label: 'Dashboard', path: '/shop/:shopId/dashboard', roles: ['shop_admin', 'manager'] },
  { label: 'Products', path: '/shop/:shopId/products', roles: ['shop_admin', 'manager'] },
  { label: 'Customers', path: '/shop/:shopId/customers', roles: ['shop_admin', 'manager'] },
  { label: 'Staff', path: '/shop/:shopId/staff', roles: ['shop_admin'] },
  { label: 'Analytics', path: '/shop/:shopId/analytics', roles: ['shop_admin', 'manager', 'analyst'] },
  { label: 'Reports', path: '/shop/:shopId/reports', roles: ['analyst'] },
  { label: 'Settings', path: '/shop/:shopId/settings', roles: ['shop_admin'] },
  { label: 'WhatsApp', path: '/shop/:shopId/whatsapp', roles: ['shop_admin'] },
  { label: 'POS Terminal', path: '/shop/:shopId/pos', roles: ['cashier'] },
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
        background: '#1e1b4b',
        color: '#fff',
        display: isOpen ? 'flex' : 'none',
        flexDirection: 'column',
        padding: '24px 0',
      }}
    >
      <div style={{ padding: '0 20px 24px', fontWeight: 700, fontSize: 18, color: '#a5b4fc' }}>
        Smart POS
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1 }}>
        {visibleItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={resolvePath(item.path)}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'block',
                padding: '10px 20px',
                color: isActive ? '#fff' : '#c7d2fe',
                background: isActive ? '#4f46e5' : 'transparent',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 400,
                borderLeft: isActive ? '3px solid #818cf8' : '3px solid transparent',
              })}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div style={{ padding: '16px 20px', borderTop: '1px solid #312e81', fontSize: 13, color: '#818cf8' }}>
        {user.name} ({user.role})
      </div>
    </nav>
  );
};

export default Sidebar;
