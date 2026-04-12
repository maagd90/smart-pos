import { useState, useEffect, useCallback } from 'react';
import { tenantService, TenantSetup } from '../services/tenantService';

export function useTenantStatus(tenantId: string | null, pollInterval = 3000) {
  const [status, setStatus] = useState<string | null>(null);
  const [setup, setSetup] = useState<TenantSetup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!tenantId) return;
    try {
      const data = await tenantService.getStatus(tenantId);
      setStatus(data.tenantStatus);
      setSetup(data.setup);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to fetch status');
    }
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    fetchStatus().finally(() => setLoading(false));

    if (status === 'CREATING') {
      const interval = setInterval(() => {
        fetchStatus();
      }, pollInterval);
      return () => clearInterval(interval);
    }
  // fetchStatus is stable (memoized by useCallback on tenantId), so we exclude it to avoid
  // re-running the effect on every render while still polling correctly.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, pollInterval, status]);

  return { status, setup, loading, error, refetch: fetchStatus };
}
