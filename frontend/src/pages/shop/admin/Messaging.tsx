import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import type { MessagingConfig } from '../../../types';

type Step = 1 | 2 | 3;

interface ConfigResponse {
  config: MessagingConfig | null;
}

export default function Messaging() {
  const { shopId } = useParams<{ shopId: string }>();
  const [step, setStep] = useState<Step>(1);
  const [config, setConfig] = useState<MessagingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({ accountSid: '', authToken: '', whatsappNumber: '' });
  const [testPhone, setTestPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    api.get<ConfigResponse>(`/api/shops/${shopId}/messaging`)
      .then((r) => {
        setConfig(r.data.config);
        if (r.data.config?.enabled) setStep(3);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [shopId]);

  async function handleConfigure(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post(`/api/shops/${shopId}/messaging/configure`, form);
      toast.success('WhatsApp configured successfully!');
      setStep(3);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Configuration failed');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTest(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post(`/api/shops/${shopId}/messaging/test`, {
        to: testPhone,
        message: '👋 Hello from Smart POS! Your WhatsApp integration is working correctly.',
      });
      toast.success('Test message sent!');
    } catch {
      toast.error('Failed to send test message');
    }
  }

  if (isLoading) return <div style={styles.loading}>Loading…</div>;

  return (
    <div>
      <h1 style={styles.title}>WhatsApp Setup</h1>

      {/* Step Indicator */}
      <div style={styles.steps}>
        {([1, 2, 3] as Step[]).map((s) => (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ ...styles.stepBubble, ...(step >= s ? styles.stepActive : {}) }}>
                {step > s ? '✓' : s}
              </div>
              <span style={{ fontSize: 13, color: step >= s ? '#1e293b' : '#94a3b8', fontWeight: step === s ? 600 : 400 }}>
                {['Create Account', 'Enter Credentials', 'Test & Confirm'][s - 1]}
              </span>
            </div>
            {s < 3 && <div style={styles.stepLine} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Step 1: Create a Twilio Account</h2>
          <p style={styles.text}>To send WhatsApp messages, you need a Twilio account with WhatsApp enabled.</p>
          <ol style={styles.ol}>
            <li>Go to <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" style={styles.link}>twilio.com/try-twilio</a> and sign up</li>
            <li>In the Twilio Console, navigate to <strong>Messaging → Try it out → Send a WhatsApp message</strong></li>
            <li>Follow the sandbox setup to connect your WhatsApp number</li>
            <li>Note your <strong>Account SID</strong> and <strong>Auth Token</strong> from the dashboard</li>
          </ol>
          <button style={styles.btn} onClick={() => setStep(2)}>I have my credentials →</button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Step 2: Enter Twilio Credentials</h2>
          <p style={styles.text}>Your credentials are encrypted and stored securely.</p>
          <form onSubmit={(e) => void handleConfigure(e)} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Account SID</label>
              <input placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={form.accountSid}
                onChange={(e) => setForm({ ...form, accountSid: e.target.value })}
                style={styles.input} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Auth Token</label>
              <input type="password" placeholder="Your auth token"
                value={form.authToken}
                onChange={(e) => setForm({ ...form, authToken: e.target.value })}
                style={styles.input} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>WhatsApp Number (with country code)</label>
              <input placeholder="+14155238886"
                value={form.whatsappNumber}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                style={styles.input} required />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={styles.btnGhost} onClick={() => setStep(1)}>← Back</button>
              <button type="submit" disabled={isSaving} style={styles.btn}>
                {isSaving ? 'Saving…' : 'Save & Continue →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div style={styles.card}>
          <div style={styles.successBanner}>
            <span style={{ fontSize: 24 }}>✅</span>
            <div>
              <strong>WhatsApp is configured!</strong>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#166534' }}>
                Number: {config?.whatsappNumber ?? form.whatsappNumber}
              </p>
            </div>
          </div>
          <h2 style={styles.cardTitle}>Step 3: Send a Test Message</h2>
          <form onSubmit={(e) => void handleTest(e)} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Your WhatsApp number (with country code)</label>
              <input placeholder="+1234567890" value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)} style={styles.input} required />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={styles.btnGhost} onClick={() => setStep(2)}>Reconfigure</button>
              <button type="submit" style={styles.btn}>Send Test Message</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 24 },
  loading: { padding: 40, textAlign: 'center', color: '#64748b' },
  steps: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 },
  stepBubble: { width: 28, height: 28, borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 },
  stepActive: { backgroundColor: '#3b82f6', color: '#fff' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#e2e8f0', minWidth: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 28, maxWidth: 560, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  cardTitle: { fontSize: 18, fontWeight: 700, color: '#1e293b', marginTop: 0, marginBottom: 12 },
  text: { color: '#64748b', fontSize: 14, marginBottom: 16 },
  ol: { color: '#374151', fontSize: 14, lineHeight: 1.8, paddingLeft: 20, marginBottom: 24 },
  link: { color: '#3b82f6' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 },
  btn: { padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  btnGhost: { padding: '10px 20px', backgroundColor: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer' },
  successBanner: { display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: 16, marginBottom: 24 },
};
