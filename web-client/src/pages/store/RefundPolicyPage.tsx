import { FormEvent, useEffect, useState } from 'react';
import { getRefundPolicy, RefundPolicy, updateRefundPolicy } from '../../api/stores';
import { useStoreContext } from '../../context/StoreContext';

export function RefundPolicyPage() {
  const { selectedStoreId, selectedStore } = useStoreContext();
  const [policy, setPolicy] = useState<RefundPolicy | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!selectedStoreId) return;
    getRefundPolicy(selectedStoreId)
      .then(setPolicy)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [selectedStoreId]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId || !policy) return;
    setError('');
    setMessage('');
    try {
      const updated = await updateRefundPolicy(selectedStoreId, policy);
      setPolicy(updated);
      setMessage('Refund policy saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const updateTier = (index: number, field: 'withinDays' | 'refundPct', value: number) => {
    if (!policy) return;
    const tiers = [...policy.refundProrationTiers];
    tiers[index] = { ...tiers[index], [field]: value };
    setPolicy({ ...policy, refundProrationTiers: tiers });
  };

  const addTier = () => {
    if (!policy) return;
    setPolicy({
      ...policy,
      refundProrationTiers: [...policy.refundProrationTiers, { withinDays: 7, refundPct: 100 }],
    });
  };

  if (!selectedStoreId) {
    return <p>Select a store from the header to configure refund policy.</p>;
  }

  if (!policy) {
    return <p>Loading refund policy...</p>;
  }

  return (
    <div>
      <h1>Refund Policy — {selectedStore?.name}</h1>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <form className="card form-grid" onSubmit={onSave}>
        <label>
          <input
            type="checkbox"
            checked={policy.defaultRefundable}
            onChange={(e) => setPolicy({ ...policy, defaultRefundable: e.target.checked })}
          />
          Default refundable
        </label>
        <label>
          Refund window (days)
          <input
            type="number"
            value={policy.defaultRefundWindowDays}
            onChange={(e) => setPolicy({ ...policy, defaultRefundWindowDays: Number(e.target.value) })}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={policy.defaultExchangeable}
            onChange={(e) => setPolicy({ ...policy, defaultExchangeable: e.target.checked })}
          />
          Default exchangeable
        </label>
        <label>
          Exchange window (days)
          <input
            type="number"
            value={policy.defaultExchangeWindowDays}
            onChange={(e) => setPolicy({ ...policy, defaultExchangeWindowDays: Number(e.target.value) })}
          />
        </label>
        <label>
          Restocking fee %
          <input
            type="number"
            step="0.01"
            value={policy.restockingFeePct}
            onChange={(e) => setPolicy({ ...policy, restockingFeePct: Number(e.target.value) })}
          />
        </label>
        <label>
          Restocking fee flat
          <input
            type="number"
            step="0.01"
            value={policy.restockingFeeFlat}
            onChange={(e) => setPolicy({ ...policy, restockingFeeFlat: Number(e.target.value) })}
          />
        </label>

        <div className="tier-editor">
          <h3>Proration tiers</h3>
          {policy.refundProrationTiers.map((tier, i) => (
            <div key={i} className="tier-row">
              <label>
                Within days
                <input
                  type="number"
                  value={tier.withinDays}
                  onChange={(e) => updateTier(i, 'withinDays', Number(e.target.value))}
                />
              </label>
              <label>
                Refund %
                <input
                  type="number"
                  value={tier.refundPct}
                  onChange={(e) => updateTier(i, 'refundPct', Number(e.target.value))}
                />
              </label>
            </div>
          ))}
          <button type="button" onClick={addTier}>
            Add tier
          </button>
        </div>

        <button type="submit">Save policy</button>
      </form>
    </div>
  );
}
