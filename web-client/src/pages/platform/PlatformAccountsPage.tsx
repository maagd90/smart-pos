import { FormEvent, useEffect, useState } from 'react';
import {
  Account,
  assignPlan,
  createPlatformAccount,
  listPlans,
  listPlatformAccounts,
  Plan,
  reactivateAccount,
  setAiEntitlement,
  suspendAccount,
} from '../../api/platform';

export function PlatformAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    currency: 'AED',
    locale: 'en-AE',
    ownerEmail: '',
    ownerPassword: '',
    ownerDisplayName: '',
  });

  const load = async () => {
    const [acctList, planList] = await Promise.all([listPlatformAccounts(), listPlans()]);
    setAccounts(acctList);
    setPlans(planList);
  };

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await createPlatformAccount(form);
      setMessage('Account created');
      setForm({ name: '', currency: 'AED', locale: 'en-AE', ownerEmail: '', ownerPassword: '', ownerDisplayName: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  };

  const onAssignPlan = async (accountId: string, planId: string) => {
    try {
      await assignPlan(accountId, planId);
      setMessage('Plan updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plan update failed');
    }
  };

  const onToggleAi = async (accountId: string, enabled: boolean) => {
    try {
      await setAiEntitlement(accountId, enabled);
      setMessage('AI entitlement updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI update failed');
    }
  };

  const onSuspend = async (accountId: string, suspended: boolean) => {
    try {
      if (suspended) await suspendAccount(accountId);
      else await reactivateAccount(accountId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  return (
    <div>
      <h1>Platform Accounts</h1>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <form className="card form-grid" onSubmit={onCreate}>
        <h2>Create subscriber account</h2>
        <label>
          Account name
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label>
          Currency
          <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
        </label>
        <label>
          Locale
          <input value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })} />
        </label>
        <label>
          Owner email
          <input type="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} required />
        </label>
        <label>
          Owner password
          <input type="password" value={form.ownerPassword} onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })} required />
        </label>
        <label>
          Owner display name
          <input value={form.ownerDisplayName} onChange={(e) => setForm({ ...form, ownerDisplayName: e.target.value })} />
        </label>
        <button type="submit">Create account</button>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Plan</th>
            <th>AI</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id}>
              <td>{account.name}</td>
              <td>{account.status}</td>
              <td>
                <select defaultValue="" onChange={(e) => onAssignPlan(account.id, e.target.value)}>
                  <option value="" disabled>
                    Assign plan
                  </option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.maxStores} stores)
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button type="button" onClick={() => onToggleAi(account.id, true)}>
                  Enable AI
                </button>
                <button type="button" onClick={() => onToggleAi(account.id, false)}>
                  Disable AI
                </button>
              </td>
              <td>
                {account.status === 'SUSPENDED' ? (
                  <button type="button" onClick={() => onSuspend(account.id, false)}>
                    Reactivate
                  </button>
                ) : (
                  <button type="button" onClick={() => onSuspend(account.id, true)}>
                    Suspend
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
