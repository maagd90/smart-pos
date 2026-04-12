import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface PlatformStats {
  totalShops: number;
  activeShops: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
}

export default function PlatformDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<PlatformStats>('/api/platform/shops/platform/analytics')
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div style={styles.loading}>Loading…</div>;

  const cards = [
    { label: 'Total Shops', value: stats?.totalShops ?? 0, icon: '🏪', color: '#3b82f6' },
    { label: 'Active Shops', value: stats?.activeShops ?? 0, icon: '✅', color: '#10b981' },
    { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: '🛒', color: '#f59e0b' },
    {
      label: 'Total Revenue',
      value: `$${(stats?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: '💰',
      color: '#8b5cf6',
    },
    { label: 'Customers', value: stats?.totalCustomers ?? 0, icon: '👥', color: '#ec4899' },
  ];

  return (
    <div>
      <h1 style={styles.title}>Platform Dashboard</h1>
      <div style={styles.grid}>
        {cards.map((card) => (
          <div key={card.label} style={{ ...styles.card, borderTopColor: card.color }}>
            <div style={styles.cardIcon}>{card.icon}</div>
            <div style={styles.cardValue}>{card.value}</div>
            <div style={styles.cardLabel}>{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 24 },
  loading: { padding: 40, textAlign: 'center', color: '#64748b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    borderTop: '3px solid transparent',
  },
  cardIcon: { fontSize: 28, marginBottom: 8 },
  cardValue: { fontSize: 28, fontWeight: 700, color: '#1e293b' },
  cardLabel: { fontSize: 13, color: '#64748b', marginTop: 4 },
};
