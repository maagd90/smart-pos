
import { Edit, Eye } from 'lucide-react';
import { Customer, CustomerSegment } from '../../types';
import { formatCurrency, formatDate, getInitials } from '../../utils/helpers';
import { Badge } from '../common/Badge';
import { Link } from 'react-router-dom';

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  loading?: boolean;
}

const segmentVariant: Record<CustomerSegment, 'purple' | 'default' | 'gray' | 'success'> = {
  VIP: 'purple',
  REGULAR: 'default',
  INACTIVE: 'gray',
  NEW: 'success',
};

export function CustomerTable({ customers, onEdit, loading }: CustomerTableProps) {
  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p>Loading customers...</p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No customers found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
            <th className="text-center px-4 py-3 font-medium text-gray-600">Segment</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Total Spent</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Loyalty Pts</th>
            <th className="text-center px-4 py-3 font-medium text-gray-600">Visits</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                    {getInitials(customer.name)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    {customer.notes && (
                      <p className="text-xs text-gray-400 truncate max-w-xs">{customer.notes}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="text-gray-700">{customer.phone ?? '—'}</p>
                <p className="text-xs text-gray-400">{customer.email ?? ''}</p>
              </td>
              <td className="px-4 py-3 text-center">
                <Badge variant={segmentVariant[customer.segment]}>{customer.segment}</Badge>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-800">
                {formatCurrency(customer.totalSpent)}
              </td>
              <td className="px-4 py-3 text-right text-blue-600 font-medium">
                {customer.loyaltyPoints.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-center text-gray-600">{customer.visitCount}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(customer.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    to={`/customers/${customer.id}`}
                    className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded transition-colors"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => onEdit(customer)}
                    className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
