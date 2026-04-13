import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const validate = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setErrorMessage('');

    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Invalid email format');
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Login failed. Please try again.';
      setErrorMessage(msg);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          background: 'var(--panel)',
          borderRadius: 'var(--radius)',
          padding: 40,
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 4px 24px rgba(16,35,60,0.10)',
        }}
      >
        <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
          Smart POS
        </h1>
        <p style={{ margin: '0 0 28px', color: 'var(--muted)', fontSize: 14 }}>
          Sign in to your account
        </p>

        {errorMessage && (
          <div
            role="alert"
            style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: 8,
              padding: '10px 14px',
              color: 'var(--danger)',
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 18 }}>
            <label
              htmlFor="email"
              style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'var(--text)' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${emailError ? '#f87171' : 'var(--border)'}`,
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                background: 'var(--panel-soft)',
                color: 'var(--text)',
              }}
            />
            {emailError && (
              <p role="alert" style={{ color: 'var(--danger)', fontSize: 12, margin: '4px 0 0' }}>
                {emailError}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="password"
              style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'var(--text)' }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  border: `1px solid ${passwordError ? '#f87171' : 'var(--border)'}`,
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: 'var(--panel-soft)',
                  color: 'var(--text)',
                }}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  fontSize: 14,
                  padding: 0,
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {passwordError && (
              <p role="alert" style={{ color: 'var(--danger)', fontSize: 12, margin: '4px 0 0' }}>
                {passwordError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '11px',
              background: isLoading ? '#93c5fd' : 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
