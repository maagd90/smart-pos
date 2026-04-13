import React, { useState } from 'react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  lastRestocked: string;
}

const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Coffee Beans', category: 'Raw Materials', stock: 45, minStock: 20, unit: 'kg', lastRestocked: '2024-06-01' },
  { id: '2', name: 'Milk', category: 'Dairy', stock: 12, minStock: 15, unit: 'L', lastRestocked: '2024-06-10' },
  { id: '3', name: 'Bread Loaves', category: 'Bakery', stock: 8, minStock: 10, unit: 'pcs', lastRestocked: '2024-06-09' },
  { id: '4', name: 'Orange Juice', category: 'Beverages', stock: 30, minStock: 10, unit: 'L', lastRestocked: '2024-06-05' },
  { id: '5', name: 'Sugar', category: 'Raw Materials', stock: 0, minStock: 5, unit: 'kg', lastRestocked: '2024-05-20' },
  { id: '6', name: 'Paper Cups', category: 'Supplies', stock: 200, minStock: 50, unit: 'pcs', lastRestocked: '2024-06-01' },
];

const getStatus = (stock: number, minStock: number) => {
  if (stock === 0) return { label: 'Out of Stock', color: 'var(--danger)', bg: '#fef2f2' };
  if (stock < minStock) return { label: 'Low Stock', color: 'var(--warning)', bg: '#fffbeb' };
  return { label: 'In Stock', color: 'var(--success)', bg: '#f0fdf4' };
};

const Inventory: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = MOCK_INVENTORY.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = MOCK_INVENTORY.filter((i) => i.stock < i.minStock).length;
  const outOfStock = MOCK_INVENTORY.filter((i) => i.stock === 0).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: 'var(--text)' }}>Inventory</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>Track stock levels and restocking</p>
        </div>
        <button style={{ padding: '9px 18px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          + Add Item
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <div style={{ background: 'var(--panel)', borderRadius: 12, padding: '16px 20px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 4 }}>Total Items</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{MOCK_INVENTORY.length}</div>
        </div>
        <div style={{ background: '#fffbeb', borderRadius: 12, padding: '16px 20px', border: '1px solid #fde68a' }}>
          <div style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 500, marginBottom: 4 }}>Low Stock</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--warning)' }}>{lowStock}</div>
        </div>
        <div style={{ background: '#fef2f2', borderRadius: 12, padding: '16px 20px', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 500, marginBottom: 4 }}>Out of Stock</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--danger)' }}>{outOfStock}</div>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search inventory…"
        style={{ width: '100%', padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--panel)', color: 'var(--text)', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }}
      />

      <div style={{ background: 'var(--panel)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(16,35,60,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--panel-soft)' }}>
              {['Item', 'Category', 'Stock', 'Min Stock', 'Status', 'Last Restocked', 'Actions'].map((h) => (
                <th key={h} style={{ textAlign: h === 'Actions' ? 'right' : 'left', padding: '12px 16px', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', fontSize: 13 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => {
              const status = getStatus(item.stock, item.minStock);
              return (
                <tr key={item.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text)' }}>{item.name}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{item.category}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text)' }}>{item.stock} {item.unit}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{item.minStock} {item.unit}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: status.bg, color: status.color, borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{status.label}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{item.lastRestocked}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button style={{ background: 'var(--panel-soft)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--primary)' }}>Restock</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
