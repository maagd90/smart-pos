import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, ShoppingCart, Users, RefreshCw, Lightbulb, Calendar } from 'lucide-react';
import { analyticsApi, DashboardData } from '../services/api';
import toast from 'react-hot-toast';

const PERIODS = ['today', 'week', 'month', 'year'] as const;
type Period = typeof PERIODS[number];

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const MetricCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; subtitle?: string }> = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const AnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<Period>('week');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getDashboard(period);
      setData(res.data);
    } catch {
      toast.error('Failed to load analytics');
      // Use mock data for demo
      setData({
        totalSales: 15240.5,
        totalTransactions: 342,
        totalCustomers: 128,
        repeatRate: 67.4,
        salesTrend: [
          { date: 'Mon', sales: 1200, transactions: 45 },
          { date: 'Tue', sales: 1850, transactions: 62 },
          { date: 'Wed', sales: 1400, transactions: 51 },
          { date: 'Thu', sales: 2100, transactions: 78 },
          { date: 'Fri', sales: 2800, transactions: 95 },
          { date: 'Sat', sales: 3200, transactions: 110 },
          { date: 'Sun', sales: 2690, transactions: 88 },
        ],
        topProducts: [
          { name: 'Coffee', sales: 145, revenue: 580 },
          { name: 'Sandwich', sales: 98, revenue: 490 },
          { name: 'Water', sales: 210, revenue: 315 },
          { name: 'Juice', sales: 76, revenue: 456 },
          { name: 'Snacks', sales: 132, revenue: 396 },
        ],
        customerSegments: [
          { segment: 'VIP', count: 23 },
          { segment: 'Regular', count: 67 },
          { segment: 'Occasional', count: 38 },
        ],
        inventoryHealth: [
          { status: 'In Stock', count: 145 },
          { status: 'Low Stock', count: 22 },
          { status: 'Out of Stock', count: 8 },
        ],
        staffPerformance: [
          { name: 'Alice Johnson', sales: 4560, transactions: 98 },
          { name: 'Bob Smith', sales: 3890, transactions: 84 },
          { name: 'Carol White', sales: 5120, transactions: 112 },
          { name: 'David Brown', sales: 2870, transactions: 63 },
        ],
        messagingMetrics: { channel: 'WhatsApp', sent: 450, delivered: 420, opened: 280 },
        aiInsights: [
          'Coffee sales peak on Friday afternoons — consider a promotional bundle.',
          'VIP customers haven\'t visited in 14+ days — trigger a re-engagement campaign.',
          'Water inventory will run out in ~3 days based on current trends.',
          'Weekend staff performance is 18% above weekday average.',
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  period === p ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button onClick={loadData} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Sales"
              value={`$${data.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
              color="bg-blue-50"
            />
            <MetricCard
              title="Transactions"
              value={data.totalTransactions.toString()}
              icon={<ShoppingCart className="w-5 h-5 text-green-600" />}
              color="bg-green-50"
            />
            <MetricCard
              title="Customers"
              value={data.totalCustomers.toString()}
              icon={<Users className="w-5 h-5 text-purple-600" />}
              color="bg-purple-50"
            />
            <MetricCard
              title="Repeat Rate"
              value={`${data.repeatRate.toFixed(1)}%`}
              icon={<Calendar className="w-5 h-5 text-orange-600" />}
              color="bg-orange-50"
              subtitle="returning customers"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Trend */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Sales Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={false} name="Sales ($)" />
                  <Line type="monotone" dataKey="transactions" stroke="#10b981" strokeWidth={2} dot={false} name="Transactions" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Top Products</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={70} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Segments */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Customer Segments</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.customerSegments} dataKey="count" nameKey="segment" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {data.customerSegments.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Inventory Health */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Inventory Health</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.inventoryHealth} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                    {data.inventoryHealth.map((_, index) => (
                      <Cell key={index} fill={[PIE_COLORS[0], '#f59e0b', '#ef4444'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Messaging Metrics */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Messaging Metrics</h3>
              <div className="space-y-4 mt-2">
                {[
                  { label: 'Sent', value: data.messagingMetrics.sent, color: 'bg-blue-500' },
                  { label: 'Delivered', value: data.messagingMetrics.delivered, color: 'bg-green-500' },
                  { label: 'Opened', value: data.messagingMetrics.opened, color: 'bg-purple-500' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`${color} rounded-full h-2`}
                        style={{ width: `${(value / data.messagingMetrics.sent) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Staff Performance */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">Staff Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Staff Name</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">Sales</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">Transactions</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">Avg. Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.staffPerformance.map((staff, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium text-gray-800">{staff.name}</td>
                      <td className="py-3 px-3 text-right text-gray-700">${staff.sales.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-gray-700">{staff.transactions}</td>
                      <td className="py-3 px-3 text-right text-gray-700">${(staff.sales / staff.transactions).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Insights */}
          {data.aiInsights.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">AI Insights</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.aiInsights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-blue-100">
                    <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
