import { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, BarChart2, RefreshCw, Cpu } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { aiService } from '../../services/aiService';
import { SalesReport, InventoryReport, AIInsight } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { StatsCard } from '../../components/common/StatsCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useSettingsStore } from '../../store/settingsStore';

const COLORS = ['#3B82F6', '#22C55E', '#EAB308', '#EF4444', '#8B5CF6', '#F97316'];

export function AnalyticsPage() {
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const featureFlags = useSettingsStore((s) => s.featureFlags);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sales, inventory] = await Promise.all([
        adminService.getSalesReport({
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined,
        }),
        adminService.getInventoryReport(),
      ]);
      setSalesReport(sales);
      setInventoryReport(inventory);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchAiInsight = async () => {
    setAiLoading(true);
    try {
      const insight = await aiService.getSalesAnalysis();
      setAiInsight(insight);
    } catch {
      // AI might not be enabled
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Business insights and reports</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange((d) => ({ ...d, start: e.target.value }))}
            className="input-field text-sm w-36"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange((d) => ({ ...d, end: e.target.value }))}
            className="input-field text-sm w-36"
          />
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {salesReport && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(salesReport.totalRevenue)}
            icon={DollarSign}
            iconColor="text-blue-600"
            iconBg="bg-blue-100"
          />
          <StatsCard
            title="Transactions"
            value={salesReport.totalTransactions.toLocaleString()}
            icon={ShoppingBag}
            iconColor="text-green-600"
            iconBg="bg-green-100"
          />
          <StatsCard
            title="Avg Order Value"
            value={formatCurrency(salesReport.averageOrderValue)}
            icon={TrendingUp}
            iconColor="text-purple-600"
            iconBg="bg-purple-100"
          />
          {inventoryReport && (
            <StatsCard
              title="Inventory Value"
              value={formatCurrency(inventoryReport.totalValue)}
              icon={BarChart2}
              iconColor="text-yellow-600"
              iconBg="bg-yellow-100"
            />
          )}
        </div>
      )}

      {/* Sales by Day Chart */}
      {salesReport && salesReport.byDay.length > 0 && (
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Sales Overview (Daily)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={salesReport.byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => {
                  try { return formatDate(d, 'MM/dd'); } catch { return d; }
                }}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(l) => {
                try { return formatDate(l, 'MMM dd, yyyy'); } catch { return l; }
              }} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={false} name="Revenue" />
              <Line type="monotone" dataKey="count" stroke="#22C55E" strokeWidth={2} dot={false} name="Orders" yAxisId={1} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Products */}
        {salesReport && salesReport.topProducts.length > 0 && (
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Top Products</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={salesReport.topProducts.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Payment Methods */}
        {salesReport && salesReport.byPaymentMethod.length > 0 && (
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Payment Methods</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={salesReport.byPaymentMethod}
                  dataKey="total"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ method, percent }) => `${method} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {salesReport.byPaymentMethod.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Inventory Overview */}
      {inventoryReport && (
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Inventory Status</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-700">{inventoryReport.totalProducts}</p>
              <p className="text-xs text-green-600 mt-1">Total Products</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <p className="text-2xl font-bold text-yellow-700">{inventoryReport.lowStockItems}</p>
              <p className="text-xs text-yellow-600 mt-1">Low Stock</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-2xl font-bold text-red-700">{inventoryReport.outOfStockItems}</p>
              <p className="text-xs text-red-600 mt-1">Out of Stock</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Panel */}
      {featureFlags.aiEnabled && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-purple-600" />
              <h2 className="text-base font-semibold text-gray-800">AI Sales Analysis</h2>
            </div>
            <button
              onClick={fetchAiInsight}
              disabled={aiLoading}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              {aiLoading ? <LoadingSpinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
              {aiLoading ? 'Analyzing...' : 'Get Insights'}
            </button>
          </div>
          {aiInsight ? (
            <div className="bg-purple-50 rounded-xl p-4">
              <h3 className="font-semibold text-purple-800 mb-2">{aiInsight.title}</h3>
              <p className="text-sm text-purple-700">{aiInsight.description}</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Cpu className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Click "Get Insights" to get AI-powered analysis</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
