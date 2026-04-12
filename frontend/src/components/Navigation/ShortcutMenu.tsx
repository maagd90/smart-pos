import React from 'react';
import type { Shortcut } from '../../types';

interface ShortcutMenuProps {
  shortcuts: Shortcut[];
  shopId?: string;
  onNavigate: (path: string) => void;
}

export function ShortcutMenu({ shortcuts, shopId, onNavigate }: ShortcutMenuProps) {
  if (shortcuts.length === 0) return null;

  function resolvePath(path: string): string {
    return shopId ? path.replace('{shopId}', shopId) : path;
  }

  return (
    <div style={styles.container}>
      <div style={styles.label}>Quick Access</div>
      <div style={styles.grid}>
        {shortcuts.map((shortcut) => (
          <button
            key={shortcut.id}
            onClick={() => onNavigate(resolvePath(shortcut.path))}
            style={styles.item}
            title={shortcut.label}
          >
            <span style={styles.icon}>{shortcut.icon}</span>
            <span style={styles.text}>{shortcut.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 8,
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    color: '#374151',
    transition: 'all 0.15s',
  },
  icon: { fontSize: 16 },
  text: { fontWeight: 500 },
};
