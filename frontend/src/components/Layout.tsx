import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            background: 'var(--panel)',
            padding: '0 24px',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
            boxShadow: '0 1px 4px rgba(16,35,60,0.06)',
            gap: 12,
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
            }}
          >
            ☰
          </button>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)', flex: 1 }}>Smart POS</span>

          {/* Offline Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: navigator.onLine ? '#f0fdf4' : '#fef2f2',
              color: navigator.onLine ? 'var(--success)' : 'var(--danger)',
              border: `1px solid ${navigator.onLine ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: 99,
              padding: '3px 10px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: navigator.onLine ? 'var(--success)' : 'var(--danger)', display: 'inline-block' }} />
            {navigator.onLine ? 'Online' : 'Offline'}
          </div>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{user.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user.role}</div>
              </div>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={logout}
                style={{
                  padding: '6px 14px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'var(--muted)',
                  fontWeight: 500,
                }}
              >
                Logout
              </button>
            </div>
          )}
        </header>
        <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
