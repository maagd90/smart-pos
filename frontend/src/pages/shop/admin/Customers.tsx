import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import type { Customer } from '../../../types';

interface CustomersResponse {
  customers: Customer[];
  total: number;
}

export default function AdminCustomers() {
  const { shopId } = useParams<{ shopId: string }>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [search, setSearch] = useState('');

  function load() {
    if (!shopId) return;
    setIsLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get<CustomersResponse>(`/api/shops/${shopId}/customers${params}`)
      .then((r) => { setCustomers(r.data.customers); setTotal(r.data.total); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }

  useEffect(() => { load(); }, [shopId, search]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post(`/api/shops/${shopId}/customers`, {
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
      });
      toast.success('Customer added');
      setShowCreate(false);
      setForm({ name: '', email: '', phone: '' });
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to add customer');
    }
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Customers ({total})</h1>
        <button style={styles.btn} onClick={() => setShowCreate(true)}>+ Add Customer</button>
      </div>

      <input placeholder="Search customers…" value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...styles.input, marginBottom: 16, maxWidth: 300 }} />

      {showCreate && (
        <div style={styles.modal}>
          <div style={styles.modalCard}>
            <h2 style={styles.modalTitle}>Add Customer</h2>
            <form onSubmit={(e) => void handleCreate(e)} style={styles.form}>
              <input placeholder="Full name *" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} style={styles.input} required />
              <input placeholder="Email" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} style={styles.input} />
              <input placeholder="Phone" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} style={styles.input} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={styles.btn}>Add</button>
                <button type="button" style={styles.btnGhost} onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? <div style={styles.loading}>Loading…</div> : (
        <table style={styles.table}>
          <thead>
            <tr>{['Name', 'Email', 'Phone', 'Total Spent', 'Visits'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td style={styles.td}>{c.name}</td>
                <td style={styles.td}>{c.email ?? '—'}</td>
                <td style={styles.td}>{c.phone ?? '—'}</td>
                <td style={styles.td}>${c.totalSpent.toFixed(2)}</td>
                <td style={styles.td}>{c.visitCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 },
  loading: { padding: 40, textAlign: 'center', color: '#64748b' },
  btn: { padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  btnGhost: { padding: '8px 16px', backgroundColor: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f8fafc' },
  modal: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 400 },
  modalTitle: { margin: '0 0 16px', fontSize: 18, fontWeight: 700 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' },
};
