import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import type { Shop } from '../../types';

interface ShopsResponse {
  shops: Shop[];
  total: number;
}

export default function PlatformShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', plan: 'basic' });

  function load() {
    setIsLoading(true);
    api
      .get<ShopsResponse>('/api/platform/shops')
      .then((r) => {
        setShops(r.data.shops);
        setTotal(r.data.total);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/api/platform/shops', form);
      toast.success('Shop created');
      setShowCreate(false);
      setForm({ name: '', slug: '', plan: 'basic' });
      load();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create shop'
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this shop?')) return;
    try {
      await api.delete(`/api/platform/shops/${id}`);
      toast.success('Shop deleted');
      load();
    } catch {
      toast.error('Failed to delete shop');
    }
  }

  const statusColor: Record<string, string> = {
    ACTIVE: '#10b981',
    INACTIVE: '#f59e0b',
    SUSPENDED: '#ef4444',
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Shops ({total})</h1>
        <button style={styles.btn} onClick={() => setShowCreate(true)}>+ New Shop</button>
      </div>

      {showCreate && (
        <div style={styles.modal}>
          <div style={styles.modalCard}>
            <h2 style={styles.modalTitle}>Create Shop</h2>
            <form onSubmit={(e) => void handleCreate(e)} style={styles.form}>
              <input placeholder="Shop name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} style={styles.input} required />
              <input placeholder="Slug (e.g. my-shop)" value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                style={styles.input} required />
              <select value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })} style={styles.input}>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={styles.btn}>Create</button>
                <button type="button" style={styles.btnGhost} onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={styles.loading}>Loading…</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              {['Name', 'Slug', 'Plan', 'Status', 'Users', 'Actions'].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shops.map((shop) => (
              <tr key={shop.id}>
                <td style={styles.td}>{shop.name}</td>
                <td style={styles.td}><code>{shop.slug}</code></td>
                <td style={styles.td}>{shop.plan}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, backgroundColor: statusColor[shop.status] }}>
                    {shop.status}
                  </span>
                </td>
                <td style={styles.td}>{shop._count?.users ?? 0}</td>
                <td style={styles.td}>
                  <button style={styles.btnDanger} onClick={() => void handleDelete(shop.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 },
  loading: { padding: 40, textAlign: 'center', color: '#64748b' },
  btn: { padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  btnGhost: { padding: '8px 16px', backgroundColor: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer' },
  btnDanger: { padding: '4px 10px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f8fafc' },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: '#fff' },
  modal: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 400 },
  modalTitle: { margin: '0 0 16px', fontSize: 18, fontWeight: 700 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 },
};
