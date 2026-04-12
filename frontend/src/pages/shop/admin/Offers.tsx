import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import type { Offer, OfferType } from '../../../types';

interface OffersResponse { offers: Offer[] }

type FormState = { name: string; description: string; discount: string; type: OfferType; isActive: boolean; startDate: string; endDate: string };

const EMPTY: FormState = { name: '', description: '', discount: '', type: 'PERCENTAGE', isActive: true, startDate: '', endDate: '' };

export default function Offers() {
  const { shopId } = useParams<{ shopId: string }>();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState(EMPTY);

  function load() {
    if (!shopId) return;
    setIsLoading(true);
    api.get<OffersResponse>(`/api/shops/${shopId}/offers`)
      .then((r) => setOffers(r.data.offers))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }

  useEffect(() => { load(); }, [shopId]);

  function openEdit(o: Offer) {
    setEditing(o);
    setForm({
      name: o.name, description: o.description ?? '', discount: String(o.discount),
      type: o.type, isActive: o.isActive, startDate: o.startDate?.slice(0, 10) ?? '',
      endDate: o.endDate?.slice(0, 10) ?? '',
    });
    setShowCreate(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name, description: form.description || undefined,
      discount: parseFloat(form.discount), type: form.type, isActive: form.isActive,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
    };
    try {
      if (editing) {
        await api.put(`/api/shops/${shopId}/offers/${editing.id}`, payload);
        toast.success('Offer updated');
      } else {
        await api.post(`/api/shops/${shopId}/offers`, payload);
        toast.success('Offer created');
      }
      setShowCreate(false); setEditing(null); setForm(EMPTY); load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save offer');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this offer?')) return;
    try {
      await api.delete(`/api/shops/${shopId}/offers/${id}`);
      toast.success('Offer deleted'); load();
    } catch { toast.error('Failed to delete offer'); }
  }

  const typeColors: Record<string, string> = { PERCENTAGE: '#3b82f6', FIXED: '#10b981', BUY_X_GET_Y: '#f59e0b' };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Offers & Campaigns</h1>
        <button style={styles.btn} onClick={() => { setEditing(null); setForm(EMPTY); setShowCreate(true); }}>+ New Offer</button>
      </div>

      {showCreate && (
        <div style={styles.modal}>
          <div style={styles.modalCard}>
            <h2 style={styles.modalTitle}>{editing ? 'Edit Offer' : 'New Offer'}</h2>
            <form onSubmit={(e) => void handleSave(e)} style={styles.form}>
              <input placeholder="Offer name *" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} style={styles.input} required />
              <input placeholder="Description" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} style={styles.input} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input placeholder="Discount value *" type="number" step="0.01" value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })} style={styles.input} required />
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })} style={styles.input}>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed ($)</option>
                  <option value="BUY_X_GET_Y">Buy X Get Y</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={styles.field}>
                  <label style={styles.label}>Start Date</label>
                  <input type="date" value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={styles.input} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>End Date</label>
                  <input type="date" value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={styles.input} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="offerActive" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                <label htmlFor="offerActive" style={{ fontSize: 14 }}>Active</label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={styles.btn}>{editing ? 'Update' : 'Create'}</button>
                <button type="button" style={styles.btnGhost} onClick={() => { setShowCreate(false); setEditing(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? <div style={styles.loading}>Loading…</div> : (
        <div style={styles.grid}>
          {offers.map((o) => (
            <div key={o.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={{ ...styles.badge, backgroundColor: typeColors[o.type] }}>{o.type}</span>
                <span style={{ ...styles.badge, backgroundColor: o.isActive ? '#10b981' : '#94a3b8' }}>
                  {o.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 style={styles.offerName}>{o.name}</h3>
              <div style={styles.discount}>
                {o.type === 'PERCENTAGE' ? `${o.discount}% off` : o.type === 'FIXED' ? `$${o.discount} off` : `Buy X Get Y`}
              </div>
              {o.description && <p style={styles.desc}>{o.description}</p>}
              {(o.startDate || o.endDate) && (
                <div style={styles.dates}>
                  {o.startDate && <span>From: {new Date(o.startDate).toLocaleDateString()}</span>}
                  {o.endDate && <span>Until: {new Date(o.endDate).toLocaleDateString()}</span>}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button style={styles.btnEdit} onClick={() => openEdit(o)}>Edit</button>
                <button style={styles.btnDanger} onClick={() => void handleDelete(o.id)}>Delete</button>
              </div>
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
  loading: { padding: 40, textAlign: 'center', color: '#64748b' },
  btn: { padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  btnGhost: { padding: '8px 16px', backgroundColor: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer' },
  btnEdit: { padding: '4px 10px', backgroundColor: '#dbeafe', color: '#2563eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  btnDanger: { padding: '4px 10px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  cardHeader: { display: 'flex', gap: 6, marginBottom: 10 },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: '#fff' },
  offerName: { fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
  discount: { fontSize: 22, fontWeight: 700, color: '#3b82f6', marginBottom: 4 },
  desc: { fontSize: 13, color: '#64748b', margin: '4px 0' },
  dates: { display: 'flex', gap: 12, fontSize: 12, color: '#94a3b8', marginTop: 4 },
  modal: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 460 },
  modalTitle: { margin: '0 0 16px', fontSize: 18, fontWeight: 700 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 12, fontWeight: 600, color: '#64748b' },
  input: { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' },
};
