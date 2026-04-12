import React, { useState } from 'react';
import { CreditCard, Banknote, Smartphone, X, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { useCart } from '../../hooks/useCart';
import { posService } from '../../services/posService';
import { useCartStore } from '../../store/cartStore';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transactionId: string) => void;
}

const PAYMENT_METHODS: { method: PaymentMethod; label: string; icon: React.ElementType; color: string }[] = [
  { method: 'CASH', label: 'Cash', icon: Banknote, color: 'bg-green-50 border-green-200 text-green-700' },
  { method: 'CARD', label: 'Card', icon: CreditCard, color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { method: 'DIGITAL_WALLET', label: 'Digital Wallet', icon: Smartphone, color: 'bg-purple-50 border-purple-200 text-purple-700' },
];

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [loading, setLoading] = useState(false);

  const { items, customerId, globalDiscount, notes, total, taxRate, subtotal } = useCart();
  const clearCart = useCartStore((s) => s.clearCart);

  const cartTotal = total;
  const change = selectedMethod === 'CASH' ? Math.max(0, Number(cashReceived) - cartTotal) : 0;

  const handlePayment = async () => {
    if (!items.length) return;
    if (selectedMethod === 'CASH' && Number(cashReceived) < cartTotal) {
      toast.error('Insufficient cash received');
      return;
    }

    setLoading(true);
    try {
      const transaction = await posService.createTransaction({
        customerId,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          discount: i.discount,
        })),
        paymentMethod: selectedMethod,
        discount: globalDiscount,
        tax: taxRate,
        notes: notes || undefined,
      });

      clearCart();
      toast.success('Payment successful!');
      onSuccess(transaction.id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error ?? 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Payment"
      size="md"
      footer={
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
            <X className="h-4 w-4 mr-2 inline" />
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading || (selectedMethod === 'CASH' && Number(cashReceived) < cartTotal)}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? <LoadingSpinner size="sm" /> : <Check className="h-4 w-4" />}
            Confirm Payment
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Amount */}
        <div className="text-center bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-600 mb-1">Total Amount Due</p>
          <p className="text-4xl font-bold text-blue-700">{formatCurrency(cartTotal)}</p>
          <p className="text-xs text-blue-500 mt-1">{items.length} item{items.length !== 1 ? 's' : ''} · Subtotal {formatCurrency(subtotal)}</p>
        </div>

        {/* Payment method */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Payment Method</p>
          <div className="grid grid-cols-3 gap-3">
            {PAYMENT_METHODS.map(({ method, label, icon: Icon, color }) => (
              <button
                key={method}
                onClick={() => setSelectedMethod(method)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  selectedMethod === method
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-gray-700">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cash received */}
        {selectedMethod === 'CASH' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cash Received</label>
              <input
                type="number"
                min={cartTotal}
                step="0.01"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder={cartTotal.toFixed(2)}
                className="input-field text-lg font-semibold"
                autoFocus
              />
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2">
              {[cartTotal, Math.ceil(cartTotal / 10) * 10, Math.ceil(cartTotal / 50) * 50, Math.ceil(cartTotal / 100) * 100].map(
                (amt, i) => (
                  <button
                    key={i}
                    onClick={() => setCashReceived(amt.toFixed(2))}
                    className="px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    {formatCurrency(amt)}
                  </button>
                )
              )}
            </div>

            {Number(cashReceived) >= cartTotal && (
              <div className="flex justify-between items-center bg-green-50 rounded-lg p-3">
                <span className="text-sm text-green-700 font-medium">Change</span>
                <span className="text-lg font-bold text-green-700">{formatCurrency(change)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
