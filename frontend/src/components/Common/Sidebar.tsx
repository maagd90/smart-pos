import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShoppingCart,
  BarChart2,
  Users,
  Package,
  MessageSquare,
  Settings,
  LayoutDashboard,
} from 'lucide-react';
import { User } from '../../services/api';

interface SidebarProps {
  user: User;
}

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { to: '/pos', icon: <ShoppingCart className="w-5 h-5" />, label: 'POS', roles: ['OWNER', 'MANAGER', 'CASHIER'] },
  { to: '/analytics', icon: <BarChart2 className="w-5 h-5" />, label: 'Analytics', roles: ['OWNER', 'MANAGER', 'ANALYST'] },
  { to: '/customers', icon: <Users className="w-5 h-5" />, label: 'Customers', roles: ['OWNER', 'MANAGER', 'ANALYST'] },
  { to: '/inventory', icon: <Package className="w-5 h-5" />, label: 'Inventory', roles: ['OWNER', 'MANAGER'] },
  { to: '/messaging', icon: <MessageSquare className="w-5 h-5" />, label: 'Messaging', roles: ['OWNER', 'MANAGER'] },
  { to: '/admin', icon: <Settings className="w-5 h-5" />, label: 'Admin', roles: ['OWNER', 'MANAGER'] },
];

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const allowed = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="w-16 sm:w-56 bg-[#1e3a5f] text-white flex flex-col h-full">
      <div className="p-4 flex items-center gap-3 border-b border-blue-800">
        <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center flex-shrink-0">
          <LayoutDashboard className="w-4 h-4 text-white" />
        </div>
        <span className="hidden sm:block font-bold text-lg tracking-tight">SmartPOS</span>
      </div>
      <nav className="flex-1 py-4 space-y-1 px-2">
        {allowed.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-100 hover:bg-blue-800 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span className="hidden sm:block">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-blue-800">
        <p className="hidden sm:block text-xs text-blue-300">Smart POS v1.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
