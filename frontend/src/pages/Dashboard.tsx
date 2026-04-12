import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Dashboard</h1>
      <p style={{ color: '#6b7280' }}>Welcome back, {user?.name}!</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginTop: 24 }}>
        {[
          { label: "Today's Sales", value: '$1,240' },
          { label: 'Customers', value: '48' },
          { label: 'Orders', value: '31' },
          { label: 'Revenue (Month)', value: '$18,920' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: '#fff',
              borderRadius: 10,
              padding: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontSize: 13, color: '#6b7280' }}>{kpi.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1e1b4b', marginTop: 6 }}>{kpi.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
