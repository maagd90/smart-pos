import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import type { Product, Customer } from '../../types';

interface CartItem {
  product: Product;
  quantity: number;
}

interface ProductsResponse { products: Product[] }
interface CustomersResponse { customers: Customer[] }

export default function POS() {
  const { shopId } = useParams<{ shopId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discount, setDiscount] = useState(0);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    Promise.all([
      api.get<ProductsResponse>(`/api/shops/${shopId}/products?limit=100`),
      api.get<CustomersResponse>(`/api/shops/${shopId}/customers?limit=100`),
    ]).then(([pRes, cRes]) => {
      setProducts(pRes.data.products.filter((p) => p.isActive));
      setCustomers(cRes.data.customers);
    }).catch(console.error);
  }, [shopId]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + 1, product.stock) }
            : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
      );
    }
  }

  const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  async function handleCheckout() {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/api/shops/${shopId}/orders`, {
        customerId: selectedCustomer || undefined,
        discount,
        paymentMethod,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          price: i.product.price,
        })),
      });
      toast.success('Order completed! 🎉');
      setCart([]);
      setDiscount(0);
      setSelectedCustomer('');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Checkout failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.root}>
      {/* Product Grid */}
      <div style={styles.productsPane}>
        <div style={styles.searchBar}>
          <input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.grid}>
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock === 0}
              style={{ ...styles.productCard, ...(p.stock === 0 ? styles.outOfStock : {}) }}
            >
              <div style={styles.productCategory}>{p.category ?? 'General'}</div>
              <div style={styles.productName}>{p.name}</div>
              <div style={styles.productPrice}>${p.price.toFixed(2)}</div>
              <div style={styles.productStock}>Stock: {p.stock}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div style={styles.cartPane}>
        <h2 style={styles.cartTitle}>Order</h2>

        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          style={styles.select}
        >
          <option value="">Walk-in Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {cart.length === 0 ? (
          <div style={styles.emptyCart}>Add items to the cart</div>
        ) : (
          <div style={styles.cartItems}>
            {cart.map((item) => (
              <div key={item.product.id} style={styles.cartItem}>
                <div style={styles.cartItemInfo}>
                  <div style={styles.cartItemName}>{item.product.name}</div>
                  <div style={styles.cartItemPrice}>${item.product.price.toFixed(2)}</div>
                </div>
                <div style={styles.cartItemQty}>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} style={styles.qtyBtn}>−</button>
                  <span style={styles.qtyValue}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} style={styles.qtyBtn}>+</button>
                </div>
                <div style={styles.cartItemTotal}>${(item.product.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div style={styles.totals}>
          <div style={styles.totalRow}>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div style={styles.totalRow}>
            <span>Discount</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>$</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                style={styles.discountInput}
              />
            </div>
          </div>
          <div style={{ ...styles.totalRow, fontWeight: 700, fontSize: 20 }}>
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={styles.select}>
          <option value="CASH">Cash</option>
          <option value="CARD">Card</option>
          <option value="MOBILE">Mobile Payment</option>
        </select>

        <button
          onClick={() => void handleCheckout()}
          disabled={cart.length === 0 || isSubmitting}
          style={{ ...styles.checkoutBtn, opacity: cart.length === 0 ? 0.5 : 1 }}
        >
          {isSubmitting ? 'Processing…' : `Checkout — $${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { display: 'flex', gap: 24, height: 'calc(100vh - 48px)', overflow: 'hidden' },
  productsPane: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  searchBar: { marginBottom: 12 },
  searchInput: { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  grid: { flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, overflowY: 'auto', alignContent: 'start' },
  productCard: { padding: 14, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' },
  outOfStock: { opacity: 0.4, cursor: 'not-allowed' },
  productCategory: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  productName: { fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 8 },
  productPrice: { fontSize: 16, fontWeight: 700, color: '#3b82f6' },
  productStock: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  cartPane: { width: 340, backgroundColor: '#fff', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' },
  cartTitle: { fontSize: 18, fontWeight: 700, margin: 0, color: '#1e293b' },
  select: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, width: '100%' },
  emptyCart: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 },
  cartItems: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 },
  cartItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f1f5f9' },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 13, fontWeight: 500, color: '#374151' },
  cartItemPrice: { fontSize: 11, color: '#64748b' },
  cartItemQty: { display: 'flex', alignItems: 'center', gap: 4 },
  qtyBtn: { width: 24, height: 24, border: '1px solid #d1d5db', borderRadius: 4, backgroundColor: '#f8fafc', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  qtyValue: { width: 28, textAlign: 'center', fontSize: 13, fontWeight: 600 },
  cartItemTotal: { fontSize: 13, fontWeight: 700, color: '#1e293b', minWidth: 52, textAlign: 'right' },
  totals: { borderTop: '1px solid #f1f5f9', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#374151' },
  discountInput: { width: 64, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 },
  checkoutBtn: { padding: 14, backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 4 },
};
