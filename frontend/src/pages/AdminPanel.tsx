import React, { useState, useEffect } from 'react';
import {
  Users, Settings, Cpu, MessageSquare, ClipboardList, Monitor,
  Plus, Edit2, Trash2, X, CheckCircle, XCircle, ToggleLeft, ToggleRight
} from 'lucide-react';
import { adminApi, settingsApi, User, AuditLog, Machine, Settings as AppSettings } from '../services/api';
import toast from 'react-hot-toast';

type Tab = 'staff' | 'settings' | 'ai' | 'messaging' | 'audit' | 'machines';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'staff', label: 'Staff', icon: <Users className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  { id: 'ai', label: 'AI Config', icon: <Cpu className="w-4 h-4" /> },
  { id: 'messaging', label: 'Messaging', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'audit', label: 'Audit Logs', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'machines', label: 'Machines', icon: <Monitor className="w-4 h-4" /> },
];

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: User['role'];
}

const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState<Tab>('staff');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [settings, setSettings] = useState<Partial<AppSettings>>({});
  const [loading, setLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<UserForm>({ name: '', email: '', password: '', role: 'CASHIER' });
  const [saving, setSaving] = useState(false);

  const loadData = async (t: Tab) => {
    setLoading(true);
    try {
      if (t === 'staff') {
        const res = await adminApi.getUsers();
        setUsers(res.data);
      } else if (t === 'audit') {
        const res = await adminApi.getAuditLogs({ limit: 50 });
        setAuditLogs(res.data.logs);
      } else if (t === 'machines') {
        const res = await adminApi.getMachines();
        setMachines(res.data);
      } else if (t === 'settings' || t === 'ai' || t === 'messaging') {
        const res = await settingsApi.getSettings();
        setSettings(res.data);
      }
    } catch {
      // Mock data
      if (t === 'staff') {
        setUsers([
          { id: '1', name: 'Alice Owner', email: 'owner@smartpos.com', role: 'OWNER', isActive: true, createdAt: new Date().toISOString() },
          { id: '2', name: 'Bob Manager', email: 'manager@smartpos.com', role: 'MANAGER', isActive: true, createdAt: new Date().toISOString() },
          { id: '3', name: 'Carol Cashier', email: 'cashier@smartpos.com', role: 'CASHIER', isActive: true, createdAt: new Date().toISOString() },
        ]);
      } else if (t === 'settings' || t === 'ai' || t === 'messaging') {
        setSettings({
          storeName: 'Smart POS Store', currency: 'USD', taxRate: 10,
          loyaltyPointsRate: 1, receiptFooter: 'Thank you for shopping!',
          enableAI: true, aiProvider: 'openai',
          enableWhatsApp: true, enableSMS: false, enableEmail: true,
        });
      } else if (t === 'machines') {
        setMachines([
          { id: '1', name: 'POS Terminal 1', location: 'Counter A', status: 'ONLINE', lastSeen: new Date().toISOString(), version: '1.0.0' },
          { id: '2', name: 'POS Terminal 2', location: 'Counter B', status: 'OFFLINE', lastSeen: new Date(Date.now() - 3600000).toISOString(), version: '1.0.0' },
        ]);
      } else if (t === 'audit') {
        setAuditLogs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(tab); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({ name: '', email: '', password: '', role: 'CASHIER' });
    setShowUserModal(true);
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({ name: u.name, email: u.email, password: '', role: u.role });
    setShowUserModal(true);
  };

  const saveUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim()) { toast.error('Name and email required'); return; }
    if (!editingUser && !userForm.password.trim()) { toast.error('Password required for new user'); return; }
    setSaving(true);
    try {
      if (editingUser) {
        await adminApi.updateUser(editingUser.id, { name: userForm.name, email: userForm.email, role: userForm.role });
        toast.success('User updated');
      } else {
        await adminApi.createUser({ ...userForm });
        toast.success('User created');
      }
      setShowUserModal(false);
      loadData('staff');
    } catch {
      toast.error('Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (u: User) => {
    if (!window.confirm(`Delete "${u.name}"?`)) return;
    try {
      await adminApi.deleteUser(u.id);
      toast.success('User deleted');
      loadData('staff');
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await settingsApi.updateSettings(settings);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const roleBadge: Record<string, string> = {
    OWNER: 'bg-purple-100 text-purple-800',
    MANAGER: 'bg-blue-100 text-blue-800',
    CASHIER: 'bg-green-100 text-green-800',
    ANALYST: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
              tab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32 text-gray-400">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Staff Tab */}
      {tab === 'staff' && !loading && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openAddUser} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Staff
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Role</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">Status</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{u.name}</td>
                    <td className="py-3 px-4 text-gray-500">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge[u.role] || 'bg-gray-100 text-gray-700'}`}>{u.role}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.isActive
                        ? <CheckCircle className="w-4 h-4 text-green-500 inline" />
                        : <XCircle className="w-4 h-4 text-red-400 inline" />}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEditUser(u)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteUser(u)} className="p-1.5 text-red-400 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h3 className="font-semibold text-gray-800">General Settings</h3>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Name</label>
              <input value={settings.storeName || ''} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
              <select value={settings.currency || 'USD'} onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {['USD', 'EUR', 'GBP', 'JPY', 'IDR'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax Rate (%)</label>
              <input type="number" value={settings.taxRate || 0} onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" max="100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Loyalty Points Rate</label>
              <input type="number" value={settings.loyaltyPointsRate || 1} onChange={(e) => setSettings({ ...settings, loyaltyPointsRate: parseFloat(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" step="0.1" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Receipt Footer</label>
              <textarea value={settings.receiptFooter || ''} onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                rows={2} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
          <button onClick={saveSettings} disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 text-sm font-medium">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}

      {/* AI Tab */}
      {tab === 'ai' && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <h3 className="font-semibold text-gray-800">AI Configuration</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-800">Enable AI Features</p>
              <p className="text-sm text-gray-500">AI-powered insights, recommendations, and message generation</p>
            </div>
            <button onClick={() => setSettings({ ...settings, enableAI: !settings.enableAI })}>
              {settings.enableAI
                ? <ToggleRight className="w-10 h-10 text-blue-600" />
                : <ToggleLeft className="w-10 h-10 text-gray-400" />}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">AI Provider</label>
            <select value={settings.aiProvider || 'openai'} onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white max-w-xs">
              <option value="openai">OpenAI (GPT-4)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="gemini">Google (Gemini)</option>
              <option value="local">Local LLM (Ollama)</option>
            </select>
          </div>
          <button onClick={saveSettings} disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 text-sm font-medium">
            {saving ? 'Saving...' : 'Save AI Settings'}
          </button>
        </div>
      )}

      {/* Messaging Setup Tab */}
      {tab === 'messaging' && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <h3 className="font-semibold text-gray-800">Messaging Channels</h3>
          {[
            { key: 'enableWhatsApp' as keyof AppSettings, label: 'WhatsApp', desc: 'Send messages via WhatsApp Business API', icon: <MessageSquare className="w-5 h-5 text-green-600" /> },
            { key: 'enableSMS' as keyof AppSettings, label: 'SMS', desc: 'Send SMS via Twilio or similar provider', icon: <MessageSquare className="w-5 h-5 text-blue-600" /> },
            { key: 'enableEmail' as keyof AppSettings, label: 'Email', desc: 'Send emails via SMTP or SendGrid', icon: <MessageSquare className="w-5 h-5 text-purple-600" /> },
          ].map(({ key, label, desc, icon }) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                {icon}
                <div>
                  <p className="font-medium text-gray-800">{label}</p>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              </div>
              <button onClick={() => setSettings({ ...settings, [key]: !settings[key] })}>
                {settings[key]
                  ? <ToggleRight className="w-10 h-10 text-blue-600" />
                  : <ToggleLeft className="w-10 h-10 text-gray-400" />}
              </button>
            </div>
          ))}
          <button onClick={saveSettings} disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 text-sm font-medium">
            {saving ? 'Saving...' : 'Save Messaging Settings'}
          </button>
        </div>
      )}

      {/* Audit Logs Tab */}
      {tab === 'audit' && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400">No audit logs available</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Action</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Entity</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">User</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{log.action}</td>
                    <td className="py-3 px-4 text-gray-600">{log.entity}</td>
                    <td className="py-3 px-4 text-gray-600">{log.user?.name || '—'}</td>
                    <td className="py-3 px-4 text-right text-gray-400 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Machines Tab */}
      {tab === 'machines' && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <Monitor className="w-8 h-8 text-blue-600" />
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.status === 'ONLINE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {m.status}
                </span>
              </div>
              <h4 className="font-semibold text-gray-800">{m.name}</h4>
              <p className="text-sm text-gray-500">{m.location}</p>
              <div className="mt-3 space-y-1 text-xs text-gray-400">
                <p>Version: {m.version}</p>
                <p>Last seen: {new Date(m.lastSeen).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-lg">{editingUser ? 'Edit Staff' : 'Add Staff'}</h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="staff@email.com" />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                  <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Password" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as User['role'] })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {(['OWNER', 'MANAGER', 'CASHIER', 'ANALYST'] as const).map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowUserModal(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={saveUser} disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
