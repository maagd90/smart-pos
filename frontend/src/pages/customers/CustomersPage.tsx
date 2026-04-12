import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { Customer, CreateCustomerData, UpdateCustomerData, CustomerSegment } from '../../types';
import { customerService } from '../../services/customerService';
import { CustomerTable } from '../../components/customers/CustomerTable';
import { CustomerForm } from '../../components/customers/CustomerForm';
import { Modal } from '../../components/common/Modal';
import toast from 'react-hot-toast';

const SEGMENTS: Array<CustomerSegment | 'All'> = ['All', 'VIP', 'REGULAR', 'INACTIVE', 'NEW'];

const segmentBadgeClass: Record<string, string> = {
  All: 'bg-gray-100 text-gray-600',
  VIP: 'bg-purple-100 text-purple-800',
  REGULAR: 'bg-blue-100 text-blue-800',
  INACTIVE: 'bg-gray-100 text-gray-600',
  NEW: 'bg-green-100 text-green-800',
};

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<CustomerSegment | 'All'>('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerService.getCustomers({
        search: search || undefined,
        segment: segment !== 'All' ? segment : undefined,
        page,
        limit: 20,
      });
      setCustomers(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } finally {
      setLoading(false);
    }
  }, [search, segment, page]);

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(t);
  }, [fetchCustomers]);

  const handleCreate = async (data: CreateCustomerData | UpdateCustomerData) => {
    setFormLoading(true);
    try {
      await customerService.createCustomer(data as CreateCustomerData);
      toast.success('Customer added');
      setShowForm(false);
      fetchCustomers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error ?? 'Failed to add customer');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: CreateCustomerData | UpdateCustomerData) => {
    if (!editCustomer) return;
    setFormLoading(true);
    try {
      await customerService.updateCustomer(editCustomer.id, data as UpdateCustomerData);
      toast.success('Customer updated');
      setEditCustomer(null);
      fetchCustomers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error ?? 'Failed to update customer');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total customers</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchCustomers} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2">
          {SEGMENTS.map((seg) => (
            <button
              key={seg}
              onClick={() => { setSegment(seg); setPage(1); }}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                segment === seg
                  ? 'ring-2 ring-offset-1 ring-blue-500 ' + segmentBadgeClass[seg]
                  : segmentBadgeClass[seg] + ' opacity-70 hover:opacity-100'
              }`}
            >
              {seg}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <CustomerTable customers={customers} loading={loading} onEdit={setEditCustomer} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-gray-100">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-40">Prev</button>
            <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Customer" size="md">
        <CustomerForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={formLoading} />
      </Modal>

      <Modal isOpen={!!editCustomer} onClose={() => setEditCustomer(null)} title="Edit Customer" size="md">
        <CustomerForm
          customer={editCustomer}
          onSubmit={handleUpdate}
          onCancel={() => setEditCustomer(null)}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
}
