import { FormEvent, useEffect, useState } from 'react';
import { getStoreSettings, StoreSettings, updateStoreSettings } from '../../api/stores';
import { useStoreContext } from '../../context/StoreContext';

export function StoreSettingsPage() {
  const { selectedStoreId, selectedStore } = useStoreContext();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!selectedStoreId) return;
    getStoreSettings(selectedStoreId)
      .then(setSettings)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [selectedStoreId]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId || !settings) return;
    setError('');
    setMessage('');
    try {
      const updated = await updateStoreSettings(selectedStoreId, settings);
      setSettings(updated);
      setMessage('Settings saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  if (!selectedStoreId) {
    return <p>Select a store from the header to configure settings.</p>;
  }

  if (!settings) {
    return <p>Loading settings for {selectedStore?.name}...</p>;
  }

  return (
    <div>
      <h1>Store Settings — {selectedStore?.name}</h1>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <form className="card form-grid" onSubmit={onSave}>
        <label>
          Opening time
          <input
            value={settings.openingTime}
            onChange={(e) => setSettings({ ...settings, openingTime: e.target.value })}
          />
        </label>
        <label>
          Closing time
          <input
            value={settings.closingTime}
            onChange={(e) => setSettings({ ...settings, closingTime: e.target.value })}
          />
        </label>
        <label>
          Timezone
          <input
            value={settings.timezone}
            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
          />
        </label>
        <label>
          Monthly rent
          <input
            type="number"
            value={settings.monthlyRent}
            onChange={(e) => setSettings({ ...settings, monthlyRent: Number(e.target.value) })}
          />
        </label>
        <label>
          Default markup %
          <input
            type="number"
            step="0.1"
            value={settings.defaultMarkupPct}
            onChange={(e) => setSettings({ ...settings, defaultMarkupPct: Number(e.target.value) })}
          />
        </label>
        <button type="submit">Save settings</button>
      </form>
    </div>
  );
}
