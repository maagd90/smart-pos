import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Wallet, Banknote, X, Printer, Mail, MessageCircle } from 'lucide-react';
import { posApi, Product, Transaction, CartItem } from '../services/api';
import { onInventoryUpdate, offInventoryUpdate } from '../services/socket';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Food', 'Beverage', 'Electronics', 'Clothing', 'Household', 'Other'];

const POSPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'DIGITAL_WALLET'>('CASH');
  const [amountTendered, setAmountTendered] = useState('');
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [receiptEmail, setReceiptEmail] = useState('');
  const [receiptPhone, setReceiptPhone] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await posApi.getProducts(
        search || undefined,
        category !== 'All' ? category : undefined
      );
      setProducts(res.data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(), 300);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  useEffect(() => {
    const handler = () => loadProducts();
    onInventoryUpdate(handler);
    return () => offInventoryUpdate(handler);
  }, [loadProducts]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) { toast.error('Out of stock'); return; }
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) { toast.error('Insufficient stock'); return prev; }
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity * (1 - item.discount / 100), 0);
  const discountAmount = subtotal * (discount / 100);
  const tax = (subtotal - discountAmount) * 0.1;
  const total = subtotal - discountAmount + tax;
  const change = paymentMethod === 'CASH' ? parseFloat(amountTendered || '0') - total : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    if (paymentMethod === 'CASH' && parseFloat(amountTendered || '0') < total) {
      toast.error('Insufficient amount tendered');
      return;
    }
    try {
      const res = await posApi.createTransaction({
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity, discount: i.discount })),
        paymentMethod,
        discount,
        amountTendered: paymentMethod === 'CASH' ? parseFloat(amountTendered) : undefined,
      });
      setLastTransaction(res.data);
      setCart([]);
      setDiscount(0);
      setAmountTendered('');
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      toast.success(`Transaction #${res.data.receiptNumber} completed!`);
    } catch {
      toast.error('Transaction failed');
    }
  };

  const sendReceipt = async (channel: 'email' | 'whatsapp') => {
    if (!lastTransaction) return;
    const recipient = channel === 'email' ? receiptEmail : receiptPhone;
    if (!recipient) { toast.error('Please enter recipient'); return; }
    try {
      await posApi.sendReceipt(lastTransaction.id, channel, recipient);
      toast.success(`Receipt sent via ${channel}`);
    } catch {
      toast.error('Failed to send receipt');
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Left: Product Panel */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or barcode..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400">No products found</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md hover:border-blue-300 ${
                    product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div className="w-full h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg mb-3 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{product.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-blue-700 font-bold text-sm">${product.price.toFixed(2)}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${product.stock <= product.minStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {product.stock}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart Panel */}
      <div className="w-80 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" /> Cart
            <span className="ml-auto bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">{cart.length}</span>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <ShoppingCart className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-500">${item.product.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700">
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeFromCart(item.product.id)} className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">Discount %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({discount}%)</span><span>-${discountAmount.toFixed(2)}</span></div>}
            <div className="flex justify-between text-gray-600"><span>Tax (10%)</span><span>${tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Proceed to Payment
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-lg text-gray-900">Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Total Amount</p>
                <p className="text-4xl font-bold text-blue-700 mt-1">${total.toFixed(2)}</p>
              </div>

              {/* Payment Methods */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Payment Method</p>
                <div className="grid grid-cols-3 gap-3">
                  {([['CASH', 'Cash', Banknote], ['CARD', 'Card', CreditCard], ['DIGITAL_WALLET', 'Wallet', Wallet]] as const).map(([method, label, Icon]) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === method ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'CASH' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount Tendered</label>
                  <input
                    type="number"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {parseFloat(amountTendered || '0') >= total && (
                    <p className="text-green-600 text-sm mt-2 font-medium">Change: ${change.toFixed(2)}</p>
                  )}
                </div>
              )}

              <button
                onClick={handleCheckout}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-colors text-base"
              >
                Complete Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && lastTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 text-center border-b">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Transaction Complete!</h3>
              <p className="text-gray-500 text-sm mt-1">Receipt #{lastTransaction.receiptNumber}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold">${lastTransaction.total.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Payment</span><span>{lastTransaction.paymentMethod}</span></div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={receiptEmail}
                    onChange={(e) => setReceiptEmail(e.target.value)}
                    placeholder="Email receipt..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={() => sendReceipt('email')} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={receiptPhone}
                    onChange={(e) => setReceiptPhone(e.target.value)}
                    placeholder="WhatsApp number..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={() => sendReceipt('whatsapp')} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium"
                >
                  New Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSPage;
