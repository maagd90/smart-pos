import React, { useState } from 'react';

type Tab = 'general' | 'notifications' | 'security' | 'receipt';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [shopName, setShopName] = useState('My Shop');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [receiptFooter, setReceiptFooter] = useState('Thank you for your purchase!');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'general', label: 'General', icon: '⚙️' },
    { key: 'notifications', label: 'Notifications', icon: '🔔' },
    { key: 'security', label: 'Security', icon: '🔒' },
    { key: 'receipt', label: 'Receipt', icon: '🧾' },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 14,
    background: 'var(--panel-soft)',
    color: 'var(--text)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--muted)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: 'var(--text)' }}>Settings</h1>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>Manage your shop configuration</p>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Sidebar tabs */}
        <div style={{ width: 180, flexShrink: 0 }}>
          <div style={{ background: 'var(--panel)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: activeTab === tab.key ? 'var(--primary)' : 'transparent',
                  color: activeTab === tab.key ? '#fff' : 'var(--text)',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  textAlign: 'left',
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{ background: 'var(--panel)', borderRadius: 14, padding: '24px 28px', border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(16,35,60,0.06)' }}>
            {activeTab === 'general' && (
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: 'var(--text)' }}>General Settings</h2>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Shop Name</label>
                    <input style={inputStyle} value={shopName} onChange={(e) => setShopName(e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Currency</label>
                    <select style={inputStyle} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      <option value="USD">USD — US Dollar</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="GBP">GBP — British Pound</option>
                      <option value="JPY">JPY — Japanese Yen</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Timezone</label>
                    <select style={inputStyle} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="Asia/Tokyo">Asia/Tokyo</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: 'var(--text)' }}>Notification Settings</h2>
                <div style={{ display: 'grid', gap: 16 }}>
                  {[
                    { label: 'Email Notifications', desc: 'Receive order summaries by email', val: emailNotif, set: setEmailNotif },
                    { label: 'SMS Notifications', desc: 'Get SMS alerts for important events', val: smsNotif, set: setSmsNotif },
                    { label: 'Low Stock Alerts', desc: 'Alert when inventory falls below minimum', val: lowStockAlert, set: setLowStockAlert },
                  ].map((n) => (
                    <div key={n.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--panel-soft)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{n.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{n.desc}</div>
                      </div>
                      <button
                        onClick={() => n.set(!n.val)}
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 99,
                          background: n.val ? 'var(--primary)' : 'var(--border)',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s',
                          flexShrink: 0,
                        }}
                        aria-label={`Toggle ${n.label}`}
                      >
                        <span style={{
                          position: 'absolute',
                          top: 2,
                          left: n.val ? 22 : 2,
                          width: 20,
                          height: 20,
                          background: '#fff',
                          borderRadius: '50%',
                          transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: 'var(--text)' }}>Security Settings</h2>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Current Password</label>
                    <input style={inputStyle} type="password" placeholder="••••••••" />
                  </div>
                  <div>
                    <label style={labelStyle}>New Password</label>
                    <input style={inputStyle} type="password" placeholder="••••••••" />
                  </div>
                  <div>
                    <label style={labelStyle}>Confirm New Password</label>
                    <input style={inputStyle} type="password" placeholder="••••••••" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'receipt' && (
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: 'var(--text)' }}>Receipt Settings</h2>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Receipt Footer Message</label>
                    <textarea
                      value={receiptFooter}
                      onChange={(e) => setReceiptFooter(e.target.value)}
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={handleSave}
                style={{ padding: '9px 24px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
              >
                Save Changes
              </button>
              {saved && <span style={{ color: 'var(--success)', fontSize: 13, fontWeight: 500 }}>✓ Saved!</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
