import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

interface ShopAnalytics {
  period: { days: number };
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  newCustomers: number;
  topProducts: Array<{ productId: string; name: string; totalSold: number }>;
}

export default function ShopAnalytics() {
  const { shopId } = useParams<{ shopId: string }>();
  const [data, setData] = useState<ShopAnalytics | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!shopId) return;
    api.get<ShopAnalytics>(`/api/shops/${shopId}/analytics?days=${days}`)
      .then((r) => setData(r.data))
      .catch(console.error);
  }, [shopId, days]);

  const cards = [
    { label: `Revenue (${days}d)`, value: `$${(data?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: '💰' },
    { label: `Orders (${days}d)`, value: data?.totalOrders ?? 0, icon: '🛒' },
    { label: 'Avg Order', value: `$${(data?.averageOrderValue ?? 0).toFixed(2)}`, icon: '📈' },
    { label: 'New Customers', value: data?.newCustomers ?? 0, icon: '✨' },
  ];

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Analytics</h1>
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value))} style={styles.select}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>
      <div style={styles.grid}>
        {cards.map((c) => (
          <div key={c.label} style={styles.card}>
            <div style={styles.icon}>{c.icon}</div>
            <div style={styles.value}>{c.value}</div>
            <div style={styles.label}>{c.label}</div>
          </div>
        ))}
      </div>

      {data?.topProducts && data.topProducts.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Top Products</h2>
          {data.topProducts.map((p, i) => (
            <div key={p.productId} style={styles.productRow}>
              <span style={styles.rank}>#{i + 1}</span>
              <span style={styles.productName}>{p.name}</span>
              <span style={styles.sold}>{p.totalSold} sold</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 },
  select: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  icon: { fontSize: 28, marginBottom: 8 },
  value: { fontSize: 28, fontWeight: 700, color: '#1e293b' },
  label: { fontSize: 13, color: '#64748b', marginTop: 4 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#1e293b', marginTop: 0, marginBottom: 16 },
  productRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' },
  rank: { width: 28, height: 28, borderRadius: '50%', backgroundColor: '#dbeafe', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 },
  productName: { flex: 1, fontSize: 14, fontWeight: 500 },
  sold: { fontSize: 13, color: '#64748b' },
};
