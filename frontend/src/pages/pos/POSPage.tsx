import { useState } from 'react';
import { ProductSearch } from '../../components/pos/ProductSearch';
import { Cart } from '../../components/pos/Cart';
import { PaymentModal } from '../../components/pos/PaymentModal';
import { Receipt } from '../../components/pos/Receipt';
import { Modal } from '../../components/common/Modal';
import { Product } from '../../types';
import { useCartStore } from '../../store/cartStore';
import toast from 'react-hot-toast';

export function POSPage() {
  const [showPayment, setShowPayment] = useState(false);
  const [receiptTransactionId, setReceiptTransactionId] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddProduct = (product: Product) => {
    const stock = product.stock?.quantity ?? 0;
    const items = useCartStore.getState().items;
    const inCart = items.find((i) => i.product.id === product.id)?.quantity ?? 0;
    if (inCart >= stock) {
      toast.error(`Not enough stock for ${product.name}`);
      return;
    }
    addItem(product);
    toast.success(`Added ${product.name}`, { duration: 1000 });
  };

  const handlePaymentSuccess = (transactionId: string) => {
    setShowPayment(false);
    setReceiptTransactionId(transactionId);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Product search */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
        <ProductSearch onAddProduct={handleAddProduct} />
      </div>

      {/* Right: Cart */}
      <div className="w-80 xl:w-96 flex flex-col overflow-hidden bg-white">
        <Cart onCheckout={() => setShowPayment(true)} />
      </div>

      {/* Payment modal */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Receipt modal */}
      <Modal
        isOpen={!!receiptTransactionId}
        onClose={() => setReceiptTransactionId(null)}
        title="Transaction Receipt"
        size="md"
      >
        {receiptTransactionId && (
          <Receipt
            transactionId={receiptTransactionId}
            onClose={() => setReceiptTransactionId(null)}
          />
        )}
      </Modal>
    </div>
  );
}
