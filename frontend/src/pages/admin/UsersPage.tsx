import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { User, CreateUserData, UpdateUserData } from '../../types';
import { adminService } from '../../services/adminService';
import { UserTable } from '../../components/admin/UserTable';
import { UserForm } from '../../components/admin/UserForm';
import { Modal } from '../../components/common/Modal';
import toast from 'react-hot-toast';

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (data: CreateUserData | UpdateUserData) => {
    setFormLoading(true);
    try {
      await adminService.createUser(data as CreateUserData);
      toast.success('User created successfully');
      setShowForm(false);
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error ?? 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: CreateUserData | UpdateUserData) => {
    if (!editUser) return;
    setFormLoading(true);
    try {
      await adminService.updateUser(editUser.id, data as UpdateUserData);
      toast.success('User updated');
      setEditUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error ?? 'Failed to update user');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage system users and roles</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchUsers} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Role legend */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />
            <span><strong>ADMIN</strong> - Full access</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-yellow-400 inline-block" />
            <span><strong>MANAGER</strong> - Manage products, customers, reports</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />
            <span><strong>CASHIER</strong> - POS only</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <UserTable users={users} loading={loading} onEdit={setEditUser} />
      </div>

      {/* Modals */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add New User" size="md">
        <UserForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={formLoading} />
      </Modal>

      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User" size="md">
        <UserForm
          user={editUser}
          onSubmit={handleUpdate}
          onCancel={() => setEditUser(null)}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
}
