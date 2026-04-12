import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products';
import { Product } from '../types';
import toast from 'react-hot-toast';

const emptyProduct: Partial<Product> = { name: '', price: 0, stock: 0, category: '', description: '', sku: '', low_stock_threshold: 10 };

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Product>>(emptyProduct);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);

  const load = () => {
    setLoading(true);
    getProducts().then(r => setProducts(r.data)).catch(() => toast.error('Failed to load products')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const openAdd = () => { setEditing(emptyProduct); setIsEdit(false); setModalOpen(true); };
  const openEdit = (p: Product) => { setEditing({ ...p }); setIsEdit(true); setModalOpen(true); };

  const handleSave = async () => {
    if (!editing.name || editing.price === undefined) { toast.error('Name and price are required'); return; }
    setSaving(true);
    try {
      if (isEdit && editing.id) {
        await updateProduct(editing.id, editing);
        toast.success('Product updated');
      } else {
        await createProduct(editing);
        toast.success('Product created');
      }
      setModalOpen(false);
      load();
    } catch { toast.error('Failed to save product'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteProduct(deleteConfirm.id);
      toast.success('Product deleted');
      setDeleteConfirm(null);
      load();
    } catch { toast.error('Failed to delete product'); }
  };

  const getStockChip = (p: Product) => {
    const threshold = p.low_stock_threshold || 10;
    if (p.stock === 0) return <Chip label="Out of Stock" color="error" size="small" />;
    if (p.stock <= threshold) return <Chip label={`Low: ${p.stock}`} color="warning" size="small" />;
    return <Chip label={p.stock} color="success" size="small" />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Inventory</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add Product</Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> } }}
          sx={{ flexGrow: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Category</InputLabel>
          <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} label="Category">
            {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {loading ? <CircularProgress /> : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>SKU</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell><strong>Price</strong></TableCell>
                <TableCell><strong>Stock</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id} sx={{ '&:hover': { bgcolor: '#fafafa' }, bgcolor: p.stock === 0 ? '#fff5f5' : 'inherit' }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                    {p.description && <Typography variant="caption" color="textSecondary">{p.description}</Typography>}
                  </TableCell>
                  <TableCell><Typography variant="body2" color="textSecondary">{p.sku || '—'}</Typography></TableCell>
                  <TableCell><Chip label={p.category || 'N/A'} size="small" variant="outlined" /></TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>${p.price.toFixed(2)}</Typography></TableCell>
                  <TableCell>{getStockChip(p)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteConfirm(p)} color="error"><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 3 }}>No products found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}><TextField fullWidth label="Name *" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} /></Grid>
            <Grid size={6}><TextField fullWidth label="Price *" type="number" value={editing.price || ''} onChange={e => setEditing({ ...editing, price: parseFloat(e.target.value) })} /></Grid>
            <Grid size={6}><TextField fullWidth label="Stock" type="number" value={editing.stock || ''} onChange={e => setEditing({ ...editing, stock: parseInt(e.target.value) })} /></Grid>
            <Grid size={6}><TextField fullWidth label="Category" value={editing.category || ''} onChange={e => setEditing({ ...editing, category: e.target.value })} /></Grid>
            <Grid size={6}><TextField fullWidth label="SKU" value={editing.sku || ''} onChange={e => setEditing({ ...editing, sku: e.target.value })} /></Grid>
            <Grid size={6}><TextField fullWidth label="Low Stock Threshold" type="number" value={editing.low_stock_threshold || 10} onChange={e => setEditing({ ...editing, low_stock_threshold: parseInt(e.target.value) })} /></Grid>
            <Grid size={12}><TextField fullWidth multiline rows={2} label="Description" value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent><Typography>Delete <strong>{deleteConfirm?.name}</strong>? This cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
