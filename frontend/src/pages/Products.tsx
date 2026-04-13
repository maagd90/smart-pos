import React, { useState } from 'react';
import { Product } from '../types';

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Coffee', price: 3.5, category: 'Beverages', stock: 100 },
  { id: '2', name: 'Tea', price: 2.5, category: 'Beverages', stock: 50 },
  { id: '3', name: 'Sandwich', price: 6.0, category: 'Food', stock: 20 },
  { id: '4', name: 'Cake Slice', price: 4.0, category: 'Food', stock: 15 },
  { id: '5', name: 'Water Bottle', price: 1.5, category: 'Beverages', stock: 0 },
  { id: '6', name: 'Juice', price: 3.0, category: 'Beverages', stock: 30 },
  { id: '7', name: 'Croissant', price: 2.8, category: 'Food', stock: 25 },
  { id: '8', name: 'Espresso', price: 4.5, category: 'Beverages', stock: 60 },
];

const Products: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(MOCK_PRODUCTS.map((p) => p.category)))];
  const filtered = MOCK_PRODUCTS.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || p.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: 'var(--text)' }}>Products</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>{filtered.length} products</p>
        </div>
        <button
          style={{
            padding: '9px 18px',
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          + Add Product
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          style={{
            flex: 1,
            padding: '9px 14px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 14,
            background: 'var(--panel)',
            color: 'var(--text)',
            outline: 'none',
          }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            padding: '9px 14px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 14,
            background: 'var(--panel)',
            color: 'var(--text)',
          }}
        >
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--panel)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(16,35,60,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--panel-soft)' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Product</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Category</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Price</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Stock</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text)' }}>{p.name}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: 'var(--panel-soft)', color: 'var(--primary)', borderRadius: 99, padding: '2px 10px', fontSize: 12, border: '1px solid var(--border)' }}>
                    {p.category}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text)' }}>${p.price.toFixed(2)}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <span style={{
                    color: p.stock === 0 ? 'var(--danger)' : p.stock < 20 ? 'var(--warning)' : 'var(--success)',
                    fontWeight: 600,
                  }}>
                    {p.stock === 0 ? 'Out of stock' : p.stock}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button style={{ background: 'var(--panel-soft)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--primary)', marginRight: 6 }}>Edit</button>
                  <button style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--danger)' }}>Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
