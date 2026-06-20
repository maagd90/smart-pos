import { FormEvent, useEffect, useState } from 'react';
import { createUser, listUsers, User } from '../../api/accounts';
import { useAuth } from '../../context/AuthContext';

export function AccountUsersPage() {
  const { accountId } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    if (!accountId) return;
    setUsers(await listUsers(accountId));
  };

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [accountId]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!accountId) return;
    setError('');
    try {
      await createUser(accountId, { email, password, displayName: displayName || undefined });
      setEmail('');
      setPassword('');
      setDisplayName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  };

  return (
    <div>
      <h1>Users</h1>
      {error && <p className="error">{error}</p>}

      <form className="card form-grid" onSubmit={onCreate}>
        <h2>Create user</h2>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <label>
          Display name
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <button type="submit">Create user</button>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Display name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.displayName}</td>
              <td>{user.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
