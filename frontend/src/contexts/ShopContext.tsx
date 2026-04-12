import React, { createContext, useContext, useState } from 'react';
import type { Shop } from '../types';

interface ShopContextValue {
  currentShop: Shop | null;
  setCurrentShop: (shop: Shop | null) => void;
}

export const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);

  return (
    <ShopContext.Provider value={{ currentShop, setCurrentShop }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within a ShopProvider');
  return ctx;
}
