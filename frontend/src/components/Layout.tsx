import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import useNetworkStatus from '../hooks/useNetworkStatus';

const getUserInitials = (name: string): string =>
  name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const ROLE_LABELS: Record<string, string> = {
  platform_admin: 'Platform Admin',
  shop_admin: 'Shop Admin',
  manager: 'Manager',
  cashier: 'Cashier',
  analyst: 'Analyst',
};

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const isOnline = useNetworkStatus();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            background: 'var(--panel)',
            padding: '0 24px',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <button
            aria-label="Toggle sidebar"
            onClick={() => setSidebarOpen((o) => !o)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              color: 'var(--muted)',
              padding: '4px 6px',
              borderRadius: 6,
              lineHeight: 1,
            }}
          >
            ☰
          </button>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Smart POS
          </span>

          <div style={{ flex: 1 }} />

          {!isOnline && (
            <span
              aria-label="Offline"
              style={{
                background: '#fef3c7',
                color: 'var(--warning)',
                border: '1px solid #fde68a',
                borderRadius: 6,
                padding: '3px 10px',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span aria-hidden="true">●</span> Offline
            </span>
          )}

          {user && (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                aria-label="User menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '6px 12px 6px 8px',
                  cursor: 'pointer',
                  color: 'var(--text)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {getUserInitials(user.name)}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{user.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{ROLE_LABELS[user.role] ?? user.role}</span>
                </span>
                <span aria-hidden="true" style={{ color: 'var(--muted)', fontSize: 10, marginLeft: 2 }}>▾</span>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 6px)',
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                    minWidth: 180,
                    zIndex: 100,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{user.email}</div>
                  </div>
                  <button
                    role="menuitem"
                    onClick={handleLogout}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 16px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: 'var(--danger)',
                      fontWeight: 500,
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </header>
        <main style={{ flex: 1, padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
