import { FormEvent, useEffect, useState } from 'react';
import { ApiError } from '../../api/client';
import { createStore, listStores, Store } from '../../api/accounts';
import { useAuth } from '../../context/AuthContext';
import { useStoreContext } from '../../context/StoreContext';

export function AccountStoresPage() {
  const { accountId } = useAuth();
  const { reloadStores } = useStoreContext();
  const [stores, setStores] = useState<Store[]>([]);
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Dubai');
  const [error, setError] = useState('');
  const [upgradeMessage, setUpgradeMessage] = useState('');

  const load = async () => {
    if (!accountId) return;
    setStores(await listStores(accountId));
  };

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [accountId]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!accountId) return;
    setError('');
    setUpgradeMessage('');
    try {
      await createStore(accountId, name, timezone);
      setName('');
      await load();
      await reloadStores();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'UPGRADE_REQUIRED') {
        setUpgradeMessage(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Create failed');
      }
    }
  };

  return (
    <div>
      <h1>Stores</h1>
      {error && <p className="error">{error}</p>}
      {upgradeMessage && <p className="upgrade-banner">{upgradeMessage}</p>}

      <form className="card form-grid" onSubmit={onCreate}>
        <h2>Create store</h2>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Timezone
          <input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
        </label>
        <button type="submit">Create store</button>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Timezone</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((store) => (
            <tr key={store.id}>
              <td>{store.name}</td>
              <td>{store.timezone}</td>
              <td>{store.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
