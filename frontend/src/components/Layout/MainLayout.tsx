import React from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div style={styles.root}>
      <Sidebar />
      <main style={styles.main}>
        <div style={styles.content}>{children}</div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
  },
  main: {
    flex: 1,
    overflow: 'auto',
  },
  content: {
    padding: 24,
    maxWidth: 1200,
    margin: '0 auto',
  },
};
