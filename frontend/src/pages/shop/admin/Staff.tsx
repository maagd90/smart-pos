import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import type { User } from '../../../types';

interface StaffResponse {
  staff: User[];
}

export default function Staff() {
  const { shopId } = useParams<{ shopId: string }>();
  const [staff, setStaff] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CASHIER' });

  function load() {
    if (!shopId) return;
    setIsLoading(true);
    api
      .get<StaffResponse>(`/api/shops/${shopId}/staff`)
      .then((r) => setStaff(r.data.staff))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }

  useEffect(() => { load(); }, [shopId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post(`/api/shops/${shopId}/staff`, form);
      toast.success('Staff member added');
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'CASHIER' });
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to add staff');
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm('Remove this staff member?')) return;
    try {
      await api.delete(`/api/shops/${shopId}/staff/${userId}`);
      toast.success('Staff member removed');
      load();
    } catch {
      toast.error('Failed to remove staff member');
    }
  }

  const roleColors: Record<string, string> = {
    SHOP_ADMIN: '#8b5cf6',
    MANAGER: '#3b82f6',
    CASHIER: '#10b981',
    ANALYST: '#f59e0b',
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Staff Management</h1>
        <button style={styles.btn} onClick={() => setShowCreate(true)}>+ Add Staff</button>
      </div>

      {showCreate && (
        <div style={styles.modal}>
          <div style={styles.modalCard}>
            <h2 style={styles.modalTitle}>Add Staff Member</h2>
            <form onSubmit={(e) => void handleCreate(e)} style={styles.form}>
              <input placeholder="Full name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} style={styles.input} required />
              <input placeholder="Email" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} style={styles.input} required />
              <input placeholder="Password" type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} style={styles.input} required />
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={styles.input}>
                <option value="CASHIER">Cashier</option>
                <option value="MANAGER">Manager</option>
                <option value="ANALYST">Analyst</option>
                <option value="SHOP_ADMIN">Shop Admin</option>
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={styles.btn}>Add</button>
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
              {['Name', 'Email', 'Role', 'Actions'].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id}>
                <td style={styles.td}>{member.name}</td>
                <td style={styles.td}>{member.email}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, backgroundColor: roleColors[member.role] ?? '#64748b' }}>
                    {member.role.replace('_', ' ')}
                  </span>
                </td>
                <td style={styles.td}>
                  <button style={styles.btnDanger} onClick={() => void handleRemove(member.id)}>Remove</button>
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
