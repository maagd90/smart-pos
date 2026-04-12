import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings } from '../types';

interface SettingsStore {
  settings: AppSettings;
  featureFlags: {
    aiEnabled: boolean;
    messagingEnabled: boolean;
    loyaltyEnabled: boolean;
    analyticsEnabled: boolean;
  };
  sidebarOpen: boolean;
  setSettings: (settings: AppSettings) => void;
  setFeatureFlags: (flags: Partial<SettingsStore['featureFlags']>) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const defaultSettings: AppSettings = {
  storeName: 'Smart POS',
  storeAddress: '',
  storePhone: '',
  storeEmail: '',
  currency: 'USD',
  taxRate: 10,
  loyaltyPointsRate: 1,
  receiptFooter: 'Thank you for your purchase!',
  timezone: 'UTC',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      featureFlags: {
        aiEnabled: false,
        messagingEnabled: false,
        loyaltyEnabled: true,
        analyticsEnabled: true,
      },
      sidebarOpen: true,
      setSettings: (settings) => set({ settings }),
      setFeatureFlags: (flags) =>
        set((state) => ({ featureFlags: { ...state.featureFlags, ...flags } })),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({ settings: state.settings, featureFlags: state.featureFlags }),
    }
  )
);
