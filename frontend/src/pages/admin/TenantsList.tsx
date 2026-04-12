import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenantService, Tenant, CreateTenantInput } from '../../services/tenantService';
import TenantTable from '../../components/TenantTable';
import TenantForm from '../../components/TenantForm';
import LoadingSpinner from '../../components/LoadingSpinner';

const TenantsList: React.FC = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await tenantService.list({ page, limit: 20, status: statusFilter || undefined });
      setTenants(res.items);
      setTotal(res.total);
    } catch {
      setError('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTenants(); }, [page, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (data: CreateTenantInput) => {
    setCreateLoading(true);
    setCreateError('');
    try {
      await tenantService.create(data);
      setShowCreate(false);
      fetchTenants();
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || 'Failed to create tenant');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await tenantService.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchTenants();
    } catch {
      setError('Failed to delete tenant');
    }
  };

  const handleRetry = async (t: Tenant) => {
    try {
      await tenantService.retry(t.id);
      fetchTenants();
    } catch {
      setError('Failed to retry tenant setup');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Tenant Management</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{total} tenant(s) total</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(''); }}
          style={{ padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          + Create New Tenant
        </button>
      </div>

      {error && (
        <div role="alert" style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {['', 'CREATING', 'ACTIVE', 'SUSPENDED', 'FAILED'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
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
        ) : (
          <TenantTable
            tenants={tenants}
            onView={(t) => navigate(`/platform/tenants/${t.id}`)}
            onEdit={(t) => navigate(`/platform/tenants/${t.id}/edit`)}
            onDelete={(t) => setDeleteTarget(t)}
            onRetry={handleRetry}
          />
        )}

        {total > 20 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer', background: '#fff' }}>← Prev</button>
            <span style={{ padding: '6px 14px', fontSize: 14, color: '#6b7280' }}>Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer', background: '#fff' }}>Next →</button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 32, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Create New Tenant</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            <TenantForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
              isLoading={createLoading}
              error={createError}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 360, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px' }}>Delete Tenant</h3>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={handleDelete} style={{ padding: '8px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Delete</button>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '8px 20px', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantsList;
