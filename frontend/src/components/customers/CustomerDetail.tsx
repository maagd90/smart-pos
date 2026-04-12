import { useEffect, useState } from 'react';
import { ArrowLeft, ShoppingBag, MessageSquare, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Customer, Transaction, Message } from '../../types';
import { customerService } from '../../services/customerService';
import { formatCurrency, formatDateTime, segmentColor, paymentMethodLabel, transactionStatusColor, messageStatusColor, channelIcon } from '../../utils/helpers';
import { Badge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface CustomerDetailProps {
  customer: Customer;
}

export function CustomerDetail({ customer }: CustomerDetailProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'transactions' | 'messages'>('transactions');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      customerService.getCustomerTransactions(customer.id),
      customerService.getCustomerMessages(customer.id),
    ])
      .then(([txns, msgs]) => {
        setTransactions(txns);
        setMessages(msgs);
      })
      .finally(() => setLoading(false));
  }, [customer.id]);

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </button>

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${segmentColor(customer.segment)}`}>
                {customer.segment}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              {customer.phone && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Phone className="h-3.5 w-3.5" />
                  {customer.phone}
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Mail className="h-3.5 w-3.5" />
                  {customer.email}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
            <p className="text-xs text-gray-500 mt-1">Total Spent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{customer.loyaltyPoints}</p>
            <p className="text-xs text-gray-500 mt-1">Loyalty Points</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{customer.visitCount}</p>
            <p className="text-xs text-gray-500 mt-1">Total Visits</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-200">
          {(['transactions', 'messages'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'transactions' ? <ShoppingBag className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
              {tab} ({tab === 'transactions' ? transactions.length : messages.length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : activeTab === 'transactions' ? (
          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No transactions yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Receipt</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Date</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-600">Total</th>
                    <th className="text-center px-4 py-2 font-medium text-gray-600">Payment</th>
                    <th className="text-center px-4 py-2 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs text-gray-500">{t.receiptNumber}</td>
                      <td className="px-4 py-2 text-gray-600">{formatDateTime(t.createdAt)}</td>
                      <td className="px-4 py-2 text-right font-semibold">{formatCurrency(t.total)}</td>
                      <td className="px-4 py-2 text-center">
                        <Badge variant="gray">{paymentMethodLabel(t.paymentMethod)}</Badge>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${transactionStatusColor(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No messages sent</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="px-4 py-3 flex items-start gap-3">
                  <span className="text-xl mt-0.5">{channelIcon(m.channel)}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{m.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(m.createdAt)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${messageStatusColor(m.status)}`}>
                    {m.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
