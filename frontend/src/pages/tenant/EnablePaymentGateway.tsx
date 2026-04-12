import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAvailableGateways, useEnableGateway, useSetupChargeHistory } from '../../hooks/useSetupCharge';
import { GatewaySetupCharge } from '../../services/setupChargeApi';

interface Props {
  tenantId: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#92400e' },
  PAID: { bg: '#d1fae5', text: '#065f46' },
  FAILED: { bg: '#fee2e2', text: '#991b1b' },
  REFUNDED: { bg: '#e0e7ff', text: '#3730a3' },
};

const EnablePaymentGateway: React.FC<Props> = ({ tenantId }) => {
  const { gateways, loading: gatewaysLoading, error: gatewaysError } = useAvailableGateways();
  const { charges, loading: chargesLoading, error: chargesError, refetch: refetchCharges } =
    useSetupChargeHistory(tenantId);
  const { enableGateway, loading: enableLoading, error: enableError } = useEnableGateway();

  const [confirmGateway, setConfirmGateway] = useState<{
    gatewayName: string;
    displayName: string;
    setupFee: number;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const enabledGatewayNames = new Set(
    charges
      .filter((c: GatewaySetupCharge) => c.status === 'PAID')
      .map((c: GatewaySetupCharge) => c.gatewayName)
  );
  const pendingGatewayNames = new Set(
    charges
      .filter((c: GatewaySetupCharge) => c.status === 'PENDING')
      .map((c: GatewaySetupCharge) => c.gatewayName)
  );

  const handleEnable = async () => {
    if (!confirmGateway) return;
    const result = await enableGateway(tenantId, confirmGateway.gatewayName);
    if (result) {
      setSuccessMessage(
        `Setup charge of PKR ${confirmGateway.setupFee.toLocaleString()} created for ${confirmGateway.displayName}. Please complete payment to activate.`
      );
      setConfirmGateway(null);
      refetchCharges();
    }
  };

  const loading = gatewaysLoading || chargesLoading;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Enable Payment Gateways</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          Select a payment gateway to enable for your store. A one-time setup fee applies.
        </p>
      </div>

      {(gatewaysError || chargesError || enableError) && (
        <div role="alert" style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {gatewaysError || chargesError || enableError}
        </div>
      )}

      {successMessage && (
        <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {successMessage}
          <button
            onClick={() => setSuccessMessage('')}
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#065f46', fontWeight: 700 }}
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Available Gateways */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Available Gateways</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {gateways.map((g) => {
                const isEnabled = enabledGatewayNames.has(g.gatewayName);
                const isPending = pendingGatewayNames.has(g.gatewayName);
                return (
                  <div
                    key={g.id}
                    style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: 20,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      border: isEnabled ? '2px solid #34d399' : '2px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{g.displayName}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{g.gatewayName}</div>
                      </div>
                      {isEnabled && (
                        <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#d1fae5', color: '#065f46' }}>
                          Active
                        </span>
                      )}
                      {isPending && !isEnabled && (
                        <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#fef3c7', color: '#92400e' }}>
                          Pending
                        </span>
                      )}
                    </div>
                    {g.description && (
                      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{g.description}</p>
                    )}
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
                      PKR {g.setupFee.toLocaleString()}
                      <span style={{ fontSize: 13, fontWeight: 400, color: '#9ca3af', marginLeft: 4 }}>one-time</span>
                    </div>
                    <button
                      onClick={() => setConfirmGateway({ gatewayName: g.gatewayName, displayName: g.displayName, setupFee: g.setupFee })}
                      disabled={isEnabled || isPending || enableLoading}
                      style={{
                        width: '100%',
                        padding: '10px 0',
                        borderRadius: 8,
                        border: 'none',
                        cursor: isEnabled || isPending ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        fontSize: 14,
                        background: isEnabled ? '#d1fae5' : isPending ? '#fef3c7' : '#4f46e5',
                        color: isEnabled ? '#065f46' : isPending ? '#92400e' : '#fff',
                      }}
                    >
                      {isEnabled ? '✓ Enabled' : isPending ? '⏳ Payment Pending' : 'Enable Gateway'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Setup Charge History */}
          {charges.length > 0 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Setup Charge History</h2>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      {['Gateway', 'Setup Fee', 'Status', 'Requested', 'Paid'].map((h) => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {charges.map((c: GatewaySetupCharge) => {
                      const colors = STATUS_COLORS[c.status] || STATUS_COLORS.PENDING;
                      return (
                        <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px 12px', fontWeight: 600, fontSize: 14 }}>{c.gatewayName}</td>
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      {confirmGateway && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 400, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
            <h3 style={{ margin: '0 0 8px' }}>Enable {confirmGateway.displayName}</h3>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 8 }}>
              A one-time setup fee will be charged:
            </p>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 20 }}>
              PKR {confirmGateway.setupFee.toLocaleString()}
            </div>
            <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 20 }}>
              This will create a pending setup charge. The gateway will be activated after payment is confirmed.
            </p>
            {enableError && (
              <div style={{ color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
                {enableError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={handleEnable}
                disabled={enableLoading}
                style={{ padding: '10px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 15 }}
              >
                {enableLoading ? 'Processing...' : 'Confirm & Pay'}
              </button>
              <button
                onClick={() => setConfirmGateway(null)}
                style={{ padding: '10px 24px', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnablePaymentGateway;
