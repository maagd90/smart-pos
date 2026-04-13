import React, { useState } from 'react';

const MOCK_STATS = [
  { label: 'Total Revenue', value: '$92,900', change: '+12.4%', up: true },
  { label: 'Total Orders', value: '1,555', change: '+8.1%', up: true },
  { label: 'Avg. Order Value', value: '$59.74', change: '+3.6%', up: true },
  { label: 'Return Rate', value: '2.3%', change: '-0.4%', up: false },
];

const MOCK_CATEGORIES = [
  { name: 'Beverages', pct: 62, amount: '$57,598' },
  { name: 'Food', pct: 38, amount: '$35,302' },
];

const MONTHLY_DATA = [
  { month: 'Jan', revenue: 12400, orders: 210 },
  { month: 'Feb', revenue: 14800, orders: 240 },
  { month: 'Mar', revenue: 13200, orders: 220 },
  { month: 'Apr', revenue: 16500, orders: 280 },
  { month: 'May', revenue: 18900, orders: 310 },
  { month: 'Jun', revenue: 17200, orders: 295 },
];

const maxRevenue = Math.max(...MONTHLY_DATA.map((d) => d.revenue));

const Analytics: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: 'var(--text)' }}>Analytics</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>Sales analytics and performance</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '5px 14px',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: period === p ? 600 : 400,
                background: period === p ? 'var(--primary)' : 'transparent',
                color: period === p ? '#fff' : 'var(--muted)',
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {MOCK_STATS.map((s) => (
          <div key={s.label} style={{ background: 'var(--panel)', borderRadius: 14, padding: '18px 20px', border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(16,35,60,0.06)' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.up ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{s.change} vs last period</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ background: 'var(--panel)', borderRadius: 14, padding: '20px 24px', border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(16,35,60,0.06)', marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 20px', color: 'var(--text)' }}>Monthly Revenue</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160 }}>
          {MONTHLY_DATA.map((d) => (
            <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>${(d.revenue / 1000).toFixed(1)}k</span>
              <div
                style={{
                  width: '100%',
                  background: 'var(--primary)',
                  borderRadius: '4px 4px 0 0',
                  height: `${(d.revenue / maxRevenue) * 110}px`,
                  opacity: 0.85,
                  transition: 'height 0.3s',
                }}
              />
              <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top categories */}
      <div style={{ background: 'var(--panel)', borderRadius: 14, padding: '20px 24px', border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(16,35,60,0.06)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--text)' }}>Sales by Category</h2>
        {MOCK_CATEGORIES.map((cat) => (
          <div key={cat.name} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 500, color: 'var(--text)' }}>{cat.name}</span>
              <span style={{ color: 'var(--muted)' }}>{cat.amount} ({cat.pct}%)</span>
            </div>
            <div style={{ height: 8, background: 'var(--border)', borderRadius: 99 }}>
              <div style={{ height: 8, background: 'var(--teal)', borderRadius: 99, width: `${cat.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Analytics;
