'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, LayoutGrid, Dumbbell, ClipboardList, BarChart2, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const NAV_ITEMS: { href: string; Icon: LucideIcon; label: string }[] = [
  { href: '/analyze',   Icon: Zap,           label: 'Treinar'   },
  { href: '/workouts',  Icon: LayoutGrid,    label: 'Treinos'   },
  { href: '/exercises', Icon: Dumbbell,      label: 'Exerc.'    },
  { href: '/my-plan',   Icon: ClipboardList, label: 'Plano'     },
  { href: '/progress',  Icon: BarChart2,     label: 'Progresso' },
  { href: '/profile',   Icon: User,          label: 'Perfil'    },
] as const;

const STATIC_ROUTES = new Set(['/workouts', '/exercises', '/my-plan', '/progress', '/profile']);

export default function BottomNav() {
  const pathname = usePathname();

  // Show on static routes + /workouts/[id] and /exercises/[slug], but NOT on session pages
  const showNav =
    STATIC_ROUTES.has(pathname) ||
    /^\/workouts\/[^/]+$/.test(pathname) ||
    /^\/exercises\/[^/]+$/.test(pathname);

  if (!showNav) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        background: 'rgba(3,7,18,0.96)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(12px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-stretch justify-around h-16">
        {NAV_ITEMS.map(({ href, Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[48px] px-1 transition-transform duration-150 active:scale-95"
              style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
              {active && (
                <span className="text-[10px] font-semibold leading-none mt-0.5">{label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
