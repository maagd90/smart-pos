import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import type { Product } from '../../../types';

interface ProductsResponse {
  products: Product[];
  total: number;
}

const EMPTY_FORM = {
  name: '', description: '', price: '', cost: '', stock: '0',
  sku: '', barcode: '', category: '', isActive: true,
};

export default function Products() {
  const { shopId } = useParams<{ shopId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');

  function load() {
    if (!shopId) return;
    setIsLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get<ProductsResponse>(`/api/shops/${shopId}/products${params}`)
      .then((r) => { setProducts(r.data.products); setTotal(r.data.total); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }

  useEffect(() => { load(); }, [shopId, search]);

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name, description: p.description ?? '', price: String(p.price),
      cost: String(p.cost ?? ''), stock: String(p.stock), sku: p.sku ?? '',
      barcode: p.barcode ?? '', category: p.category ?? '', isActive: p.isActive,
    });
    setShowCreate(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name, description: form.description || undefined,
      price: parseFloat(form.price), cost: form.cost ? parseFloat(form.cost) : undefined,
      stock: parseInt(form.stock), sku: form.sku || undefined, barcode: form.barcode || undefined,
      category: form.category || undefined, isActive: form.isActive,
    };
    try {
      if (editing) {
        await api.put(`/api/shops/${shopId}/products/${editing.id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post(`/api/shops/${shopId}/products`, payload);
        toast.success('Product created');
      }
      setShowCreate(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save product');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/api/shops/${shopId}/products/${id}`);
      toast.success('Product deleted');
      load();
    } catch { toast.error('Failed to delete product'); }
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Products ({total})</h1>
        <button style={styles.btn} onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowCreate(true); }}>+ Add Product</button>
      </div>

      <input placeholder="Search products…" value={search}
        onChange={(e) => setSearch(e.target.value)} style={{ ...styles.input, marginBottom: 16, maxWidth: 300 }} />

      {showCreate && (
        <div style={styles.modal}>
          <div style={styles.modalCard}>
            <h2 style={styles.modalTitle}>{editing ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={(e) => void handleSave(e)} style={styles.form}>
              <input placeholder="Product name *" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} style={styles.input} required />
              <input placeholder="Description" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} style={styles.input} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input placeholder="Price *" type="number" step="0.01" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })} style={styles.input} required />
                <input placeholder="Cost" type="number" step="0.01" value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })} style={styles.input} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <input placeholder="Stock" type="number" value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })} style={styles.input} />
                <input placeholder="SKU" value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })} style={styles.input} />
                <input placeholder="Category" value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })} style={styles.input} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="isActive" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                <label htmlFor="isActive" style={{ fontSize: 14 }}>Active</label>
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
        <table style={styles.table}>
          <thead>
            <tr>{['Name', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td style={styles.td}>{p.name}</td>
                <td style={styles.td}>{p.category ?? '—'}</td>
                <td style={styles.td}>${p.price.toFixed(2)}</td>
                <td style={styles.td}>{p.stock}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, backgroundColor: p.isActive ? '#10b981' : '#94a3b8' }}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={styles.td}>
                  <button style={styles.btnEdit} onClick={() => openEdit(p)}>Edit</button>
                  <button style={styles.btnDanger} onClick={() => void handleDelete(p.id)}>Delete</button>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 },
  loading: { padding: 40, textAlign: 'center', color: '#64748b' },
  btn: { padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  btnGhost: { padding: '8px 16px', backgroundColor: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer' },
  btnEdit: { padding: '4px 10px', backgroundColor: '#dbeafe', color: '#2563eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, marginRight: 4 },
  btnDanger: { padding: '4px 10px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f8fafc' },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: '#fff' },
  modal: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 480, maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { margin: '0 0 16px', fontSize: 18, fontWeight: 700 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' },
};
