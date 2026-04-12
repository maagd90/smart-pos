import React from 'react';
import { Tenant } from '../services/tenantService';
import StatusBadge from './StatusBadge';

interface TenantTableProps {
  tenants: Tenant[];
  onView: (t: Tenant) => void;
  onEdit: (t: Tenant) => void;
  onDelete: (t: Tenant) => void;
  onRetry: (t: Tenant) => void;
}

const TenantTable: React.FC<TenantTableProps> = ({ tenants, onView, onEdit, onDelete, onRetry }) => {
  if (tenants.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
        No tenants found. Create your first tenant to get started.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
            <th style={{ textAlign: 'left', padding: '10px 14px', color: '#6b7280', fontWeight: 600 }}>Tenant</th>
            <th style={{ textAlign: 'left', padding: '10px 14px', color: '#6b7280', fontWeight: 600 }}>Domain</th>
            <th style={{ textAlign: 'left', padding: '10px 14px', color: '#6b7280', fontWeight: 600 }}>Plan</th>
            <th style={{ textAlign: 'left', padding: '10px 14px', color: '#6b7280', fontWeight: 600 }}>IP Access</th>
            <th style={{ textAlign: 'left', padding: '10px 14px', color: '#6b7280', fontWeight: 600 }}>Status</th>
            <th style={{ textAlign: 'right', padding: '10px 14px', color: '#6b7280', fontWeight: 600 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '12px 14px' }}>
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div style={{ color: '#9ca3af', fontSize: 12 }}>{t.adminEmail}</div>
              </td>
              <td style={{ padding: '12px 14px', color: '#4b5563' }}>
                <a href={`https://${t.domain}`} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', textDecoration: 'none' }}>
                  {t.domain}
                </a>
              </td>
              <td style={{ padding: '12px 14px' }}>
                <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                  {t.subscriptionPlan}
                </span>
              </td>
              <td style={{ padding: '12px 14px', color: '#4b5563', fontSize: 12 }}>
                {t.ipRestrictEnabled ? (
                  t.ipWhitelist.length > 0 ? t.ipWhitelist.join(', ') : 'Restricted (none)'
                ) : (
                  <span style={{ color: '#16a34a' }}>0.0.0.0/0 (all)</span>
                )}
              </td>
              <td style={{ padding: '12px 14px' }}>
                <StatusBadge status={t.status} />
              </td>
              <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button onClick={() => onView(t)} style={btnStyle('#f0f9ff', '#0369a1')}>View</button>
                  <button onClick={() => onEdit(t)} style={btnStyle('#f0fdf4', '#16a34a')}>Edit</button>
                  {t.status === 'FAILED' && (
                    <button onClick={() => onRetry(t)} style={btnStyle('#fef3c7', '#d97706')}>Retry</button>
                  )}
                  <button onClick={() => onDelete(t)} style={btnStyle('#fef2f2', '#dc2626')}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function btnStyle(bg: string, color: string) {
  return {
    background: bg, color, border: 'none', borderRadius: 6,
    padding: '4px 10px', cursor: 'pointer' as const, fontSize: 12, fontWeight: 600,
  };
}

export default TenantTable;
