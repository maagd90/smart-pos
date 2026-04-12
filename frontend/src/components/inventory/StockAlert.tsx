
import { AlertTriangle, Package } from 'lucide-react';
import { LowStockAlert } from '../../types';

interface StockAlertProps {
  alerts: LowStockAlert[];
  onRestock?: (alert: LowStockAlert) => void;
}

export function StockAlert({ alerts, onRestock }: StockAlertProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 border-b border-yellow-100">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <h3 className="text-sm font-semibold text-yellow-800">
          Low Stock Alerts ({alerts.length})
        </h3>
      </div>
      <div className="divide-y divide-gray-100">
        {alerts.slice(0, 5).map((alert) => (
          <div key={alert.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
            <div className="h-8 w-8 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0">
              <Package className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{alert.name}</p>
              <p className="text-xs text-gray-400">{alert.sku} · {alert.category}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${alert.currentStock === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                {alert.currentStock}
              </p>
              <p className="text-xs text-gray-400">min: {alert.reorderPoint}</p>
            </div>
            {onRestock && (
              <button
                onClick={() => onRestock(alert)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 hover:bg-blue-50 rounded"
              >
                Restock
              </button>
            )}
          </div>
        ))}
      </div>
      {alerts.length > 5 && (
        <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100 text-center">
          +{alerts.length - 5} more items
        </div>
      )}
    </div>
  );
}
