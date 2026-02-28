'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';

export default function AppHeader() {
  return (
    <header
      className="flex items-center justify-between px-5 border-b"
      style={{
        height: '56px',
        background: 'var(--bg)',
        borderColor: 'var(--border)',
      }}
    >
      <span className="font-display text-2xl tracking-widest" style={{ color: 'var(--text)' }}>
        FORMFIT<span style={{ color: 'var(--accent)' }}>AI</span>
      </span>

      <Link
        href="/profile"
        className="flex items-center justify-center w-10 h-10 rounded-full transition-colors"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Settings"
      >
        <Settings size={20} />
      </Link>
    </header>
  );
}
