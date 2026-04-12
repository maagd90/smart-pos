import React, { useState } from 'react';
import api from '../services/api';

type WizardStep = 1 | 2 | 3;

const STEPS = ['Sign Up for Twilio', 'Configure Credentials', 'Test Connection'];

const WhatsAppWizard: React.FC = () => {
  const [step, setStep] = useState<WizardStep>(1);
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testMessage, setTestMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!accountSid.trim()) e.accountSid = 'Account SID is required';
    if (!authToken.trim()) e.authToken = 'Auth Token is required';
    if (!whatsappNumber.trim()) e.whatsappNumber = 'WhatsApp number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 2 && !validateStep2()) return;
    if (step < 3) setStep((s) => (s + 1) as WizardStep);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as WizardStep);
  };

  const handleSendTest = async () => {
    if (!testPhone.trim()) {
      setErrors({ testPhone: 'Phone number is required for test' });
      return;
    }
    setIsSending(true);
    setErrors({});
    try {
      await api.post('/whatsapp/test', { accountSid, authToken, whatsappNumber, testPhone });
      setTestMessage('Test message sent successfully!');
      setIsSuccess(true);
    } catch (err: any) {
      setTestMessage(err?.response?.data?.message || 'Failed to send test message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>WhatsApp Setup</h1>
      <p style={{ color: '#6b7280', marginBottom: 24, fontSize: 14 }}>
        Connect your shop to WhatsApp for customer notifications.
      </p>

      {/* Step indicator */}
      <div style={{ display: 'flex', marginBottom: 32, gap: 0 }}>
        {STEPS.map((label, idx) => {
          const stepNum = (idx + 1) as WizardStep;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', margin: '0 auto 8px',
                background: isDone ? '#16a34a' : isActive ? '#4f46e5' : '#e5e7eb',
                color: isDone || isActive ? '#fff' : '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14,
              }}>
                {isDone ? '✓' : stepNum}
              </div>
              <div style={{ fontSize: 12, color: isActive ? '#4f46e5' : '#6b7280' }}>{label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Step 1: Sign Up for Twilio</h2>
            <p style={{ fontSize: 14, color: '#374151', marginBottom: 16 }}>
              To send WhatsApp messages, you need a Twilio account with WhatsApp enabled.
            </p>
            <ol style={{ fontSize: 14, color: '#374151', paddingLeft: 20, lineHeight: 1.8 }}>
              <li>Go to <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noreferrer" style={{ color: '#4f46e5' }}>twilio.com/try-twilio</a></li>
              <li>Create a free account</li>
              <li>Enable the WhatsApp Sandbox in your Twilio console</li>
              <li>Copy your Account SID and Auth Token</li>
            </ol>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Step 2: Enter Credentials</h2>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Account SID</label>
              <input
                value={accountSid}
                onChange={(e) => setAccountSid(e.target.value)}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                style={{ width: '100%', padding: '8px 10px', border: `1px solid ${errors.accountSid ? '#f87171' : '#d1d5db'}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
              />
              {errors.accountSid && <p role="alert" style={{ color: '#dc2626', fontSize: 12, margin: '4px 0 0' }}>{errors.accountSid}</p>}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Auth Token</label>
              <input
                type="password"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="Your Twilio Auth Token"
                style={{ width: '100%', padding: '8px 10px', border: `1px solid ${errors.authToken ? '#f87171' : '#d1d5db'}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
              />
              {errors.authToken && <p role="alert" style={{ color: '#dc2626', fontSize: 12, margin: '4px 0 0' }}>{errors.authToken}</p>}
            </div>
            <div style={{ marginBottom: 4 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>WhatsApp Number</label>
              <input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+14155238886"
                style={{ width: '100%', padding: '8px 10px', border: `1px solid ${errors.whatsappNumber ? '#f87171' : '#d1d5db'}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
              />
              {errors.whatsappNumber && <p role="alert" style={{ color: '#dc2626', fontSize: 12, margin: '4px 0 0' }}>{errors.whatsappNumber}</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Step 3: Test Connection</h2>
            {isSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <p style={{ color: '#16a34a', fontWeight: 600, fontSize: 16 }}>WhatsApp configured successfully!</p>
                <p style={{ color: '#6b7280', fontSize: 13 }}>{testMessage}</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 14, color: '#374151', marginBottom: 16 }}>
                  Enter a phone number to send a test WhatsApp message.
                </p>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Test Phone Number</label>
                  <input
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+1234567890"
                    style={{ width: '100%', padding: '8px 10px', border: `1px solid ${errors.testPhone ? '#f87171' : '#d1d5db'}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                  {errors.testPhone && <p role="alert" style={{ color: '#dc2626', fontSize: 12, margin: '4px 0 0' }}>{errors.testPhone}</p>}
                </div>
                {testMessage && (
                  <div role="alert" style={{ color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
                    {testMessage}
                  </div>
                )}
                <button
                  onClick={handleSendTest}
                  disabled={isSending}
                  style={{ padding: '9px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
                >
                  {isSending ? 'Sending…' : 'Send Test Message'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        <button
          onClick={handleBack}
          disabled={step === 1}
          style={{
            padding: '9px 20px', background: step === 1 ? '#e5e7eb' : '#f3f4f6',
            color: step === 1 ? '#9ca3af' : '#374151', border: 'none', borderRadius: 8,
            cursor: step === 1 ? 'not-allowed' : 'pointer', fontWeight: 600,
          }}
        >
          ← Back
        </button>
        {!isSuccess && step < 3 && (
          <button
            onClick={handleNext}
            style={{ padding: '9px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
};

export default WhatsAppWizard;
