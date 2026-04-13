import React, { useState } from 'react';

interface Transaction {
  id: string;
  orderNum: string;
  customer: string;
  items: number;
  total: number;
  method: 'cash' | 'card' | 'mobile';
  status: 'completed' | 'refunded' | 'pending';
  date: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', orderNum: '#1042', customer: 'Alice Johnson', items: 3, total: 14.50, method: 'card', status: 'completed', date: '2024-06-11 09:14' },
  { id: 't2', orderNum: '#1041', customer: 'Bob Smith', items: 1, total: 3.50, method: 'cash', status: 'completed', date: '2024-06-11 08:55' },
  { id: 't3', orderNum: '#1040', customer: 'Guest', items: 2, total: 9.00, method: 'mobile', status: 'completed', date: '2024-06-11 08:30' },
  { id: 't4', orderNum: '#1039', customer: 'Carol White', items: 4, total: 22.00, method: 'card', status: 'refunded', date: '2024-06-10 17:45' },
  { id: 't5', orderNum: '#1038', customer: 'David Brown', items: 2, total: 7.50, method: 'cash', status: 'completed', date: '2024-06-10 16:20' },
  { id: 't6', orderNum: '#1037', customer: 'Eva Martinez', items: 5, total: 31.00, method: 'card', status: 'completed', date: '2024-06-10 14:10' },
];

const STATUS_STYLES: Record<Transaction['status'], { color: string; bg: string }> = {
  completed: { color: 'var(--success)', bg: '#f0fdf4' },
  refunded: { color: 'var(--danger)', bg: '#fef2f2' },
  pending: { color: 'var(--warning)', bg: '#fffbeb' },
};

const METHOD_ICONS: Record<Transaction['method'], string> = { cash: '💵', card: '💳', mobile: '📱' };

const Transactions: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Transaction['status']>('all');

  const filtered = MOCK_TRANSACTIONS.filter((t) => {
    const matchSearch = t.orderNum.toLowerCase().includes(search.toLowerCase()) || t.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total = filtered.filter((t) => t.status === 'completed').reduce((s, t) => s + t.total, 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: 'var(--text)' }}>Transactions</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>Complete transaction history</p>
        </div>
        <div style={{ background: 'var(--panel)', borderRadius: 12, padding: '10px 18px', border: '1px solid var(--border)', textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 2 }}>FILTERED REVENUE</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>${total.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order # or customer…"
          style={{ flex: 1, padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--panel)', color: 'var(--text)', outline: 'none' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{ padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--panel)', color: 'var(--text)' }}
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="refunded">Refunded</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div style={{ background: 'var(--panel)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(16,35,60,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--panel-soft)' }}>
              {['Order', 'Customer', 'Items', 'Method', 'Total', 'Status', 'Date'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', fontSize: 13 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => {
              const s = STATUS_STYLES[t.status];
              return (
                <tr key={t.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--primary)' }}>{t.orderNum}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text)' }}>{t.customer}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{t.items}</td>
                  <td style={{ padding: '12px 16px' }}>{METHOD_ICONS[t.method]} {t.method}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text)' }}>${t.total.toFixed(2)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: s.bg, color: s.color, borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{t.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12 }}>{t.date}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>No transactions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;
