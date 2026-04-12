import React from 'react';

export default function PlatformSubscriptions() {
  const plans = [
    { name: 'Basic', price: 29, features: ['1 Location', '3 Staff', 'Basic Analytics', 'Email Support'] },
    { name: 'Pro', price: 79, features: ['3 Locations', '15 Staff', 'Advanced Analytics', 'WhatsApp Integration', 'Priority Support'], popular: true },
    { name: 'Enterprise', price: 199, features: ['Unlimited Locations', 'Unlimited Staff', 'Custom Analytics', 'WhatsApp + SMS', 'Dedicated Support', 'SLA'] },
  ];

  return (
    <div>
      <h1 style={styles.title}>Subscription Plans</h1>
      <p style={styles.subtitle}>Manage your subscription tiers</p>
      <div style={styles.grid}>
        {plans.map((plan) => (
          <div key={plan.name} style={{ ...styles.card, ...(plan.popular ? styles.cardPopular : {}) }}>
            {plan.popular && <div style={styles.badge}>Most Popular</div>}
            <h2 style={styles.planName}>{plan.name}</h2>
            <div style={styles.price}>
              <span style={styles.currency}>$</span>
              <span style={styles.amount}>{plan.price}</span>
              <span style={styles.period}>/mo</span>
            </div>
            <ul style={styles.features}>
              {plan.features.map((f) => (
                <li key={f} style={styles.feature}>
                  <span style={{ color: '#10b981', marginRight: 8 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <button style={{ ...styles.btn, ...(plan.popular ? styles.btnPrimary : styles.btnOutline) }}>
              Configure Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 4 },
  subtitle: { color: '#64748b', marginBottom: 32 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '2px solid transparent', position: 'relative' },
  cardPopular: { border: '2px solid #3b82f6' },
  badge: { position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#3b82f6', color: '#fff', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  planName: { fontSize: 20, fontWeight: 700, margin: '0 0 8px' },
  price: { display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 20 },
  currency: { fontSize: 20, color: '#64748b' },
  amount: { fontSize: 48, fontWeight: 800, color: '#1e293b' },
  period: { color: '#64748b' },
  features: { listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 },
  feature: { fontSize: 14, color: '#374151', display: 'flex', alignItems: 'center' },
  btn: { width: '100%', padding: '12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  btnPrimary: { backgroundColor: '#3b82f6', color: '#fff', border: 'none' },
  btnOutline: { backgroundColor: 'transparent', color: '#3b82f6', border: '2px solid #3b82f6' },
};
