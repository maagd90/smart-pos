import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import type { Product } from '../../types';

interface ProductsResponse { products: Product[]; total: number }

export default function Inventory() {
  const { shopId } = useParams<{ shopId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [editingStock, setEditingStock] = useState<{ id: string; stock: number } | null>(null);

  function load() {
    if (!shopId) return;
    setIsLoading(true);
    api.get<ProductsResponse>(`/api/shops/${shopId}/products?limit=100`)
      .then((r) => { setProducts(r.data.products); setTotal(r.data.total); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }

  useEffect(() => { load(); }, [shopId]);

  async function handleStockUpdate() {
    if (!editingStock) return;
    try {
      await api.put(`/api/shops/${shopId}/products/${editingStock.id}`, { stock: editingStock.stock });
      toast.success('Stock updated');
      setEditingStock(null);
      load();
    } catch { toast.error('Failed to update stock'); }
  }

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10);
  const outOfStock = products.filter((p) => p.stock === 0);

  return (
    <div>
      <h1 style={styles.title}>Inventory ({total})</h1>

      {outOfStock.length > 0 && (
        <div style={styles.alert}>
          ⚠️ <strong>{outOfStock.length} item(s)</strong> are out of stock
        </div>
      )}
      {lowStock.length > 0 && (
        <div style={{ ...styles.alert, backgroundColor: '#fffbeb', borderColor: '#fcd34d', color: '#92400e' }}>
          🔔 <strong>{lowStock.length} item(s)</strong> have low stock (≤ 10 units)
        </div>
      )}

      {isLoading ? <div style={styles.loading}>Loading…</div> : (
        <table style={styles.table}>
          <thead>
            <tr>{['Product', 'SKU', 'Category', 'Stock', 'Status', 'Actions'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td style={styles.td}>{p.name}</td>
                <td style={styles.td}>{p.sku ?? '—'}</td>
                <td style={styles.td}>{p.category ?? '—'}</td>
                <td style={styles.td}>
                  {editingStock?.id === p.id ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <input type="number" min="0" value={editingStock.stock}
                        onChange={(e) => setEditingStock({ ...editingStock, stock: parseInt(e.target.value) || 0 })}
                        style={{ width: 70, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 6 }} />
                      <button style={styles.btnSave} onClick={() => void handleStockUpdate()}>✓</button>
                      <button style={styles.btnCancel} onClick={() => setEditingStock(null)}>✗</button>
                    </div>
                  ) : (
                    <span style={{ fontWeight: 600, color: p.stock === 0 ? '#ef4444' : p.stock <= 10 ? '#f59e0b' : '#10b981' }}>
                      {p.stock}
                    </span>
                  )}
                </td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, backgroundColor: p.stock === 0 ? '#ef4444' : p.stock <= 10 ? '#f59e0b' : '#10b981' }}>
                    {p.stock === 0 ? 'Out of Stock' : p.stock <= 10 ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
                <td style={styles.td}>
                  <button style={styles.btnEdit} onClick={() => setEditingStock({ id: p.id, stock: p.stock })}>
                    Update Stock
                  </button>
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
  title: { fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 16 },
  loading: { padding: 40, textAlign: 'center', color: '#64748b' },
  alert: { padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#991b1b', marginBottom: 12, fontSize: 14 },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f8fafc' },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: '#fff' },
  btnEdit: { padding: '4px 10px', backgroundColor: '#dbeafe', color: '#2563eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  btnSave: { padding: '4px 8px', backgroundColor: '#dcfce7', color: '#166534', border: 'none', borderRadius: 6, cursor: 'pointer' },
  btnCancel: { padding: '4px 8px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer' },
};
