import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, CircularProgress, FormControl, InputLabel,
  Select, MenuItem, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Avatar
} from '@mui/material';
import { getMessages } from '../api/messages';
import { Message } from '../types';
import toast from 'react-hot-toast';

const statusColor = (status: string): 'success' | 'error' | 'warning' => {
  if (status === 'sent') return 'success';
  if (status === 'failed') return 'error';
  return 'warning';
};

const typeColor = (type: string): 'primary' | 'secondary' | 'default' => {
  if (type === 'promotion') return 'primary';
  if (type === 'deal') return 'secondary';
  return 'default';
};

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Message | null>(null);

  useEffect(() => {
    getMessages()
      .then(r => setMessages(r.data))
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = messages.filter(m => {
    const matchType = typeFilter === 'All' || m.type === typeFilter;
    const matchStatus = statusFilter === 'All' || m.status === statusFilter;
    const matchSearch = !search || m.customer_name?.toLowerCase().includes(search.toLowerCase()) || m.content?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 3 }}>Messages</Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search messages..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Type</InputLabel>
          <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} label="Type">
            <MenuItem value="All">All Types</MenuItem>
            <MenuItem value="promotion">Promotion</MenuItem>
            <MenuItem value="deal">Deal</MenuItem>
            <MenuItem value="follow_up">Follow-up</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} label="Status">
            <MenuItem value="All">All Status</MenuItem>
            <MenuItem value="sent">Sent</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? <CircularProgress /> : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Customer</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Preview</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(msg => (
                <TableRow
                  key={msg.id}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
                  onClick={() => setSelected(msg)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 13, bgcolor: '#9c27b0' }}>
                        {(msg.customer_name || 'U').charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{msg.customer_name || `Customer #${msg.customer_id}`}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={msg.type} size="small" color={typeColor(msg.type)} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                      {msg.content}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={msg.status} size="small" color={statusColor(msg.status)} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {msg.created_at ? new Date(msg.created_at).toLocaleDateString() : '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', py: 3 }}>No messages found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Message Detail Dialog */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Message Details
            {selected && <Chip label={selected.status} size="small" color={statusColor(selected.status)} />}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selected && (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip label={selected.customer_name || `Customer #${selected.customer_id}`} />
                <Chip label={selected.type} color={typeColor(selected.type)} />
                <Typography variant="body2" color="textSecondary">{selected.created_at ? new Date(selected.created_at).toLocaleString() : ''}</Typography>
              </Box>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body1">{selected.content}</Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Messages;
