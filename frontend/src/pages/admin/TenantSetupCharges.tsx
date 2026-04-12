import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { setupChargeApi, GatewaySetupCharge } from '../../services/setupChargeApi';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#92400e' },
  PAID: { bg: '#d1fae5', text: '#065f46' },
  FAILED: { bg: '#fee2e2', text: '#991b1b' },
  REFUNDED: { bg: '#e0e7ff', text: '#3730a3' },
};

const TenantSetupCharges: React.FC = () => {
  const [charges, setCharges] = useState<GatewaySetupCharge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  const fetchCharges = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await setupChargeApi.listSetupCharges(statusFilter ? { status: statusFilter } : undefined);
      setCharges(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load setup charges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharges();
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkPaid = async (charge: GatewaySetupCharge) => {
    setMarkingPaid(charge.id);
    try {
      await setupChargeApi.markChargePaid(charge.id);
      fetchCharges();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to mark as paid');
    } finally {
      setMarkingPaid(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Setup Charges</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          View and manage gateway setup charges across all tenants
        </p>
      </div>

      {error && (
        <div role="alert" style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {['', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: statusFilter === s ? '#4f46e5' : '#f3f4f6',
                color: statusFilter === s ? '#fff' : '#374151',
              }}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <LoadingSpinner />
          </div>
        ) : charges.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
            No setup charges found.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                {['Tenant', 'Gateway', 'Setup Fee', 'Status', 'Requested', 'Paid', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {charges.map((c) => {
                const colors = STATUS_COLORS[c.status] || STATUS_COLORS.PENDING;
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 12px', fontSize: 14 }}>
                      <div style={{ fontWeight: 600 }}>{c.tenant?.name || c.tenantId}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{c.tenant?.slug}</div>
                    </td>
                    <td style={{ padding: '12px 12px', fontSize: 14, fontWeight: 600 }}>{c.gatewayName}</td>
                    <td style={{ padding: '12px 12px', fontSize: 14 }}>PKR {c.setupFee.toLocaleString()}</td>
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: colors.bg, color: colors.text }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 12px', fontSize: 13, color: '#6b7280' }}>
                      {new Date(c.requestedAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 12px', fontSize: 13, color: '#6b7280' }}>
                      {c.paidDate ? new Date(c.paidDate).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      {c.status === 'PENDING' && (
                        <button
                          onClick={() => handleMarkPaid(c)}
                          disabled={markingPaid === c.id}
                          style={{ padding: '4px 12px', background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                        >
                          {markingPaid === c.id ? '...' : 'Mark Paid'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TenantSetupCharges;
