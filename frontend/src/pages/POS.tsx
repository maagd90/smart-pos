import React, { useEffect, useState } from 'react';
import {
  Grid, Card, CardActionArea, Typography, Box, TextField,
  Button, Chip, Divider, IconButton, Select, MenuItem, FormControl,
  InputLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Badge, Paper, Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import { getProducts } from '../api/products';
import { getCustomers } from '../api/customers';
import { createSale } from '../api/sales';
import { Product, Customer, CartItem, Sale } from '../types';
import toast from 'react-hot-toast';

const POS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  useEffect(() => {
    getProducts().then(r => setProducts(r.data)).catch(() => toast.error('Failed to load products'));
    getCustomers().then(r => setCustomers(r.data)).catch(() => toast.error('Failed to load customers'));
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || p.category === category;
    return matchSearch && matchCat && p.stock > 0;
  });

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error('Not enough stock');
          return prev;
        }
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product.id !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return i;
      if (newQty > i.product.stock) { toast.error('Not enough stock'); return i; }
      return { ...i, quantity: newQty };
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const completeSale = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    setLoading(true);
    try {
      const saleData = {
        customer_id: selectedCustomer?.id,
        items: cart.map(i => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          unit_price: i.product.price,
          total_price: i.product.price * i.quantity,
        })),
        total_amount: total,
        payment_method: paymentMethod,
      };
      const res = await createSale(saleData);
      setReceipt(res.data);
      setReceiptOpen(true);
      setCart([]);
      setSelectedCustomer(null);
      toast.success('Sale completed successfully!');
    } catch (err) {
      toast.error('Failed to complete sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>Point of Sale</Typography>
      <Grid container spacing={2} sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* Product Grid */}
        <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ flexGrow: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Category</InputLabel>
              <Select value={category} onChange={e => setCategory(e.target.value)} label="Category">
                {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <Grid container spacing={1.5}>
              {filteredProducts.map(product => (
                <Grid size={{ xs: 6, sm: 4, lg: 3 }} key={product.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: cart.find(i => i.product.id === product.id) ? '2px solid #1976d2' : '1px solid #eee',
                      '&:hover': { boxShadow: 3 }
                    }}
                    onClick={() => addToCart(product)}
                  >
                    <CardActionArea sx={{ p: 1.5 }}>
                      <Avatar sx={{ bgcolor: '#e3f2fd', color: '#1976d2', mb: 1, width: 36, height: 36, fontSize: 14 }}>
                        {product.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', lineHeight: 1.2, mb: 0.5 }} noWrap>{product.name}</Typography>
                      <Chip label={product.category} size="small" sx={{ mb: 0.5, fontSize: 10 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="body1" color="primary" sx={{ fontWeight: 700 }}>${product.price.toFixed(2)}</Typography>
                        <Typography variant="caption" color={product.stock < 10 ? 'error' : 'textSecondary'}>
                          {product.stock} left
                        </Typography>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
              {filteredProducts.length === 0 && (
                <Grid size={12}>
                  <Typography color="textSecondary" sx={{ textAlign: 'center', mt: 4 }}>No products found</Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </Grid>

        {/* Cart Sidebar */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Badge badgeContent={cart.reduce((s, i) => s + i.quantity, 0)} color="primary">
                <ShoppingCartIcon />
              </Badge>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Cart</Typography>
            </Box>

            {/* Customer Selector */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Customer</Typography>
              {selectedCustomer ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                  <PersonIcon fontSize="small" color="primary" />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>{selectedCustomer.name}</Typography>
                  <IconButton size="small" onClick={() => setSelectedCustomer(null)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search customer..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  slotProps={{ input: { endAdornment: <PersonIcon fontSize="small" color="disabled" /> } }}
                />
              )}
              {!selectedCustomer && customerSearch && (
                <Paper sx={{ position: 'relative', zIndex: 10, maxHeight: 150, overflowY: 'auto', mt: 0.5 }}>
                  {filteredCustomers.slice(0, 5).map(c => (
                    <Box
                      key={c.id}
                      sx={{ p: 1, cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
                      onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                    >
                      <Typography variant="body2">{c.name}</Typography>
                      <Typography variant="caption" color="textSecondary">{c.email}</Typography>
                    </Box>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <Typography variant="body2" sx={{ p: 1 }} color="textSecondary">No customers found</Typography>
                  )}
                </Paper>
              )}
            </Box>

            <Divider sx={{ mb: 1 }} />

            {/* Cart Items */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 1 }}>
              {cart.length === 0 ? (
                <Typography color="textSecondary" sx={{ textAlign: 'center', mt: 3 }}>Cart is empty</Typography>
              ) : (
                cart.map(item => (
                  <Box key={item.product.id} sx={{ mb: 1, p: 1, bgcolor: '#fafafa', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, flexGrow: 1, mr: 1 }}>{item.product.name}</Typography>
                      <IconButton size="small" onClick={() => removeFromCart(item.product.id)}>
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton size="small" onClick={() => updateQty(item.product.id, -1)}><RemoveIcon fontSize="small" /></IconButton>
                        <Typography sx={{ mx: 1, minWidth: 20, textAlign: 'center' }}>{item.quantity}</Typography>
                        <IconButton size="small" onClick={() => updateQty(item.product.id, 1)}><AddIcon fontSize="small" /></IconButton>
                      </Box>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>

            <Divider sx={{ mb: 1 }} />

            {/* Payment Method */}
            <FormControl size="small" fullWidth sx={{ mb: 1 }}>
              <InputLabel>Payment Method</InputLabel>
              <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as 'cash' | 'card' | 'mobile')} label="Payment Method">
                <MenuItem value="cash">💵 Cash</MenuItem>
                <MenuItem value="card">💳 Card</MenuItem>
                <MenuItem value="mobile">📱 Mobile</MenuItem>
              </Select>
            </FormControl>

            {/* Total and Complete */}
            <Box sx={{ p: 1.5, bgcolor: '#e3f2fd', borderRadius: 1, mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>${total.toFixed(2)}</Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">{cart.reduce((s, i) => s + i.quantity, 0)} item(s)</Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={completeSale}
              disabled={loading || cart.length === 0}
              startIcon={loading ? <CircularProgress size={16} /> : <CheckCircleIcon />}
              sx={{ fontWeight: 'bold' }}
            >
              {loading ? 'Processing...' : 'Complete Sale'}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Receipt Dialog */}
      <Dialog open={receiptOpen} onClose={() => setReceiptOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" />
            Sale Complete - Receipt
          </Box>
        </DialogTitle>
        <DialogContent>
          {receipt && (
            <Box>
              <Box sx={{ textAlign: 'center', mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="h6">Smart POS</Typography>
                <Typography variant="body2" color="textSecondary">Sale #{receipt.id}</Typography>
                <Typography variant="body2" color="textSecondary">{new Date(receipt.created_at).toLocaleString()}</Typography>
              </Box>
              {receipt.customer_name && (
                <Typography sx={{ mb: 1 }}>Customer: <strong>{receipt.customer_name}</strong></Typography>
              )}
              <Typography sx={{ mb: 1 }}>Payment: <strong>{receipt.payment_method}</strong></Typography>
              <Divider sx={{ my: 1 }} />
              {(receipt.items || []).map((item, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2">{item.product_name} x{item.quantity}</Typography>
                  <Typography variant="body2">${item.total_price.toFixed(2)}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6" color="primary">${receipt.total_amount.toFixed(2)}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptOpen(false)} variant="contained">Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default POS;
