import React, { useState, useCallback } from 'react';
import api from '../services/api';
import { Product, CartItem, Customer } from '../types';

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Coffee', price: 3.5, category: 'Beverages', stock: 100 },
  { id: '2', name: 'Tea', price: 2.5, category: 'Beverages', stock: 50 },
  { id: '3', name: 'Sandwich', price: 6.0, category: 'Food', stock: 20 },
  { id: '4', name: 'Cake Slice', price: 4.0, category: 'Food', stock: 15 },
  { id: '5', name: 'Water Bottle', price: 1.5, category: 'Beverages', stock: 0 },
  { id: '6', name: 'Juice', price: 3.0, category: 'Beverages', stock: 30 },
];

const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 'c2', name: 'Bob Smith', email: 'bob@example.com' },
];

const categories = ['All', ...Array.from(new Set(MOCK_PRODUCTS.map((p) => p.category)))];

const POS: React.FC = () => {
  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(10);
  const [cartError, setCartError] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [receipt, setReceipt] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = useCallback((product: Product) => {
    if (product.stock === 0) {
      setCartError(`${product.name} is out of stock`);
      return;
    }
    setCartError('');
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => (i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0);
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const discountAmount = subtotal * (Math.min(discount, 100) / 100);
  const taxAmount = (subtotal - discountAmount) * (tax / 100);
  const total = Math.max(0, subtotal - discountAmount + taxAmount);

  const handleCheckout = async () => {
    setCheckoutError('');
    if (cart.length === 0) {
      setCheckoutError('Cart is empty. Please add products.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/orders', {
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        customerId: selectedCustomerId || undefined,
        discount,
        tax,
        total,
      });
      setReceipt({ ...response.data, items: cart, total });
      setCart([]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Checkout failed. Try again.';
      setCheckoutError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
        <div
          data-testid="receipt"
          style={{
            background: 'var(--panel)',
            borderRadius: 14,
            padding: 32,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}
        >
          <h2 style={{ color: '#16a34a', margin: '0 0 16px' }}>✓ Receipt</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Order ID: {receipt.id || 'ORD-001'}</p>
          {receipt.items.map((item: CartItem) => (
            <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: 14 }}>
              <span>{item.product.name} × {item.quantity}</span>
              <span>${(item.product.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 12, paddingTop: 12, fontWeight: 700 }}>
            Total: ${total.toFixed(2)}
          </div>
          <button
            onClick={() => setReceipt(null)}
            style={{
              marginTop: 20,
              width: '100%',
              padding: 10,
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            New Sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 120px)' }}>
      {/* Product grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ marginBottom: 12, display: 'flex', gap: 10 }}>
          <input
            type="text"
            placeholder="Search products..."
            aria-label="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 14,
            }}
          />
          <select
            aria-label="Filter by category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {cartError && (
          <div role="alert" style={{ color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 8, marginBottom: 10, fontSize: 13 }}>
            {cartError}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12,
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              aria-label={`Add ${product.name} to cart`}
              aria-disabled={product.stock === 0}
              style={{
                background: 'var(--panel)',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: 14,
                cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                opacity: product.stock === 0 ? 0.5 : 1,
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {product.name}
              </div>
              <div style={{ color: '#4f46e5', fontWeight: 700 }}>${product.price.toFixed(2)}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                {product.stock === 0 ? 'Out of stock' : `Stock: ${product.stock}`}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div
        style={{
          width: 320,
          background: 'var(--panel)',
          borderRadius: 14,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>Cart</h2>

        <select
          aria-label="Select customer"
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, marginBottom: 12 }}
        >
          <option value="">-- Select Customer (optional) --</option>
          {MOCK_CUSTOMERS.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
          {cart.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: 40, fontSize: 13 }}>
              Cart is empty
            </p>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                data-testid={`cart-item-${item.product.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13 }}
              >
                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.product.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    aria-label={`Decrease quantity of ${item.product.name}`}
                    onClick={() => updateQuantity(item.product.id, -1)}
                    style={{ width: 24, height: 24, border: '1px solid var(--border)', borderRadius: 4, background: 'var(--panel-soft)', cursor: 'pointer' }}
                  >
                    −
                  </button>
                  <span style={{ minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                  <button
                    aria-label={`Increase quantity of ${item.product.name}`}
                    onClick={() => updateQuantity(item.product.id, 1)}
                    style={{ width: 24, height: 24, border: '1px solid var(--border)', borderRadius: 4, background: 'var(--panel-soft)', cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>
                <div style={{ minWidth: 50, textAlign: 'right', fontWeight: 600 }}>
                  ${(item.product.price * item.quantity).toFixed(2)}
                </div>
                <button
                  aria-label={`Remove ${item.product.name} from cart`}
                  onClick={() => removeFromCart(item.product.id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13 }}>
            <label htmlFor="discount">Discount %</label>
            <input
              id="discount"
              type="number"
              min={0}
              max={100}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              style={{ width: 60, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13 }}>
            <label htmlFor="tax">Tax %</label>
            <input
              id="tax"
              type="number"
              min={0}
              value={tax}
              onChange={(e) => setTax(Number(e.target.value))}
              style={{ width: 60, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
            <span>Total</span>
            <span data-testid="cart-total">${total.toFixed(2)}</span>
          </div>

          {checkoutError && (
            <div role="alert" style={{ color: '#dc2626', background: '#fef2f2', padding: '8px 10px', borderRadius: 8, marginBottom: 10, fontSize: 12 }}>
              {checkoutError}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={isSubmitting}
            aria-label="Checkout"
            style={{
              width: '100%',
              padding: 11,
              background: isSubmitting ? '#a5b4fc' : '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: 15,
            }}
          >
            {isSubmitting ? 'Processing…' : 'Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;
