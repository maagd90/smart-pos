import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface AnalyticsData {
  totalShops: number;
  activeShops: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
}

export default function PlatformAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    api.get<AnalyticsData>('/api/platform/shops/platform/analytics')
      .then((r) => setData(r.data))
      .catch(console.error);
  }, []);

  const metrics = [
    { label: 'Total Revenue', value: `$${(data?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: '💰' },
    { label: 'Total Orders', value: data?.totalOrders ?? 0, icon: '🛒' },
    { label: 'Active Shops', value: data?.activeShops ?? 0, icon: '🏪' },
    { label: 'Customers', value: data?.totalCustomers ?? 0, icon: '👥' },
  ];

  return (
    <div>
      <h1 style={styles.title}>Platform Analytics</h1>
      <div style={styles.grid}>
        {metrics.map((m) => (
          <div key={m.label} style={styles.card}>
            <div style={styles.icon}>{m.icon}</div>
            <div style={styles.value}>{m.value}</div>
            <div style={styles.label}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 24 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  icon: { fontSize: 32, marginBottom: 12 },
  value: { fontSize: 32, fontWeight: 700, color: '#1e293b' },
  label: { fontSize: 13, color: '#64748b', marginTop: 4 },
};
