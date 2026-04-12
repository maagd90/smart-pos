import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAdminGatewayPricings } from '../../hooks/useSetupCharge';
import { PaymentGatewayPricing } from '../../services/setupChargeApi';

const PaymentGatewayPricingPage: React.FC = () => {
  const { pricings, loading, error, refetch, updatePricing, createPricing } =
    useAdminGatewayPricings();

  const [editTarget, setEditTarget] = useState<PaymentGatewayPricing | null>(null);
  const [editFee, setEditFee] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newGateway, setNewGateway] = useState({
    gatewayName: '',
    displayName: '',
    setupFee: '',
    description: '',
  });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const handleEditSave = async () => {
    if (!editTarget) return;
    setEditLoading(true);
    setEditError('');
    try {
      await updatePricing(editTarget.gatewayName, { setupFee: parseFloat(editFee) });
      setEditTarget(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update');
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggle = async (pricing: PaymentGatewayPricing) => {
    try {
      await updatePricing(pricing.gatewayName, { isAvailable: !pricing.isAvailable });
    } catch (err: any) {
      alert(err.message || 'Failed to toggle gateway');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      await createPricing({
        gatewayName: newGateway.gatewayName,
        displayName: newGateway.displayName,
        setupFee: parseFloat(newGateway.setupFee),
        description: newGateway.description || undefined,
      });
      setShowCreate(false);
      setNewGateway({ gatewayName: '', displayName: '', setupFee: '', description: '' });
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create gateway');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Payment Gateway Pricing</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            Configure setup fees for payment gateways
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(''); }}
          style={{ padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          + Add Gateway
        </button>
      </div>

      {error && (
        <div role="alert" style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <LoadingSpinner />
          </div>
        ) : pricings.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
            No payment gateways configured yet.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                {['Gateway', 'Display Name', 'Setup Fee (PKR)', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pricings.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 12px', fontWeight: 600, fontSize: 14 }}>{p.gatewayName}</td>
                  <td style={{ padding: '12px 12px', fontSize: 14 }}>{p.displayName}</td>
                  <td style={{ padding: '12px 12px', fontSize: 14 }}>
                    PKR {p.setupFee.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                      background: p.isAvailable ? '#d1fae5' : '#fee2e2',
                      color: p.isAvailable ? '#065f46' : '#991b1b',
                    }}>
                      {p.isAvailable ? 'Available' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => { setEditTarget(p); setEditFee(String(p.setupFee)); setEditError(''); }}
                        style={{ padding: '4px 12px', background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
                      >
                        Edit Fee
                      </button>
                      <button
                        onClick={() => handleToggle(p)}
                        style={{
                          padding: '4px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                          background: p.isAvailable ? '#fee2e2' : '#d1fae5',
                          color: p.isAvailable ? '#991b1b' : '#065f46',
                        }}
                      >
                        {p.isAvailable ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Fee Modal */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 360 }}>
            <h3 style={{ margin: '0 0 16px' }}>Edit Setup Fee — {editTarget.displayName}</h3>
            {editError && (
              <div style={{ color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
                {editError}
              </div>
            )}
            <label style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Setup Fee (PKR)</label>
            <input
              type="number"
              min={0}
              value={editFee}
              onChange={(e) => setEditFee(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, marginTop: 6, marginBottom: 16, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditTarget(null)} style={{ padding: '8px 20px', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={handleEditSave}
                disabled={editLoading}
                style={{ padding: '8px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                {editLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Gateway Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 420 }}>
            <h3 style={{ margin: '0 0 16px' }}>Add Payment Gateway</h3>
            {createError && (
              <div style={{ color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
                {createError}
              </div>
            )}
            <form onSubmit={handleCreate}>
              {[
                { label: 'Gateway Name (e.g. easypaisa)', key: 'gatewayName', type: 'text' },
                { label: 'Display Name', key: 'displayName', type: 'text' },
                { label: 'Setup Fee (PKR)', key: 'setupFee', type: 'number' },
                { label: 'Description (optional)', key: 'description', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{label}</label>
                  <input
                    type={type}
                    min={type === 'number' ? 0 : undefined}
                    value={(newGateway as any)[key]}
                    onChange={(e) => setNewGateway((prev) => ({ ...prev, [key]: e.target.value }))}
                    style={{ display: 'block', width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, marginTop: 4, boxSizing: 'border-box' }}
                    required={key !== 'description'}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '8px 20px', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
                <button
                  type="submit"
                  disabled={createLoading}
                  style={{ padding: '8px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                >
                  {createLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentGatewayPricingPage;
