import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => (
  <div style={{ textAlign: 'center', padding: '80px 20px' }}>
    <h1 style={{ fontSize: 72, fontWeight: 900, color: '#e5e7eb', margin: 0 }}>404</h1>
    <h2 style={{ fontSize: 22, fontWeight: 700, color: '#374151', marginTop: 8 }}>Page Not Found</h2>
    <p style={{ color: '#6b7280', marginBottom: 24 }}>
      The page you're looking for doesn't exist.
    </p>
    <Link
      to="/dashboard"
      style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}
    >
      ← Back to Dashboard
    </Link>
  </div>
);

export default NotFound;
