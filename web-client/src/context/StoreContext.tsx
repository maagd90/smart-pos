import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { fetchAccessibleStores } from '../api/auth';
import { listStores, Store } from '../api/accounts';
import { useAuth } from './AuthContext';

interface StoreContextValue {
  stores: Store[];
  accessibleStoreIds: Set<string>;
  selectedStoreId: string | null;
  selectedStore: Store | null;
  accountWideAccess: boolean;
  setSelectedStoreId: (id: string | null) => void;
  reloadStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, accountId, isPlatformAdmin } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [accessibleStoreIds, setAccessibleStoreIds] = useState<Set<string>>(new Set());
  const [accountWideAccess, setAccountWideAccess] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(
    sessionStorage.getItem('selectedStoreId')
  );

  const reloadStores = async () => {
    if (!accountId || isPlatformAdmin) {
      setStores([]);
      return;
    }
    const storeList = await listStores(accountId);
    setStores(storeList);
    const access = await fetchAccessibleStores(accountId);
    setAccountWideAccess(access.accountWideAccess);
    setAccessibleStoreIds(new Set(access.storeIds));
    if (access.storeIds.length === 1 && !selectedStoreId) {
      setSelectedStoreId(access.storeIds[0]);
    }
  };

  useEffect(() => {
    if (user && accountId && !isPlatformAdmin) {
      reloadStores().catch(() => undefined);
    }
  }, [user, accountId, isPlatformAdmin]);

  useEffect(() => {
    if (selectedStoreId) {
      sessionStorage.setItem('selectedStoreId', selectedStoreId);
    } else {
      sessionStorage.removeItem('selectedStoreId');
    }
  }, [selectedStoreId]);

  const visibleStores = useMemo(() => {
    if (accountWideAccess) return stores;
    return stores.filter((s) => accessibleStoreIds.has(s.id));
  }, [stores, accessibleStoreIds, accountWideAccess]);

  const selectedStore = visibleStores.find((s) => s.id === selectedStoreId) || null;

  const value = useMemo(
    () => ({
      stores: visibleStores,
      accessibleStoreIds,
      selectedStoreId,
      selectedStore,
      accountWideAccess,
      setSelectedStoreId,
      reloadStores,
    }),
    [visibleStores, accessibleStoreIds, selectedStoreId, selectedStore, accountWideAccess]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStoreContext() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStoreContext must be used within StoreProvider');
  return ctx;
}
