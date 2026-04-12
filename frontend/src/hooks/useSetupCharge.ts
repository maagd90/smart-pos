import { useState, useEffect, useCallback } from 'react';
import {
  setupChargeApi,
  PaymentGatewayPricing,
  GatewaySetupCharge,
  RemainingSetupFees,
} from '../services/setupChargeApi';

export function useAvailableGateways() {
  const [gateways, setGateways] = useState<PaymentGatewayPricing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGateways = useCallback(async () => {
    setLoading(true);
    try {
      const data = await setupChargeApi.getAvailableGateways();
      setGateways(data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load gateways');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  return { gateways, loading, error, refetch: fetchGateways };
}

export function useSetupChargeHistory(tenantId: string | null) {
  const [charges, setCharges] = useState<GatewaySetupCharge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCharges = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await setupChargeApi.getTenantSetupChargeHistory(tenantId);
      setCharges(data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load setup charges');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchCharges();
  }, [fetchCharges]);

  return { charges, loading, error, refetch: fetchCharges };
}

export function useTenantRevenueSummary(tenantId: string | null) {
  const [summary, setSummary] = useState<RemainingSetupFees | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await setupChargeApi.getRemainingSetupFees(tenantId);
      setSummary(data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}

export function useEnableGateway() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enableGateway = async (
    tenantId: string,
    gatewayName: string
  ): Promise<GatewaySetupCharge | null> => {
    setLoading(true);
    setError(null);
    try {
      const charge = await setupChargeApi.enableGateway(tenantId, gatewayName);
      return charge;
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to enable gateway');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { enableGateway, loading, error };
}

export function useAdminGatewayPricings() {
  const [pricings, setPricings] = useState<PaymentGatewayPricing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPricings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await setupChargeApi.listGatewayPricings();
      setPricings(data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load gateway pricings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricings();
  }, [fetchPricings]);

  const updatePricing = async (
    gatewayName: string,
    update: { setupFee?: number; isAvailable?: boolean }
  ) => {
    try {
      const updated = await setupChargeApi.updateGatewayPricing(gatewayName, update);
      setPricings((prev) =>
        prev.map((p) => (p.gatewayName === gatewayName ? updated : p))
      );
      return updated;
    } catch (err: any) {
      throw new Error(err?.response?.data?.error || 'Failed to update pricing');
    }
  };

  const createPricing = async (input: {
    gatewayName: string;
    displayName: string;
    setupFee: number;
    description?: string;
  }) => {
    try {
      const created = await setupChargeApi.createGatewayPricing(input);
      setPricings((prev) => [...prev, created]);
      return created;
    } catch (err: any) {
      throw new Error(err?.response?.data?.error || 'Failed to create gateway');
    }
  };

  return { pricings, loading, error, refetch: fetchPricings, updatePricing, createPricing };
}
