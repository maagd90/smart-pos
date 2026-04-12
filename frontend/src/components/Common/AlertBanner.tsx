import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertBannerProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
}

const icons: Record<AlertType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  warning: <AlertCircle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

const styles: Record<AlertType, string> = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
};

const AlertBanner: React.FC<AlertBannerProps> = ({ type, message, onClose }) => (
  <div className={`flex items-center gap-3 px-4 py-3 border rounded-lg ${styles[type]}`}>
    {icons[type]}
    <span className="flex-1 text-sm font-medium">{message}</span>
    {onClose && (
      <button onClick={onClose} className="ml-auto hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

export default AlertBanner;
