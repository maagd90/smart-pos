import React, { useEffect, useState } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, CircularProgress, Paper
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import WarningIcon from '@mui/icons-material/Warning';
import { getDashboardStats } from '../api/dashboard';
import { DashboardStats } from '../types';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2'];

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, subtitle, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">{title}</Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color }}>{value}</Typography>
          {subtitle && <Typography variant="body2" color="textSecondary">{subtitle}</Typography>}
        </Box>
        <Box sx={{ color, opacity: 0.8, fontSize: 40 }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(res => setStats(res.data))
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (!stats) return <Typography>No data available</Typography>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>Dashboard</Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Today's Revenue" value={`$${(stats.revenue?.today || 0).toFixed(2)}`} icon={<TrendingUpIcon fontSize="large" />} color="#1976d2" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Monthly Revenue" value={`$${(stats.revenue?.month || 0).toFixed(2)}`} subtitle={`Weekly: $${(stats.revenue?.week || 0).toFixed(2)}`} icon={<TrendingUpIcon fontSize="large" />} color="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Sales" value={stats.total_sales || 0} icon={<ShoppingCartIcon fontSize="large" />} color="#ed6c02" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Customers" value={stats.total_customers || 0} icon={<PeopleIcon fontSize="large" />} color="#9c27b0" />
        </Grid>
      </Grid>

      {(stats.low_stock_count || 0) > 0 && (
        <Card sx={{ mb: 3, backgroundColor: '#fff3e0' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            <Typography variant="body1" color="warning.dark">
              <strong>{stats.low_stock_count} product(s)</strong> are running low on stock!
            </Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Sales Last 7 Days</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.sales_by_day || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Revenue']} />
                <Bar dataKey="total" fill="#1976d2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Sales by Category</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={stats.sales_by_category || []} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
                  {(stats.sales_by_category || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Top Selling Products</Typography>
            {(stats.top_products || []).map((p, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                <Typography>{i + 1}. {p.name}</Typography>
                <Typography color="textSecondary">{p.quantity} sold · ${(p.revenue || 0).toFixed(2)}</Typography>
              </Box>
            ))}
            {!(stats.top_products?.length) && <Typography color="textSecondary">No data</Typography>}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Recent Sales</Typography>
            {(stats.recent_sales || []).slice(0, 5).map((sale, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                <Box>
                  <Typography variant="body2">#{sale.id} — {sale.customer_name || 'Walk-in'}</Typography>
                  <Typography variant="caption" color="textSecondary">{sale.payment_method}</Typography>
                </Box>
                <Typography sx={{ fontWeight: "bold" }}>${(sale.total_amount || 0).toFixed(2)}</Typography>
              </Box>
            ))}
            {!(stats.recent_sales?.length) && <Typography color="textSecondary">No recent sales</Typography>}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
