import React, { createContext, useContext, useState } from 'react';
import { Shop, ShopContextType } from '../types';

const ShopContext = createContext<ShopContextType | null>(null);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);

  return (
    <ShopContext.Provider value={{ currentShop, setCurrentShop }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = (): ShopContextType => {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within ShopProvider');
  return ctx;
};

export default ShopContext;
