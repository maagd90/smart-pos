import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import offlineApi from '../services/offlineApi';

export interface OfflineContextValue {
  isOnline: boolean;
  isSyncing: boolean;
  queueSize: number;
  sync: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isOnline } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueSize, setQueueSize] = useState(() => offlineApi.queueSize());

  const sync = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      await offlineApi.sync();
    } finally {
      setQueueSize(offlineApi.queueSize());
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline) {
      sync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // Refresh queue size on render
  useEffect(() => {
    setQueueSize(offlineApi.queueSize());
  }, [isOnline, isSyncing]);

  return (
    <OfflineContext.Provider value={{ isOnline, isSyncing, queueSize, sync }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextValue => {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOffline must be used within OfflineProvider');
  return ctx;
};

export default OfflineContext;
