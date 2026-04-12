import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Star, Phone, Mail, X, ChevronRight, ShoppingBag } from 'lucide-react';
import { customersApi, Customer, Transaction } from '../services/api';
import toast from 'react-hot-toast';

const SEGMENTS = ['All', 'VIP', 'Regular', 'Occasional', 'New'];

const segmentColor: Record<string, string> = {
  VIP: 'bg-purple-100 text-purple-800',
  Regular: 'bg-blue-100 text-blue-800',
  Occasional: 'bg-yellow-100 text-yellow-800',
  New: 'bg-green-100 text-green-800',
};

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
}

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('All');
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerTxns, setCustomerTxns] = useState<Transaction[]>([]);
  const [txnLoading, setTxnLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<CustomerFormData>({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customersApi.getCustomers({
        search: search || undefined,
        segment: segment !== 'All' ? segment : undefined,
        limit: 50,
      });
      setCustomers(res.data.customers);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search, segment]);

  useEffect(() => {
    const timer = setTimeout(() => loadCustomers(), 300);
    return () => clearTimeout(timer);
  }, [loadCustomers]);

  const loadCustomerTxns = async (id: string) => {
    setTxnLoading(true);
    try {
      const res = await customersApi.getCustomerTransactions(id);
      setCustomerTxns(res.data);
    } catch {
      setCustomerTxns([]);
    } finally {
      setTxnLoading(false);
    }
  };

  const selectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    loadCustomerTxns(c.id);
  };

  const openEdit = (c: Customer) => {
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '' });
    setShowEditModal(true);
  };

  const saveCustomer = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (showEditModal && selectedCustomer) {
        await customersApi.updateCustomer(selectedCustomer.id, form);
        toast.success('Customer updated');
      } else {
        await customersApi.createCustomer(form);
        toast.success('Customer added');
      }
      setShowEditModal(false);
      setShowAddModal(false);
      loadCustomers();
    } catch {
      toast.error('Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Customer List */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Customers <span className="text-gray-400 text-base font-normal">({total})</span></h1>
          <button
            onClick={() => { setForm({ name: '', email: '', phone: '' }); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {SEGMENTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
          ) : customers.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400">No customers found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Segment</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Spent</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Points</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Visits</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => selectCustomer(c)}
                    className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${selectedCustomer?.id === c.id ? 'bg-blue-50' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800">{c.name}</div>
                      <div className="text-gray-400 text-xs">{c.email || c.phone || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${segmentColor[c.segment] || 'bg-gray-100 text-gray-700'}`}>{c.segment}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">${c.totalSpent.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="flex items-center justify-end gap-1 text-yellow-600">
                        <Star className="w-3 h-3" />{c.loyaltyPoints}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">{c.visitCount}</td>
                    <td className="py-3 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-gray-300 inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Customer Detail Panel */}
      {selectedCustomer && (
        <div className="w-80 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-start justify-between">
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-blue-700 font-bold text-lg">{selectedCustomer.name[0]}</span>
              </div>
              <h3 className="font-bold text-gray-900">{selectedCustomer.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${segmentColor[selectedCustomer.segment] || 'bg-gray-100 text-gray-700'}`}>
                {selectedCustomer.segment}
              </span>
            </div>
            <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Contact */}
            <div className="space-y-2">
              {selectedCustomer.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{selectedCustomer.email}</span>
                </div>
              )}
              {selectedCustomer.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{selectedCustomer.phone}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-blue-700">${selectedCustomer.totalSpent.toFixed(0)}</p>
                <p className="text-xs text-blue-600">Total Spent</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-yellow-700">{selectedCustomer.loyaltyPoints}</p>
                <p className="text-xs text-yellow-600">Points</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-green-700">{selectedCustomer.visitCount}</p>
                <p className="text-xs text-green-600">Visits</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-sm font-bold text-purple-700">
                  {selectedCustomer.lastVisit ? new Date(selectedCustomer.lastVisit).toLocaleDateString() : '—'}
                </p>
                <p className="text-xs text-purple-600">Last Visit</p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Recent Purchases
              </h4>
              {txnLoading ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : customerTxns.length === 0 ? (
                <p className="text-sm text-gray-400">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {customerTxns.slice(0, 5).map((txn) => (
                    <div key={txn.id} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-gray-800">#{txn.receiptNumber}</p>
                        <p className="text-xs text-gray-400">{new Date(txn.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className="font-semibold text-gray-800">${txn.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => openEdit(selectedCustomer)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Edit2 className="w-4 h-4" /> Edit Customer
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showEditModal || showAddModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-lg">{showEditModal ? 'Edit Customer' : 'Add Customer'}</h3>
              <button onClick={() => { setShowEditModal(false); setShowAddModal(false); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="customer@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1234567890"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowEditModal(false); setShowAddModal(false); }} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={saveCustomer} disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400">
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

export default CustomerManagement;
