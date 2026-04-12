import { useEffect, useState, useRef } from 'react';
import { Printer, Check } from 'lucide-react';
import { Transaction } from '../../types';
import { posService } from '../../services/posService';
import { formatCurrency, formatDateTime, paymentMethodLabel } from '../../utils/helpers';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useSettingsStore } from '../../store/settingsStore';

interface ReceiptProps {
  transactionId: string;
  onClose: () => void;
}

export function Receipt({ transactionId, onClose }: ReceiptProps) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);
  const settings = useSettingsStore((s) => s.settings);

  useEffect(() => {
    posService
      .getReceipt(transactionId)
      .then((d) => setTransaction(d.transaction))
      .catch(() => posService.getTransactionById(transactionId).then(setTransaction))
      .finally(() => setLoading(false));
  }, [transactionId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner size="lg" />
        <p className="mt-3 text-gray-500">Loading receipt...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Receipt not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-2 no-print">
        <button onClick={handlePrint} className="btn-secondary flex-1 flex items-center justify-center gap-2">
          <Printer className="h-4 w-4" />
          Print
        </button>
        <button onClick={onClose} className="btn-primary flex-1 flex items-center justify-center gap-2">
          <Check className="h-4 w-4" />
          Done
        </button>
      </div>

      {/* Receipt */}
      <div ref={printRef} className="bg-white border border-gray-200 rounded-xl p-6 font-mono text-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">{settings.storeName}</h1>
          {settings.storeAddress && <p className="text-gray-600 text-xs mt-1">{settings.storeAddress}</p>}
          {settings.storePhone && <p className="text-gray-600 text-xs">{settings.storePhone}</p>}
          <div className="border-t border-dashed border-gray-300 my-4" />
          <p className="text-xs text-gray-500">Receipt #{transaction.receiptNumber}</p>
          <p className="text-xs text-gray-500">{formatDateTime(transaction.createdAt)}</p>
          {transaction.customer && (
            <p className="text-xs text-gray-600 mt-1">Customer: {transaction.customer.name}</p>
          )}
        </div>

        {/* Items */}
        <div className="space-y-2 mb-4">
          {transaction.items.map((item) => (
            <div key={item.id} className="flex justify-between text-xs gap-2">
              <div className="flex-1">
                <p className="font-medium">{item.productName}</p>
                <p className="text-gray-500">
                  {item.quantity} × {formatCurrency(item.unitPrice)}
                  {item.discount > 0 && ` (-${item.discount}%)`}
                </p>
              </div>
              <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-300 my-3" />

        {/* Totals */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(transaction.subtotal)}</span>
          </div>
          {transaction.discount > 0 && (
            <div className="flex justify-between text-red-500">
              <span>Discount</span>
              <span>-{formatCurrency(transaction.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatCurrency(transaction.tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm pt-2 border-t border-gray-200">
            <span>TOTAL</span>
            <span>{formatCurrency(transaction.total)}</span>
          </div>
          <div className="flex justify-between text-gray-500 mt-1">
            <span>Payment</span>
            <span>{paymentMethodLabel(transaction.paymentMethod)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-300 my-4" />

        {/* Footer */}
        <div className="text-center text-xs text-gray-400">
          <p>{settings.receiptFooter}</p>
          <p className="mt-1">Status: {transaction.status}</p>
        </div>
      </div>
    </div>
  );
}
