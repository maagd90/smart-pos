import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';

interface ShopAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  newCustomers: number;
  topProducts: Array<{ productId: string; name: string; totalSold: number }>;
}

export default function ShopAdminDashboard() {
  const { shopId } = useParams<{ shopId: string }>();
  const [stats, setStats] = useState<ShopAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!shopId) return;
    api
      .get<ShopAnalytics>(`/api/shops/${shopId}/analytics`)
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [shopId]);

  const cards = [
    { label: 'Revenue (30d)', value: `$${(stats?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: '💰', color: '#10b981' },
    { label: 'Orders (30d)', value: stats?.totalOrders ?? 0, icon: '🛒', color: '#3b82f6' },
    { label: 'Avg Order Value', value: `$${(stats?.averageOrderValue ?? 0).toFixed(2)}`, icon: '📈', color: '#f59e0b' },
    { label: 'Total Customers', value: stats?.totalCustomers ?? 0, icon: '👥', color: '#8b5cf6' },
    { label: 'New Customers', value: stats?.newCustomers ?? 0, icon: '✨', color: '#ec4899' },
  ];

  if (isLoading) return <div style={styles.loading}>Loading dashboard…</div>;

  return (
    <div>
      <h1 style={styles.title}>Shop Dashboard</h1>
      <div style={styles.grid}>
        {cards.map((card) => (
          <div key={card.label} style={{ ...styles.card, borderTopColor: card.color }}>
            <div style={styles.cardIcon}>{card.icon}</div>
            <div style={styles.cardValue}>{card.value}</div>
            <div style={styles.cardLabel}>{card.label}</div>
          </div>
        ))}
      </div>

      {stats?.topProducts && stats.topProducts.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Top Products (30 days)</h2>
          <div style={styles.productList}>
            {stats.topProducts.map((p, i) => (
              <div key={p.productId} style={styles.productItem}>
                <span style={styles.rank}>#{i + 1}</span>
                <span style={styles.productName}>{p.name}</span>
                <span style={styles.productSold}>{p.totalSold} sold</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 24 },
  loading: { padding: 40, textAlign: 'center', color: '#64748b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: '3px solid transparent' },
  cardIcon: { fontSize: 28, marginBottom: 8 },
  cardValue: { fontSize: 28, fontWeight: 700, color: '#1e293b' },
  cardLabel: { fontSize: 13, color: '#64748b', marginTop: 4 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16, marginTop: 0 },
  productList: { display: 'flex', flexDirection: 'column', gap: 10 },
  productItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' },
  rank: { width: 28, height: 28, borderRadius: '50%', backgroundColor: '#dbeafe', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 },
  productName: { flex: 1, fontSize: 14, fontWeight: 500, color: '#374151' },
  productSold: { fontSize: 13, color: '#64748b' },
};
