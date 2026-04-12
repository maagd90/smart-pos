import React from 'react';

interface StatusBadgeProps {
  status: 'CREATING' | 'ACTIVE' | 'SUSPENDED' | 'FAILED' | string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  CREATING:  { label: 'Creating...', bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  ACTIVE:    { label: '✅ Active',   bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  SUSPENDED: { label: 'Suspended',  bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  FAILED:    { label: '❌ Failed',   bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: cfg.bg, color: cfg.color,
      padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
