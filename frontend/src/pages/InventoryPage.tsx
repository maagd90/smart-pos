import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { inventoryApi, Product } from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Food', 'Beverage', 'Electronics', 'Clothing', 'Household', 'Other'];

interface ProductForm {
  name: string;
  sku: string;
  barcode: string;
  price: string;
  cost: string;
  category: string;
  stock: string;
  minStock: string;
}

const emptyForm: ProductForm = {
  name: '', sku: '', barcode: '', price: '', cost: '',
  category: 'Food', stock: '', minStock: '',
};

const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [showLowStock, setShowLowStock] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [stockAdjust, setStockAdjust] = useState('');
  const [stockReason, setStockReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getProducts({
        search: search || undefined,
        category: category || undefined,
        limit: 100,
      });
      setProducts(res.data.products);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  const loadLowStock = async () => {
    try {
      const res = await inventoryApi.getLowStockAlerts();
      setLowStock(res.data);
    } catch {
      setLowStock([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(), 300);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  useEffect(() => { loadLowStock(); }, []);

  const openEdit = (p: Product) => {
    setSelectedProduct(p);
    setForm({
      name: p.name, sku: p.sku, barcode: p.barcode || '',
      price: p.price.toString(), cost: p.cost.toString(),
      category: p.category, stock: p.stock.toString(), minStock: p.minStock.toString(),
    });
    setShowEditModal(true);
  };

  const openStockAdjust = (p: Product) => {
    setSelectedProduct(p);
    setStockAdjust('');
    setStockReason('');
    setShowStockModal(true);
  };

  const saveProduct = async () => {
    if (!form.name.trim() || !form.sku.trim()) { toast.error('Name and SKU are required'); return; }
    setSaving(true);
    try {
      const data = {
        name: form.name, sku: form.sku, barcode: form.barcode || undefined,
        price: parseFloat(form.price), cost: parseFloat(form.cost),
        category: form.category, stock: parseInt(form.stock), minStock: parseInt(form.minStock),
      };
      if (showEditModal && selectedProduct) {
        await inventoryApi.updateProduct(selectedProduct.id, data);
        toast.success('Product updated');
      } else {
        await inventoryApi.createProduct(data);
        toast.success('Product created');
      }
      setShowAddModal(false);
      setShowEditModal(false);
      loadProducts();
      loadLowStock();
    } catch {
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (p: Product) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await inventoryApi.deleteProduct(p.id);
      toast.success('Product deleted');
      loadProducts();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const adjustStock = async () => {
    if (!selectedProduct || !stockAdjust || !stockReason.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.adjustStock(selectedProduct.id, parseInt(stockAdjust), stockReason);
      toast.success('Stock adjusted');
      setShowStockModal(false);
      loadProducts();
      loadLowStock();
    } catch {
      toast.error('Failed to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  const ProductFormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Product name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">SKU *</label>
          <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="SKU-001" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Barcode</label>
          <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0000000000" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Price ($)</label>
          <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00" min="0" step="0.01" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Cost ($)</label>
          <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00" min="0" step="0.01" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock</label>
          <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0" min="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Stock</label>
          <input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="5" min="0" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory <span className="text-gray-400 text-base font-normal">({total})</span></h1>
        <button
          onClick={() => { setForm(emptyForm); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Low Stock Alert */}
      {showLowStock && lowStock.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Low Stock Alert: {lowStock.length} items</p>
            <p className="text-sm text-amber-700 mt-0.5">{lowStock.slice(0, 3).map((p) => p.name).join(', ')}{lowStock.length > 3 ? ` and ${lowStock.length - 3} more` : ''}</p>
          </div>
          <button onClick={() => setShowLowStock(false)} className="text-amber-400 hover:text-amber-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Product</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">SKU</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Category</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Price</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Cost</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Stock</th>
                <th className="text-center py-3 px-4 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-800">{p.name}</td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-xs">{p.sku}</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{p.category}</span></td>
                  <td className="py-3 px-4 text-right text-gray-700">${p.price.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-gray-500">${p.cost.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-semibold ${p.stock <= 0 ? 'text-red-600' : p.stock <= p.minStock ? 'text-amber-600' : 'text-green-600'}`}>
                      {p.stock}
                    </span>
                    <span className="text-gray-400 text-xs ml-1">/ {p.minStock} min</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openStockAdjust(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="Adjust Stock">
                        {parseInt(stockAdjust) >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteProduct(p)} className="p-1.5 text-red-400 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h3 className="font-bold text-lg">{showEditModal ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <ProductFormFields />
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={saveProduct} disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400">
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-lg">Adjust Stock</h3>
              <button onClick={() => setShowStockModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <span className="font-medium text-gray-800">{selectedProduct.name}</span>
                <span className="text-gray-500 ml-2">Current: <strong>{selectedProduct.stock}</strong></span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adjustment (+ add, - remove)</label>
                <input
                  type="number"
                  value={stockAdjust}
                  onChange={(e) => setStockAdjust(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+10 or -5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason</label>
                <input
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Restock, damage, correction..."
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowStockModal(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={adjustStock} disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400">
                  {saving ? 'Saving...' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
