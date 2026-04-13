import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { localStore } from '../services/offlineStorage';

/**
 * UserMenu – shows the current user's avatar, name, role, and a logout button.
 * Reads user info from React state (live) and falls back to LocalStorage (offline).
 */
const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Prefer live state; fall back to cached info when offline
  const displayUser = user ?? localStore.getUserInfo<{ name: string; email: string; role: string }>();

  const handleLogout = () => {
    logout();
    localStore.clearAuth();
    navigate('/login', { replace: true });
  };

  if (!displayUser) return null;

  const initials = displayUser.name
    .split(' ')
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3">
      {/* Avatar */}
      <div
        title={displayUser.email ?? ''}
        className="flex items-center justify-center h-8 w-8 rounded-full bg-sky-600 text-white text-xs font-semibold select-none"
      >
        {initials}
      </div>

      {/* Name + role */}
      <div className="hidden sm:block">
        <p className="text-sm font-medium text-gray-800 leading-tight">{displayUser.name}</p>
        <p className="text-xs text-gray-500 capitalize leading-tight">{displayUser.role?.replace(/_/g, ' ')}</p>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="ml-1 text-xs text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
      >
        Logout
      </button>
    </div>
  );
};

export default UserMenu;
