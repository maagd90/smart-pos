import React from 'react';
import { createRoot } from 'react-dom/client';
function App() { return <main style={{ fontFamily: 'Arial, sans-serif', padding: 32 }}><h1>Store Management System</h1><p>Web client skeleton. Auth and RBAC screens will be implemented after Identity & Tenant services.</p></main>; }
createRoot(document.getElementById('root')!).render(<App />);
