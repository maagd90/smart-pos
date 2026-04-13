import React from 'react';
import { useOffline } from '../context/OfflineContext';

/**
 * OfflineBadge – shows Online / Offline status with a colour-coded indicator.
 * Displays sync progress when requests are being replayed.
 */
const OfflineBadge: React.FC = () => {
  const { isOnline, isSyncing, queueSize } = useOffline();

  if (isOnline && !isSyncing && queueSize === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        Online
      </span>
    );
  }

  if (isSyncing) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 animate-pulse">
        <span className="h-2 w-2 rounded-full bg-blue-500" />
        Syncing ({queueSize})
      </span>
    );
  }

  if (isOnline && queueSize > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <span className="h-2 w-2 rounded-full bg-yellow-500" />
        Online · {queueSize} pending
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <span className="h-2 w-2 rounded-full bg-red-500" />
      Offline{queueSize > 0 ? ` · ${queueSize} queued` : ''}
    </span>
  );
};

export default OfflineBadge;
