import { Edit, Trash2, ChevronUp, Package } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency, formatDate, stockStatusColor, stockStatusLabel } from '../../utils/helpers';
import { Badge } from '../common/Badge';
import { clsx } from 'clsx';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onStockUpdate: (product: Product) => void;
  loading?: boolean;
}

export function ProductTable({ products, onEdit, onDelete, onStockUpdate, loading }: ProductTableProps) {
  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p>Loading products...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p>No products found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Cost</th>
            <th className="text-center px-4 py-3 font-medium text-gray-600">Stock</th>
            <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Expiry</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((product) => {
            const qty = product.stock?.quantity ?? 0;
            const statusColor = stockStatusColor(qty, product.reorderPoint);
            const statusLabel = stockStatusLabel(qty, product.reorderPoint);
            const expiry = product.stock?.expiryDate;
            const isExpiringSoon =
              expiry &&
              new Date(expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            return (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="h-9 w-9 rounded-lg object-cover" />
                      ) : (
                        <Package className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-gray-400 truncate max-w-xs">{product.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{product.sku}</td>
                <td className="px-4 py-3">
                  <Badge variant="gray">{product.category}</Badge>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">
                  {formatCurrency(product.price)}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">
                  {product.cost ? formatCurrency(product.cost) : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onStockUpdate(product)}
                    className={clsx(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80',
                      statusColor
                    )}
                  >
                    <ChevronUp className="h-3 w-3" />
                    {qty}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge
                    variant={
                      statusLabel === 'Out of Stock' ? 'danger' :
                      statusLabel === 'Low Stock' ? 'warning' : 'success'
                    }
                  >
                    {statusLabel}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {expiry ? (
                    <span className={clsx('text-xs', isExpiringSoon ? 'text-red-500 font-medium' : 'text-gray-500')}>
                      {formatDate(expiry)}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(product)}
                      className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(product)}
                      className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
