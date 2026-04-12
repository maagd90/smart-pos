import React from 'react';
import { Bell, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../../services/api';

interface NavbarProps {
  user: User;
  logout: () => void;
}

const roleBadgeColor: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800',
  MANAGER: 'bg-blue-100 text-blue-800',
  CASHIER: 'bg-green-100 text-green-800',
  ANALYST: 'bg-orange-100 text-orange-800',
};

const Navbar: React.FC<NavbarProps> = ({ user, logout }) => (
  <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <h1 className="text-xl font-bold text-blue-900">Smart POS</h1>
    </div>
    <div className="flex items-center gap-4">
      <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
        <Bell className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
          <UserIcon className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-gray-800">{user.name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor[user.role] || 'bg-gray-100 text-gray-800'}`}>
            {user.role}
          </span>
        </div>
      </div>
      <button
        onClick={logout}
        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  </header>
);

export default Navbar;
