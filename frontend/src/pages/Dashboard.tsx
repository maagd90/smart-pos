import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const KPIS = [
  { label: "Today's Sales", value: '$1,240', icon: '💰', color: 'var(--primary)' },
  { label: 'Customers', value: '48', icon: '👥', color: 'var(--teal)' },
  { label: 'Orders', value: '31', icon: '📦', color: 'var(--warning)' },
  { label: 'Revenue (Month)', value: '$18,920', icon: '📈', color: 'var(--success)' },
];

const MOCK_ACTIVITIES = [
  { text: 'Order #1042 completed', time: '2 min ago', color: 'var(--success)' },
  { text: 'New customer registered', time: '15 min ago', color: 'var(--primary)' },
  { text: 'Low stock alert: Coffee', time: '1 hr ago', color: 'var(--warning)' },
  { text: 'Order #1041 completed', time: '2 hr ago', color: 'var(--success)' },
];

const MOCK_TOP_PRODUCTS = [
  { name: 'Coffee', sales: 84, pct: 84 },
  { name: 'Sandwich', sales: 62, pct: 62 },
  { name: 'Juice', sales: 45, pct: 45 },
  { name: 'Tea', sales: 38, pct: 38 },
];

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: 'var(--text)' }}>Dashboard</h1>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14 }}>Welcome back, {user?.name}!</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {KPIS.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: 'var(--panel)',
              borderRadius: 14,
              padding: '20px 22px',
              boxShadow: '0 1px 4px rgba(16,35,60,0.06)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</span>
              <span style={{ fontSize: 20 }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'var(--panel)', borderRadius: 14, padding: 20, border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(16,35,60,0.06)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--text)' }}>Recent Activity</h2>
          {MOCK_ACTIVITIES.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{item.text}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{item.time}</span>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--panel)', borderRadius: 14, padding: 20, border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(16,35,60,0.06)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--text)' }}>Top Products</h2>
          {MOCK_TOP_PRODUCTS.map((p) => (
            <div key={p.name} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: 'var(--text)' }}>{p.name}</span>
                <span style={{ color: 'var(--muted)' }}>{p.sales} sold</span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 99 }}>
                <div style={{ height: 6, background: 'var(--primary)', borderRadius: 99, width: `${p.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
