import React, { useState } from 'react';
import { CreateTenantInput } from '../services/tenantService';

interface TenantFormProps {
  initial?: Partial<CreateTenantInput>;
  onSubmit: (data: CreateTenantInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

const TenantForm: React.FC<TenantFormProps> = ({ initial, onSubmit, onCancel, isLoading, error }) => {
  const [name, setName] = useState(initial?.name || '');
  const [domain, setDomain] = useState(initial?.domain || '');
  const [adminEmail, setAdminEmail] = useState(initial?.adminEmail || '');
  const [adminName, setAdminName] = useState(initial?.adminName || '');
  const [plan, setPlan] = useState<'FREE' | 'PRO' | 'ENTERPRISE'>(initial?.subscriptionPlan || 'FREE');
  const [maxStaff, setMaxStaff] = useState(initial?.maxStaff || 5);
  const [ipMode, setIpMode] = useState<'all' | 'specific'>(
    initial?.ipRestrictEnabled ? 'specific' : 'all'
  );
  const [ipList, setIpList] = useState((initial?.ipWhitelist || []).join('\n'));
  const [whatsappEnabled, setWhatsappEnabled] = useState(initial?.whatsappEnabled !== false);
  const [emailEnabled, setEmailEnabled] = useState(initial?.emailEnabled !== false);
  const [aiEnabled, setAiEnabled] = useState(initial?.aiEnabled || false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Tenant name is required';
    if (!adminEmail.trim()) errs.adminEmail = 'Admin email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) errs.adminEmail = 'Invalid email';
    if (!adminName.trim()) errs.adminName = 'Admin name is required';
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const ipWhitelist = ipMode === 'all' ? [] : ipList.split('\n').map(s => s.trim()).filter(Boolean);
    onSubmit({
      name: name.trim(),
      domain: domain.trim() || undefined,
      adminEmail: adminEmail.trim(),
      adminName: adminName.trim(),
      subscriptionPlan: plan,
      maxStaff,
      ipWhitelist,
      ipRestrictEnabled: ipMode === 'specific',
      whatsappEnabled,
      emailEnabled,
      aiEnabled,
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
    borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' };
  const fieldStyle: React.CSSProperties = { marginBottom: 18 };
  const errorStyle: React.CSSProperties = { color: '#dc2626', fontSize: 12, marginTop: 4 };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div role="alert" style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 18, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Tenant Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Acme Corp" style={inputStyle} />
          {errors.name && <p style={errorStyle}>{errors.name}</p>}
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Custom Domain (optional)</label>
          <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="Auto-generated if empty" style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Admin Email *</label>
          <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@acme.com" style={inputStyle} />
          {errors.adminEmail && <p style={errorStyle}>{errors.adminEmail}</p>}
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Admin Name *</label>
          <input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="John Doe" style={inputStyle} />
          {errors.adminName && <p style={errorStyle}>{errors.adminName}</p>}
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Subscription Plan</label>
          <select value={plan} onChange={e => setPlan(e.target.value as 'FREE' | 'PRO' | 'ENTERPRISE')} style={inputStyle}>
            <option value="FREE">Free</option>
            <option value="PRO">Pro</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Max Staff Members</label>
          <input type="number" min={1} max={1000} value={maxStaff} onChange={e => setMaxStaff(Number(e.target.value))} style={inputStyle} />
        </div>
      </div>

      <div style={{ ...fieldStyle, background: '#f8fafc', borderRadius: 8, padding: 16, marginBottom: 18 }}>
        <label style={{ ...labelStyle, marginBottom: 12 }}>IP Access Control</label>
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="radio" value="all" checked={ipMode === 'all'} onChange={() => setIpMode('all')} />
            <span style={{ fontSize: 14 }}>Allow all IPs (0.0.0.0/0)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="radio" value="specific" checked={ipMode === 'specific'} onChange={() => setIpMode('specific')} />
            <span style={{ fontSize: 14 }}>Restrict to specific IPs/CIDRs</span>
          </label>
        </div>
        {ipMode === 'specific' && (
          <div>
            <label style={{ ...labelStyle, fontWeight: 400, color: '#6b7280' }}>
              Enter one IP or CIDR per line (e.g. 192.168.1.0/24 or 203.0.113.1)
            </label>
            <textarea
              value={ipList}
              onChange={e => setIpList(e.target.value)}
              placeholder={"192.168.1.0/24\n203.0.113.1\n10.0.0.0/8"}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }}
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
        {[
          { label: 'WhatsApp Messaging', val: whatsappEnabled, set: setWhatsappEnabled },
          { label: 'Email Notifications', val: emailEnabled, set: setEmailEnabled },
          { label: 'AI Features', val: aiEnabled, set: setAiEnabled },
        ].map(({ label, val, set }) => (
          <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} />
            {label}
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Cancel
        </button>
        <button type="submit" disabled={isLoading} style={{ padding: '10px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, opacity: isLoading ? 0.7 : 1 }}>
          {isLoading ? 'Creating...' : initial ? 'Save Changes' : 'Create Tenant'}
        </button>
      </div>
    </form>
  );
};

export default TenantForm;
