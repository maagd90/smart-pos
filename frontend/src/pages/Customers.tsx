import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  CircularProgress, Drawer, Divider, Chip, Tooltip, Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerPurchases } from '../api/customers';
import { Customer, Sale } from '../types';
import toast from 'react-hot-toast';

const emptyCustomer: Partial<Customer> = { name: '', email: '', phone: '', address: '' };

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Customer>>(emptyCustomer);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [purchases, setPurchases] = useState<Sale[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  const load = () => {
    setLoading(true);
    getCustomers().then(r => setCustomers(r.data)).catch(() => toast.error('Failed to load customers')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const openCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setLoadingPurchases(true);
    getCustomerPurchases(c.id)
      .then(r => setPurchases(r.data))
      .catch(() => setPurchases([]))
      .finally(() => setLoadingPurchases(false));
  };

  const openAdd = () => { setEditing(emptyCustomer); setIsEdit(false); setModalOpen(true); };
  const openEdit = (c: Customer, e: React.MouseEvent) => { e.stopPropagation(); setEditing({ ...c }); setIsEdit(true); setModalOpen(true); };

  const handleSave = async () => {
    if (!editing.name || !editing.email) { toast.error('Name and email are required'); return; }
    setSaving(true);
    try {
      if (isEdit && editing.id) {
        await updateCustomer(editing.id, editing);
        toast.success('Customer updated');
      } else {
        await createCustomer(editing);
        toast.success('Customer created');
      }
      setModalOpen(false);
      load();
    } catch { toast.error('Failed to save customer'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteCustomer(deleteConfirm.id);
      toast.success('Customer deleted');
      setDeleteConfirm(null);
      if (selectedCustomer?.id === deleteConfirm.id) setSelectedCustomer(null);
      load();
    } catch { toast.error('Failed to delete customer'); }
  };

  const totalSpent = purchases.reduce((s, p) => s + (p.total_amount || 0), 0);
  const productCounts: Record<string, number> = {};
  purchases.forEach(p => (p.items || []).forEach(item => {
    productCounts[item.product_name] = (productCounts[item.product_name] || 0) + item.quantity;
  }));
  const favoriteProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Customers</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add Customer</Button>
      </Box>

      <TextField
        size="small"
        placeholder="Search customers..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> } }}
        sx={{ mb: 2, width: 300 }}
      />

      {loading ? <CircularProgress /> : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Phone</strong></TableCell>
                <TableCell><strong>Member Since</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(c => (
                <TableRow
                  key={c.id}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#e3f2fd' }, bgcolor: selectedCustomer?.id === c.id ? '#e3f2fd' : 'inherit' }}
                  onClick={() => openCustomer(c)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 13, bgcolor: '#1976d2' }}>{c.name.charAt(0)}</Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2">{c.email}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="textSecondary">{c.phone || '—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="textSecondary">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</Typography></TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit"><IconButton size="small" onClick={e => openEdit(c, e)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={e => { e.stopPropagation(); setDeleteConfirm(c); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', py: 3 }}>No customers found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Customer Detail Drawer */}
      <Drawer anchor="right" open={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} slotProps={{ paper: { sx: { width: 400, p: 3 } } }}>
        {selectedCustomer && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Customer Profile</Typography>
              <IconButton onClick={() => setSelectedCustomer(null)}><CloseIcon /></IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: '#1976d2', fontSize: 24 }}>{selectedCustomer.name.charAt(0)}</Avatar>
              <Box>
                <Typography variant="h6">{selectedCustomer.name}</Typography>
                <Typography variant="body2" color="textSecondary">{selectedCustomer.email}</Typography>
                <Typography variant="body2" color="textSecondary">{selectedCustomer.phone}</Typography>
              </Box>
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={6}>
                <Paper sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>${totalSpent.toFixed(2)}</Typography>
                  <Typography variant="caption" color="textSecondary">Total Spent</Typography>
                </Paper>
              </Grid>
              <Grid size={6}>
                <Paper sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="h5" color="secondary" sx={{ fontWeight: 700 }}>{purchases.length}</Typography>
                  <Typography variant="caption" color="textSecondary">Total Purchases</Typography>
                </Paper>
              </Grid>
            </Grid>

            {favoriteProducts.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Favorite Products</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {favoriteProducts.map(([name, qty]) => (
                    <Chip key={name} label={`${name} (${qty})`} size="small" color="primary" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Purchase History</Typography>
            {loadingPurchases ? <CircularProgress size={24} /> : (
              purchases.length === 0 ? (
                <Typography color="textSecondary">No purchases yet</Typography>
              ) : (
                purchases.map(p => (
                  <Paper key={p.id} sx={{ p: 1.5, mb: 1 }} variant="outlined">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>Sale #{p.id}</Typography>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>${(p.total_amount || 0).toFixed(2)}</Typography>
                    </Box>
                    <Typography variant="caption" color="textSecondary">{new Date(p.created_at).toLocaleString()} · {p.payment_method}</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {(p.items || []).map((item, i) => (
                        <Typography key={i} variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                          · {item.product_name} x{item.quantity}
                        </Typography>
                      ))}
                    </Box>
                  </Paper>
                ))
              )
            )}
          </Box>
        )}
      </Drawer>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}><TextField fullWidth label="Name *" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} /></Grid>
            <Grid size={12}><TextField fullWidth label="Email *" value={editing.email || ''} onChange={e => setEditing({ ...editing, email: e.target.value })} /></Grid>
            <Grid size={6}><TextField fullWidth label="Phone" value={editing.phone || ''} onChange={e => setEditing({ ...editing, phone: e.target.value })} /></Grid>
            <Grid size={12}><TextField fullWidth label="Address" value={editing.address || ''} onChange={e => setEditing({ ...editing, address: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent><Typography>Delete <strong>{deleteConfirm?.name}</strong>? This cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;
