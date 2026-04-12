import { useState, useEffect } from 'react';
import { ShoppingBag, User, Percent, FileText, ChevronRight } from 'lucide-react';
import { CartItem } from './CartItem';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/helpers';
import { Customer } from '../../types';
import { customerService } from '../../services/customerService';

interface CartProps {
  onCheckout: () => void;
}

export function Cart({ onCheckout }: CartProps) {
  const {
    items, customerId: _customerId, globalDiscount, notes,
    removeItem, updateQuantity, updateItemDiscount,
    setCustomer, setGlobalDiscount, setNotes,
    subtotal, globalDiscountAmount, afterDiscount: _afterDiscount, taxAmount, taxRate, total, itemCount,
  } = useCart();

  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomers([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoadingCustomers(true);
      try {
        const res = await customerService.getCustomers({ search: customerSearch, limit: 5 });
        setCustomers(res.data);
        setShowCustomerDropdown(true);
      } finally {
        setLoadingCustomers(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomer(c.id);
    setCustomerSearch(c.name);
    setShowCustomerDropdown(false);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomer(undefined);
    setCustomerSearch('');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-gray-800">Cart</h2>
          {itemCount > 0 && (
            <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {itemCount}
            </span>
          )}
        </div>
      </div>

      {/* Customer selection */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer (optional)..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="input-field pl-10 pr-4 text-sm"
          />
          {loadingCustomers && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
          {showCustomerDropdown && customers.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 overflow-hidden">
              {customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCustomer(c)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.phone ?? c.email} · {c.loyaltyPoints} pts</p>
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedCustomer && (
          <div className="mt-2 flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
            <div>
              <p className="text-xs font-medium text-blue-800">{selectedCustomer.name}</p>
              <p className="text-xs text-blue-600">{selectedCustomer.loyaltyPoints} loyalty pts</p>
            </div>
            <button onClick={handleClearCustomer} className="text-xs text-blue-500 hover:text-blue-700">
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-300">
            <ShoppingBag className="h-16 w-16 mb-3 opacity-40" />
            <p className="text-sm">Cart is empty</p>
            <p className="text-xs">Add products to get started</p>
          </div>
        ) : (
          items.map((item) => (
            <CartItem
              key={item.product.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
              onUpdateDiscount={updateItemDiscount}
            />
          ))
        )}
      </div>

      {/* Totals & controls */}
      {items.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-4 space-y-3">
          {/* Global discount */}
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 flex-1">Order Discount</span>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-16 text-sm text-right border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
            </div>
          </div>

          {/* Notes */}
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-gray-400 mt-1" />
            <textarea
              placeholder="Order notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {globalDiscount > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Discount ({globalDiscount}%)</span>
                <span>-{formatCurrency(globalDiscountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax ({taxRate}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-200">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Checkout button */}
          <button
            onClick={onCheckout}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base"
          >
            Checkout
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
