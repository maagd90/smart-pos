
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItemType } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onUpdateDiscount: (productId: string, discount: number) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove, onUpdateDiscount }: CartItemProps) {
  const itemTotal = item.unitPrice * item.quantity;
  const discountAmount = (itemTotal * item.discount) / 100;
  const subtotal = itemTotal - discountAmount;
  const stock = item.product.stock?.quantity ?? 0;

  return (
    <div className="flex flex-col gap-2 py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{item.product.name}</p>
          <p className="text-xs text-gray-400">{item.product.sku} · {formatCurrency(item.unitPrice)} each</p>
        </div>
        <button
          onClick={() => onRemove(item.product.id)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        {/* Quantity control */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
            className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
            disabled={item.quantity >= stock}
            className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-40"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Discount */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">Disc:</span>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={100}
              value={item.discount}
              onChange={(e) => onUpdateDiscount(item.product.id, Math.min(100, Math.max(0, Number(e.target.value))))}
              className="w-14 text-xs text-right border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
          </div>
        </div>

        {/* Subtotal */}
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800">{formatCurrency(subtotal)}</p>
          {item.discount > 0 && (
            <p className="text-xs text-red-500 line-through">{formatCurrency(itemTotal)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
