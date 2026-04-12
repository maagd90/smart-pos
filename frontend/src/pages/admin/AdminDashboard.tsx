import { useEffect, useState, useCallback } from 'react';
import {
  DollarSign, ShoppingBag, Users, AlertTriangle,
  TrendingUp, RefreshCw, Activity, CheckCircle
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { DashboardStats } from '../../types';
import { StatsCard } from '../../components/common/StatsCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSettingsStore } from '../../store/settingsStore';
import { formatDate } from '../../utils/helpers';

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const featureFlags = useSettingsStore((s) => s.featureFlags);
  const settings = useSettingsStore((s) => s.settings);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getDashboard();
      setStats(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">{settings.storeName} · Business Overview</p>
        </div>
        <button onClick={fetchStats} disabled={loading} className="btn-secondary flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard
            title="Today's Sales"
            value={formatCurrency(stats.todaySales)}
            icon={DollarSign}
            iconColor="text-blue-600"
            iconBg="bg-blue-100"
            subtitle="Revenue today"
          />
          <StatsCard
            title="Today's Transactions"
            value={stats.todayTransactions.toLocaleString()}
            icon={ShoppingBag}
            iconColor="text-green-600"
            iconBg="bg-green-100"
            subtitle="Orders processed"
          />
          <StatsCard
            title="Total Customers"
            value={stats.totalCustomers.toLocaleString()}
            icon={Users}
            iconColor="text-purple-600"
            iconBg="bg-purple-100"
            subtitle="Registered customers"
          />
          <StatsCard
            title="Low Stock Alerts"
            value={stats.lowStockItems}
            icon={AlertTriangle}
            iconColor={stats.lowStockItems > 0 ? 'text-yellow-600' : 'text-green-600'}
            iconBg={stats.lowStockItems > 0 ? 'bg-yellow-100' : 'bg-green-100'}
            subtitle="Items need restocking"
          />
        </div>
      )}

      {/* Sales trend */}
      {stats && stats.salesByDay.length > 0 && (
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Sales Trend (7 Days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.salesByDay.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => { try { return formatDate(d, 'MM/dd'); } catch { return d; } }}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Products */}
        {stats && stats.topProducts.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Top Products
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {stats.topProducts.slice(0, 5).map((p, i) => (
                <div key={p.sku} className="flex items-center gap-3 px-4 py-3">
                  <span className="h-6 w-6 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.totalSold} sold</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{formatCurrency(p.revenue)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {stats && stats.recentTransactions.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-green-600" />
                Recent Transactions
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Receipt</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Customer</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600 text-xs">Amount</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.recentTransactions.slice(0, 6).map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-xs text-gray-400">{t.receiptNumber}</td>
                      <td className="px-3 py-2 text-gray-600 text-xs">{t.customerName ?? 'Walk-in'}</td>
                      <td className="px-3 py-2 text-right font-semibold">{formatCurrency(t.total)}</td>
                      <td className="px-3 py-2 text-gray-400 text-xs">{formatDateTime(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* System Health */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-600" />
          System Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'API Server', ok: true },
            { label: 'Database', ok: true },
            { label: 'AI Service', ok: featureFlags.aiEnabled },
            { label: 'Messaging', ok: featureFlags.messagingEnabled },
          ].map((s) => (
            <div key={s.label} className={`flex items-center gap-2 p-3 rounded-lg ${s.ok ? 'bg-green-50' : 'bg-gray-50'}`}>
              <CheckCircle className={`h-4 w-4 ${s.ok ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${s.ok ? 'text-green-700' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Feature Flags */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-3">Feature Flags</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(featureFlags).map(([key, enabled]) => (
              <Badge key={key} variant={enabled ? 'success' : 'gray'}>
                {key.replace(/([A-Z])/g, ' $1').trim()}: {enabled ? 'ON' : 'OFF'}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
