import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { Product } from '../types';

export function useCart() {
  const {
    items,
    customerId,
    globalDiscount,
    notes,
    addItem,
    removeItem,
    updateQuantity,
    updateItemDiscount,
    setCustomer,
    setGlobalDiscount,
    setNotes,
    clearCart,
    subtotal,
    total,
  } = useCartStore();

  const taxRate = useSettingsStore((s) => s.settings.taxRate);
  const currency = useSettingsStore((s) => s.settings.currency);

  const cartSubtotal = subtotal();
  const globalDiscountAmount = (cartSubtotal * globalDiscount) / 100;
  const afterDiscount = cartSubtotal - globalDiscountAmount;
  const taxAmount = (afterDiscount * taxRate) / 100;
  const cartTotal = total(taxRate);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const handleAddProduct = (product: Product) => {
    const stock = product.stock?.quantity ?? 0;
    const inCart = items.find((i) => i.product.id === product.id)?.quantity ?? 0;
    if (inCart >= stock) {
      return false;
    }
    addItem(product);
    return true;
  };

  return {
    items,
    customerId,
    globalDiscount,
    notes,
    addItem: handleAddProduct,
    removeItem,
    updateQuantity,
    updateItemDiscount,
    setCustomer,
    setGlobalDiscount,
    setNotes,
    clearCart,
    subtotal: cartSubtotal,
    globalDiscountAmount,
    afterDiscount,
    taxAmount,
    taxRate,
    total: cartTotal,
    itemCount,
    currency,
  };
}
