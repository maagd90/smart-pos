import { create } from 'zustand';
import { CartItemType, Product } from '../types';

interface CartStore {
  items: CartItemType[];
  customerId: string | undefined;
  globalDiscount: number;
  notes: string;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, discount: number) => void;
  setCustomer: (customerId: string | undefined) => void;
  setGlobalDiscount: (discount: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  subtotal: () => number;
  total: (taxRate?: number) => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  customerId: undefined,
  globalDiscount: 0,
  notes: '',

  addItem: (product, quantity = 1) => {
    const items = get().items;
    const existing = items.find((i) => i.product.id === product.id);
    if (existing) {
      set({
        items: items.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        ),
      });
    } else {
      set({ items: [...items, { product, quantity, discount: 0, unitPrice: product.price }] });
    }
  },

  removeItem: (productId) =>
    set({ items: get().items.filter((i) => i.product.id !== productId) }),

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      ),
    });
  },

  updateItemDiscount: (productId, discount) =>
    set({
      items: get().items.map((i) =>
        i.product.id === productId ? { ...i, discount } : i
      ),
    }),

  setCustomer: (customerId) => set({ customerId }),
  setGlobalDiscount: (globalDiscount) => set({ globalDiscount }),
  setNotes: (notes) => set({ notes }),
  clearCart: () => set({ items: [], customerId: undefined, globalDiscount: 0, notes: '' }),

  subtotal: () =>
    get().items.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity;
      const itemDiscount = (itemTotal * item.discount) / 100;
      return sum + itemTotal - itemDiscount;
    }, 0),

  total: (taxRate = 0) => {
    const sub = get().subtotal();
    const globalDisc = (sub * get().globalDiscount) / 100;
    const afterDiscount = sub - globalDisc;
    const tax = (afterDiscount * taxRate) / 100;
    return afterDiscount + tax;
  },
}));
