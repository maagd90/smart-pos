import React, { useState, useEffect, useRef } from 'react';
import { Search, Barcode, Tag } from 'lucide-react';
import { Product } from '../../types';
import { inventoryService } from '../../services/inventoryService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatCurrency } from '../../utils/helpers';
import { clsx } from 'clsx';

interface ProductSearchProps {
  onAddProduct: (product: Product) => void;
}

const CATEGORIES = ['All', 'Food', 'Beverages', 'Electronics', 'Clothing', 'Health', 'Beauty', 'Other'];

export function ProductSearch({ onAddProduct }: ProductSearchProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
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
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [search, category, page, fetchProducts]);

  const handleBarcodeSearch = async (barcode: string) => {
    if (!barcode.trim()) return;
    setLoading(true);
    try {
      const res = await inventoryService.getProducts({ search: barcode, limit: 5 });
      if (res.data.length === 1) {
        onAddProduct(res.data[0]);
        setSearch('');
      } else {
        setSearch(barcode);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-4 space-y-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10 pr-10"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>

        {/* Barcode input */}
        <div className="relative">
          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={barcodeRef}
            type="text"
            placeholder="Scan barcode..."
            className="input-field pl-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleBarcodeSearch(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={clsx(
                'flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                category === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <Tag className="h-3 w-3" />
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && products.length === 0 ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {products.map((product) => {
              const stock = product.stock?.quantity ?? 0;
              const outOfStock = stock === 0;
              return (
                <button
                  key={product.id}
                  onClick={() => !outOfStock && onAddProduct(product)}
                  disabled={outOfStock}
                  className={clsx(
                    'card p-3 text-left transition-all hover:shadow-md active:scale-95',
                    outOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300 cursor-pointer'
                  )}
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-800 line-clamp-2 mb-1">{product.name}</p>
                  <p className="text-xs text-gray-400 mb-1">{product.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-blue-600">
                      {formatCurrency(product.price)}
                    </span>
                    <span className={clsx(
                      'text-xs px-1.5 py-0.5 rounded',
                      stock === 0 ? 'bg-red-100 text-red-600' :
                      stock <= (product.reorderPoint || 5) ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    )}>
                      {outOfStock ? 'Out' : `${stock}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Package(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}
