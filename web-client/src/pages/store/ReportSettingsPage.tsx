import { FormEvent, useEffect, useState } from 'react';
import { getReportSettings, ReportSettings, updateReportSettings } from '../../api/stores';
import { useStoreContext } from '../../context/StoreContext';

export function ReportSettingsPage() {
  const { selectedStoreId, selectedStore } = useStoreContext();
  const [settings, setSettings] = useState<ReportSettings | null>(null);
  const [recipientsText, setRecipientsText] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!selectedStoreId) return;
    getReportSettings(selectedStoreId)
      .then((data) => {
        setSettings(data);
        setRecipientsText(data.recipients.join(', '));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [selectedStoreId]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId || !settings) return;
    setError('');
    setMessage('');
    const recipients = recipientsText
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);
    try {
      const updated = await updateReportSettings(selectedStoreId, { ...settings, recipients });
      setSettings(updated);
      setRecipientsText(updated.recipients.join(', '));
      setMessage('Report settings saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  if (!selectedStoreId) {
    return <p>Select a store from the header to configure report delivery.</p>;
  }

  if (!settings) {
    return <p>Loading report settings...</p>;
  }

  return (
    <div>
      <h1>Report Settings — {selectedStore?.name}</h1>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <form className="card form-grid" onSubmit={onSave}>
        <label>
          Channel
          <select value={settings.channel} onChange={(e) => setSettings({ ...settings, channel: e.target.value })}>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </label>
        <label>
          Recipients (comma-separated)
          <input value={recipientsText} onChange={(e) => setRecipientsText(e.target.value)} />
        </label>
        <label>
          Send time (HH:mm)
          <input
            value={settings.sendTime}
            onChange={(e) => setSettings({ ...settings, sendTime: e.target.value })}
          />
        </label>
        <label>
          Timezone
          <input
            value={settings.timezone}
            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
          />
        </label>
        <button type="submit">Save report settings</button>
      </form>
    </div>
  );
}
