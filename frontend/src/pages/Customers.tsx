import React, { useState } from 'react';
import { Customer } from '../types';

const MOCK_CUSTOMERS: (Customer & { orders: number; spent: number; joined: string })[] = [
  { id: 'c1', name: 'Alice Johnson', email: 'alice@example.com', phone: '+1 555-0101', orders: 12, spent: 148.5, joined: '2024-01-15' },
  { id: 'c2', name: 'Bob Smith', email: 'bob@example.com', phone: '+1 555-0102', orders: 7, spent: 89.0, joined: '2024-02-20' },
  { id: 'c3', name: 'Carol White', email: 'carol@example.com', phone: '+1 555-0103', orders: 24, spent: 312.75, joined: '2023-11-05' },
  { id: 'c4', name: 'David Brown', email: 'david@example.com', orders: 3, spent: 34.0, joined: '2024-03-10' },
  { id: 'c5', name: 'Eva Martinez', email: 'eva@example.com', phone: '+1 555-0105', orders: 18, spent: 225.0, joined: '2024-01-28' },
];

const Customers: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = MOCK_CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: 'var(--text)' }}>Customers</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>{filtered.length} customers</p>
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
          + Add Customer
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email…"
        style={{
          width: '100%',
          padding: '9px 14px',
          border: '1px solid var(--border)',
          borderRadius: 8,
          fontSize: 14,
          background: 'var(--panel)',
          color: 'var(--text)',
          outline: 'none',
          marginBottom: 16,
          boxSizing: 'border-box',
        }}
      />

      <div style={{ background: 'var(--panel)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(16,35,60,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--panel-soft)' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Phone</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Orders</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Total Spent</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                      {c.name.charAt(0)}
                    </div>
                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{c.email}</td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{c.phone || '—'}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text)' }}>{c.orders}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>${c.spent.toFixed(2)}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button style={{ background: 'var(--panel-soft)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--primary)' }}>View</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>No customers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;
