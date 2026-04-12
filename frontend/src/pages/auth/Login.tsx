import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Login failed. Please check your credentials.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>🏪</div>
          <h1 style={styles.title}>Smart POS</h1>
          <p style={styles.subtitle}>Sign in to your account</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={styles.input}
              autoComplete="email"
              required
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" disabled={isLoading} style={styles.button}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  header: {
    textAlign: 'center',
    marginBottom: 28,
  },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: '#1e293b' },
  subtitle: { margin: 0, color: '#64748b', fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    color: '#111827',
  },
  button: {
    padding: '12px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  },
};
