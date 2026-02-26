'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/analyze',   icon: '🏋️', label: 'Treinar'   },
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/settings',  icon: '⚙️', label: 'Config'    },
] as const;

const SHOW_ON = new Set(['/analyze', '/dashboard', '/settings']);

export default function BottomNav() {
  const pathname = usePathname();
  if (!SHOW_ON.has(pathname)) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-md border-t border-gray-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around h-16">
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5
                flex-1 min-h-[48px] px-2
                transition-transform duration-150 active:scale-95
                ${active ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <span className="text-xl leading-none">{icon}</span>
              <span className="text-[10px] font-medium leading-none mt-0.5">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
