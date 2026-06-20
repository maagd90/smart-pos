import { FormEvent, useEffect, useState } from 'react';
import { assignRole, listRoles, listUsers, Role, User } from '../../api/accounts';
import { useAuth } from '../../context/AuthContext';
import { useStoreContext } from '../../context/StoreContext';

export function AccountRolesPage() {
  const { accountId } = useAuth();
  const { stores } = useStoreContext();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userId, setUserId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!accountId) return;
    Promise.all([listUsers(accountId), listRoles(accountId)])
      .then(([u, r]) => {
        setUsers(u);
        setRoles(r);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [accountId]);

  const onAssign = async (e: FormEvent) => {
    e.preventDefault();
    if (!accountId || !userId || !roleId) return;
    setError('');
    setMessage('');
    try {
      await assignRole(accountId, userId, roleId, storeId || null);
      setMessage('Role assigned. Per-store roles require selecting a store.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assignment failed');
    }
  };

  return (
    <div>
      <h1>Role Assignment</h1>
      <p className="muted">
        Assign roles to users. Cashier and store-scoped roles require picking a specific store.
      </p>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <form className="card form-grid" onSubmit={onAssign}>
        <label>
          User
          <select value={userId} onChange={(e) => setUserId(e.target.value)} required>
            <option value="">Select user</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
        </label>
        <label>
          Role
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)} required>
            <option value="">Select role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Store (optional — required for per-store roles like cashier)
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
            <option value="">Account-wide / none</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Assign role</button>
      </form>
    </div>
  );
}
