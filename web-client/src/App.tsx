import React, { useEffect, useState } from 'react';
import { checkGatewayHealth } from './api/health';

/**
 * Root application component for the Store Management web client.
 *
 * Milestone 1: Displays a skeleton landing page with gateway connectivity status.
 * Auth screens and RBAC-driven navigation are implemented in Milestone 2.
 */
export function App(): React.ReactElement {
  const [gatewayStatus, setGatewayStatus] = useState<string>('checking...');

  useEffect(() => {
    checkGatewayHealth()
      .then((status) => setGatewayStatus(status))
      .catch(() => setGatewayStatus('unreachable'));
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 32 }}>
      <h1>Store Management System</h1>
      <p>Web client skeleton — Milestone 1</p>
      <p>Gateway status: <strong>{gatewayStatus}</strong></p>
      <p>
        Auth and RBAC screens will be implemented after Identity and Tenant
        services are complete.
      </p>
    </main>
  );
}
