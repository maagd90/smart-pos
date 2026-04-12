import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tenantService, Tenant } from '../../services/tenantService';
import { useTenantStatus } from '../../hooks/useTenantStatus';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const TenantDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { status, setup, refetch } = useTenantStatus(id || null);

  useEffect(() => {
    if (!id) return;
    tenantService.get(id)
      .then(setTenant)
      .catch(() => setError('Failed to load tenant'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><LoadingSpinner /></div>;
  if (error) return <div style={{ color: '#dc2626', padding: 24 }}>{error}</div>;
  if (!tenant) return null;

  const steps = (setup?.steps as any[]) || [];

  const handleRetry = () => {
    tenantService.retry(tenant.id).then(() => refetch()).catch(() => {});
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/platform/tenants')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14 }}>
          ← Back
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{tenant.name}</h1>
        <StatusBadge status={status || tenant.status} />
        {tenant.status === 'FAILED' && (
          <button
            onClick={handleRetry}
            style={{ padding: '6px 14px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            Retry Setup
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Tenant Info</h3>
          {([
            ['Domain', <a href={`https://${tenant.domain}`} target="_blank" rel="noreferrer" style={{ color: '#4f46e5' }}>{tenant.domain}</a>],
            ['Admin Email', tenant.adminEmail],
            ['Admin Name', tenant.adminName],
            ['Plan', tenant.subscriptionPlan],
            ['Max Staff', String(tenant.maxStaff)],
            ['Created', new Date(tenant.createdAt).toLocaleString()],
          ] as [string, React.ReactNode][]).map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
              <span style={{ color: '#6b7280' }}>{label}</span>
              <span style={{ fontWeight: 500 }}>{val}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>IP Access Control</h3>
          <div style={{ marginBottom: 12, fontSize: 14 }}>
            <span style={{ color: '#6b7280' }}>Mode: </span>
            <strong>{tenant.ipRestrictEnabled ? 'Restricted' : 'Allow All (0.0.0.0/0)'}</strong>
          </div>
          {tenant.ipRestrictEnabled && tenant.ipWhitelist.length > 0 && (
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, fontFamily: 'monospace', fontSize: 13 }}>
              {tenant.ipWhitelist.map((ip, i) => (
                <div key={i} style={{ padding: '2px 0', color: '#374151' }}>{ip}</div>
              ))}
            </div>
          )}

          <h3 style={{ margin: '20px 0 12px', fontSize: 16, fontWeight: 700 }}>Features</h3>
          {([
            ['WhatsApp Messaging', tenant.whatsappEnabled],
            ['Email Notifications', tenant.emailEnabled],
            ['AI Features', tenant.aiEnabled],
            ['SMS', tenant.smsEnabled],
          ] as [string, boolean][]).map(([label, enabled]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
              <span style={{ color: '#6b7280' }}>{label}</span>
              <span style={{ color: enabled ? '#16a34a' : '#9ca3af', fontWeight: 600 }}>
                {enabled ? '✅ Enabled' : '○ Disabled'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Setup Progress */}
      {setup && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Setup Progress</h3>
          {setup.errorMessage && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              Error: {setup.errorMessage}
            </div>
          )}
          <div>
            {steps.length > 0 ? steps.map((step: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ width: 20, textAlign: 'center', fontSize: 16 }}>
                  {step.status === 'done' ? '✅' : step.status === 'running' ? '⏳' : step.status === 'failed' ? '❌' : '○'}
                </span>
                <span style={{ flex: 1, fontSize: 14, color: step.status === 'done' ? '#16a34a' : step.status === 'failed' ? '#dc2626' : '#374151' }}>
                  {step.message || step.name}
                </span>
                {step.completedAt && (
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>
                    {new Date(step.completedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            )) : (
              <p style={{ color: '#9ca3af', fontSize: 14 }}>No setup steps recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* API Keys */}
      {tenant.apiKeys && tenant.apiKeys.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>API Keys</h3>
          {tenant.apiKeys.map((key) => (
            <div key={key.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{key.name}</div>
                <div style={{ fontFamily: 'monospace', color: '#6b7280', fontSize: 12 }}>{key.keyPrefix}••••••••</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <StatusBadge status={key.status} />
                {key.lastUsedAt && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TenantDetails;
