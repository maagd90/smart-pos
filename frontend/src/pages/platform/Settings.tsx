import React from 'react';

export default function PlatformSettings() {
  return (
    <div>
      <h1 style={styles.title}>Platform Settings</h1>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>General</h2>
        <div style={styles.card}>
          <div style={styles.field}>
            <label style={styles.label}>Platform Name</label>
            <input style={styles.input} defaultValue="Smart POS Platform" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Support Email</label>
            <input style={styles.input} type="email" defaultValue="support@smartpos.com" />
          </div>
          <button style={styles.btn}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 },
  btn: { padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', width: 'fit-content' },
};
