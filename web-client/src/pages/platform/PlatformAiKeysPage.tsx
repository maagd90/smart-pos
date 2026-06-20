import { FormEvent, useEffect, useState } from 'react';
import { getAiKeyStatus, rotateAiKey } from '../../api/platform';

export function PlatformAiKeysPage() {
  const [last4, setLast4] = useState<string | null>(null);
  const [rotatedAt, setRotatedAt] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    const status = await getAiKeyStatus();
    setLast4(status.last4);
    setRotatedAt(status.rotatedAt);
  };

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

  const onRotate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const status = await rotateAiKey(newKey);
      setLast4(status.last4);
      setRotatedAt(status.rotatedAt);
      setNewKey('');
      setMessage('Key rotated. Only last 4 digits are stored for display.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rotate failed');
    }
  };

  return (
    <div>
      <h1>Platform AI Keys</h1>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <div className="card">
        <p>
          Current key: {last4 ? `****${last4}` : 'Not configured'}
        </p>
        {rotatedAt && <p className="muted">Last rotated: {new Date(rotatedAt).toLocaleString()}</p>}
      </div>

      <form className="card form-grid" onSubmit={onRotate}>
        <h2>Rotate central AI key</h2>
        <label>
          New API key (write-only — never shown again)
          <input type="password" value={newKey} onChange={(e) => setNewKey(e.target.value)} required minLength={4} />
        </label>
        <button type="submit">Rotate key</button>
      </form>
    </div>
  );
}
