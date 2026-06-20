import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@smartpos.local');
  const [password, setPassword] = useState('changeme123');
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    }
  };

  return (
    <div className="login-page">
      <form className="card" onSubmit={onSubmit}>
        <h1>Admin Login</h1>
        {error && <p className="error">{error}</p>}
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}

export function HomeRedirect() {
  const { isPlatformAdmin, permissions } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isPlatformAdmin) {
      navigate('/platform/accounts', { replace: true });
      return;
    }
    if (permissions.has('stores.manage')) {
      navigate('/account/stores', { replace: true });
      return;
    }
    if (permissions.has('store.settings.manage') || permissions.has('store.refund_policy.manage')) {
      navigate('/store/settings', { replace: true });
      return;
    }
    if (permissions.has('reports.view')) {
      navigate('/store/report-settings', { replace: true });
    }
  }, [isPlatformAdmin, permissions, navigate]);

  return <p>Welcome. Redirecting...</p>;
}
