import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { Product, LowStockAlert, UpdateStockData } from '../../types';
import { inventoryService } from '../../services/inventoryService';
import { ProductTable } from '../../components/inventory/ProductTable';
import { ProductForm } from '../../components/inventory/ProductForm';
import { StockAlert } from '../../components/inventory/StockAlert';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Food', 'Beverages', 'Electronics', 'Clothing', 'Health', 'Beauty', 'Other'];

export function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Stock adjustment form state
  const [stockQty, setStockQty] = useState('');
  const [stockOp, setStockOp] = useState<'set' | 'add' | 'subtract'>('add');
  const [stockExpiry, setStockExpiry] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getProducts({
        search: search || undefined,
        category: category !== 'All' ? category : undefined,
        page,
        limit: 20,
      });
      setProducts(res.data);
      setTotalPages(res.pagination.totalPages);
    } finally {
      setLoading(false);
    }
  }, [search, category, page]);

  const fetchAlerts = useCallback(async () => {
    const data = await inventoryService.getLowStockAlerts();
    setAlerts(data);
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleCreateProduct = async (data: Parameters<typeof inventoryService.createProduct>[0]) => {
    setFormLoading(true);
    try {
      await inventoryService.createProduct(data);
      toast.success('Product created successfully');
      setShowForm(false);
      fetchProducts();
      fetchAlerts();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error ?? 'Failed to create product');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateProduct = async (data: Parameters<typeof inventoryService.updateProduct>[1]) => {
    if (!editProduct) return;
    setFormLoading(true);
    try {
      await inventoryService.updateProduct(editProduct.id, data);
      toast.success('Product updated successfully');
      setEditProduct(null);
      fetchProducts();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error ?? 'Failed to update product');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This action cannot be undone.`)) return;
    try {
      await inventoryService.deleteProduct(product.id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error ?? 'Failed to delete product');
    }
  };

  const handleUpdateStock = async () => {
    if (!stockProduct) return;
    setFormLoading(true);
    try {
      const data: UpdateStockData = {
        quantity: Number(stockQty),
        operation: stockOp,
        expiryDate: stockExpiry || undefined,
      };
      await inventoryService.updateStock(stockProduct.id, data);
      toast.success('Stock updated successfully');
      setStockProduct(null);
      setStockQty('');
      setStockExpiry('');
      fetchProducts();
      fetchAlerts();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error ?? 'Failed to update stock');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your products and stock levels</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { fetchProducts(); fetchAlerts(); }} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <StockAlert
          alerts={alerts}
          onRestock={(alert) => {
            const product = products.find((p) => p.id === alert.id);
            if (product) setStockProduct(product);
          }}
        />
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                category === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <ProductTable
          products={products}
          loading={loading}
          onEdit={setEditProduct}
          onDelete={handleDeleteProduct}
          onStockUpdate={setStockProduct}
        />

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

      {/* Create Product Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add New Product" size="lg">
        <ProductForm
          onSubmit={handleCreateProduct}
          onCancel={() => setShowForm(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={!!editProduct} onClose={() => setEditProduct(null)} title="Edit Product" size="lg">
        <ProductForm
          product={editProduct}
          onSubmit={handleUpdateProduct}
          onCancel={() => setEditProduct(null)}
          loading={formLoading}
        />
      </Modal>

      {/* Stock Update Modal */}
      <Modal isOpen={!!stockProduct} onClose={() => setStockProduct(null)} title={`Update Stock: ${stockProduct?.name}`} size="sm">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-3">
              Current stock: <strong>{stockProduct?.stock?.quantity ?? 0}</strong>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Operation</label>
            <select
              value={stockOp}
              onChange={(e) => setStockOp(e.target.value as 'set' | 'add' | 'subtract')}
              className="input-field text-sm"
            >
              <option value="set">Set to</option>
              <option value="add">Add</option>
              <option value="subtract">Subtract</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              min={0}
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              className="input-field text-sm"
              placeholder="Enter quantity"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (optional)</label>
            <input
              type="date"
              value={stockExpiry}
              onChange={(e) => setStockExpiry(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStockProduct(null)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleUpdateStock}
              disabled={!stockQty || formLoading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {formLoading && <LoadingSpinner size="sm" />}
              Update Stock
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
