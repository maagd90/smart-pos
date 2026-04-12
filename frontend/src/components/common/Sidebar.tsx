import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  Users,
  BarChart2,
  MessageSquare,
  LayoutDashboard,
  Settings,
  UserCog,
  X,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';

interface SidebarProps {
  onClose?: () => void;
}

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { to: '/pos', icon: ShoppingCart, label: 'POS' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics', roles: ['ADMIN', 'MANAGER'] },
  { to: '/messaging', icon: MessageSquare, label: 'Messaging', roles: ['ADMIN', 'MANAGER'] },
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'MANAGER'] },
  { to: '/admin/users', icon: UserCog, label: 'Users', roles: ['ADMIN'] },
  { to: '/admin/settings', icon: Settings, label: 'Settings', roles: ['ADMIN'] },
];

export function Sidebar({ onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const storeName = useSettingsStore((s) => s.settings.storeName);
  const location = useLocation();

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <aside className="flex flex-col h-full bg-gray-900 text-white w-64">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg leading-tight">{storeName}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-700 rounded">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.to === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User info */}
      {user && (
        <div className="px-4 py-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
