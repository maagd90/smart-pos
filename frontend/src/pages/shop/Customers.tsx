import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import type { Customer } from '../../types';

interface CustomersResponse { customers: Customer[]; total: number }

export default function ShopCustomers() {
  const { shopId } = useParams<{ shopId: string }>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!shopId) return;
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get<CustomersResponse>(`/api/shops/${shopId}/customers${params}`)
      .then((r) => { setCustomers(r.data.customers); setTotal(r.data.total); })
      .catch(console.error);
  }, [shopId, search]);

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Customers ({total})</h1>
        <input placeholder="Search…" value={search}
          onChange={(e) => setSearch(e.target.value)} style={styles.search} />
      </div>
      <table style={styles.table}>
        <thead>
          <tr>{['Name', 'Email', 'Phone', 'Total Spent', 'Visits'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td style={styles.td}><strong>{c.name}</strong></td>
              <td style={styles.td}>{c.email ?? '—'}</td>
              <td style={styles.td}>{c.phone ?? '—'}</td>
              <td style={styles.td}>${c.totalSpent.toFixed(2)}</td>
              <td style={styles.td}>{c.visitCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 },
  search: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, width: 240 },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f8fafc' },
};
