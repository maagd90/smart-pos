import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Staff, UserRole } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const MOCK_STAFF: Staff[] = [
  { id: 's1', name: 'Jane Doe', email: 'jane@shop.com', role: 'cashier', isActive: true },
  { id: 's2', name: 'Mark Lee', email: 'mark@shop.com', role: 'manager', isActive: true },
];

const ROLES: UserRole[] = ['cashier', 'manager', 'analyst'];

interface StaffModalProps {
  initial?: Staff;
  onSave: (staff: Omit<Staff, 'id'>) => void;
  onCancel: () => void;
  error: string;
}

const StaffModal: React.FC<StaffModalProps> = ({ initial, onSave, onCancel, error }) => {
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [role, setRole] = useState<UserRole>(initial?.role || 'cashier');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    setNameError('');
    setEmailError('');
    if (!name.trim()) { setNameError('Name is required'); valid = false; }
    if (!email.trim()) { setEmailError('Email is required'); valid = false; }
    else if (!isValidEmail(email)) { setEmailError('Invalid email format'); valid = false; }
    if (!valid) return;
    onSave({ name, email, role, isActive: true });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Staff form"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
    >
      <div style={{ background: 'var(--panel)', borderRadius: 12, padding: 32, width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18 }}>{initial ? 'Edit Staff' : 'Add Staff'}</h2>
        {error && (
          <div role="alert" style={{ color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
            />
            {nameError && <p role="alert" style={{ color: '#dc2626', fontSize: 12, margin: '4px 0 0' }}>{nameError}</p>}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@shop.com"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
            />
            {emailError && <p role="alert" style={{ color: '#dc2626', fontSize: 12, margin: '4px 0 0' }}>{emailError}</p>}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }}
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="submit"
              style={{ flex: 1, padding: 10, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={onCancel}
              style={{ flex: 1, padding: 10, background: 'var(--bg)', color: 'var(--text)', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPanel: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
  const [modalError, setModalError] = useState('');
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchStaff = async () => {
      setIsLoadingStaff(true);
      try {
        const res = await api.get('/staff');
        setStaffList(res.data);
      } catch {
        // Fall back to mock data
        setStaffList(MOCK_STAFF);
        setFetchError('');
      } finally {
        setIsLoadingStaff(false);
      }
    };
    fetchStaff();
  }, []);

  const handleAddStaff = async (data: Omit<Staff, 'id'>) => {
    setModalError('');
    const duplicate = staffList.find((s) => s.email === data.email);
    if (duplicate) {
      setModalError('A staff member with this email already exists.');
      return;
    }
    try {
      await api.post('/staff', data);
      const newStaff: Staff = { ...data, id: `s${Date.now()}` };
      setStaffList((prev) => [...prev, newStaff]);
      setShowModal(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to add staff.';
      setModalError(msg);
    }
  };

  const handleEditStaff = async (data: Omit<Staff, 'id'>) => {
    if (!editingStaff) return;
    setModalError('');
    const duplicate = staffList.find((s) => s.email === data.email && s.id !== editingStaff.id);
    if (duplicate) {
      setModalError('A staff member with this email already exists.');
      return;
    }
    try {
      await api.put(`/staff/${editingStaff.id}`, data);
      setStaffList((prev) =>
        prev.map((s) => (s.id === editingStaff.id ? { ...s, ...data } : s))
      );
      setEditingStaff(undefined);
      setShowModal(false);
    } catch (err: any) {
      setModalError(err?.response?.data?.message || 'Failed to update staff.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/staff/${deleteTarget.id}`);
      setStaffList((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    } catch (err: any) {
      setFetchError(err?.response?.data?.message || 'Failed to delete staff.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Admin Panel</h1>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Sales', value: '$24,500' },
          { label: 'Total Customers', value: '142' },
          { label: 'Monthly Revenue', value: '$8,200' },
          { label: 'Staff Count', value: String(staffList.length) },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: 'var(--panel)', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{kpi.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Staff Management */}
      <div style={{ background: 'var(--panel)', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Staff Management</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => { setShowModal(true); setEditingStaff(undefined); setModalError(''); }}
              style={{ padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
            >
              + Add Staff
            </button>
            <button
              onClick={() => window.location.assign('/whatsapp')}
              data-testid="whatsapp-config-btn"
              style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
            >
              WhatsApp Config
            </button>
          </div>
        </div>

        {fetchError && (
          <div role="alert" style={{ color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
            {fetchError}
          </div>
        )}

        {isLoadingStaff ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <LoadingSpinner />
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--muted)', fontWeight: 600 }}>Name</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--muted)', fontWeight: 600 }}>Email</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--muted)', fontWeight: 600 }}>Role</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--muted)', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff) => (
                <tr key={staff.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px' }}>{staff.name}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>{staff.email}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ background: '#ede9fe', color: '#5b21b6', borderRadius: 99, padding: '2px 10px', fontSize: 12 }}>
                      {staff.role}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <button
                      aria-label={`Edit ${staff.name}`}
                      onClick={() => { setEditingStaff(staff); setShowModal(true); setModalError(''); }}
                      style={{ background: '#f0fdf4', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', marginRight: 6, color: '#16a34a', fontSize: 12 }}
                    >
                      Edit
                    </button>
                    <button
                      aria-label={`Delete ${staff.name}`}
                      onClick={() => setDeleteTarget(staff)}
                      style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#dc2626', fontSize: 12 }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Staff Modal */}
      {showModal && (
        <StaffModal
          initial={editingStaff}
          onSave={editingStaff ? handleEditStaff : handleAddStaff}
          onCancel={() => { setShowModal(false); setEditingStaff(undefined); setModalError(''); }}
          error={modalError}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm delete"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
        >
          <div style={{ background: 'var(--panel)', borderRadius: 12, padding: 28, width: 340, textAlign: 'center' }}>
            <p style={{ fontSize: 16, marginBottom: 20 }}>
              Delete <strong>{deleteTarget.name}</strong>?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={confirmDelete}
                style={{ padding: '8px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ padding: '8px 20px', background: 'var(--bg)', border: 'none', borderRadius: 8, cursor: 'pointer' }}
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

export default AdminPanel;
