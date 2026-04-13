import React from 'react';
import OfflineBadge from './OfflineBadge';
import UserMenu from './UserMenu';

interface HeaderProps {
  onToggleSidebar: () => void;
}

/**
 * App header with sidebar toggle, brand name, offline badge and user menu.
 */
const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="flex items-center justify-between bg-white px-6 py-3 shadow-sm">
      {/* Left: toggle + brand */}
      <div className="flex items-center gap-4">
        <button
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
          className="text-gray-600 hover:text-gray-900 text-xl focus:outline-none"
        >
          ☰
        </button>
        <span className="font-semibold text-base text-slate-800">Smart POS</span>
        <OfflineBadge />
      </div>

      {/* Right: user info + logout */}
      <UserMenu />
    </header>
  );
};

export default Header;
