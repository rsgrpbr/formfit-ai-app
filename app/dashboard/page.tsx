'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useGamification } from '@/hooks/useGamification';

// ── Constantes de nível ───────────────────────────────────────────────────────

const LEVEL_START: Record<string, number> = {
  'Iniciante':     0,
  'Intermediário': 500,
  'Avançado':      1500,
  'Elite':         3000,
};

const LEVEL_END: Record<string, number> = {
  'Iniciante':     500,
  'Intermediário': 1500,
  'Avançado':      3000,
  'Elite':         3000,
};

const LEVEL_BAR_COLOR: Record<string, string> = {
  'Iniciante':     'bg-gray-400',
  'Intermediário': 'bg-blue-500',
  'Avançado':      'bg-purple-500',
  'Elite':         'bg-yellow-400',
};

const LEVEL_AVATAR_COLOR: Record<string, string> = {
  'Iniciante':     'bg-gray-600',
  'Intermediário': 'bg-blue-600',
  'Avançado':      'bg-purple-600',
  'Elite':         'bg-yellow-500',
};

const LEVEL_TEXT_COLOR: Record<string, string> = {
  'Iniciante':     'text-gray-400',
  'Intermediário': 'text-blue-400',
  'Avançado':      'text-purple-400',
  'Elite':         'text-yellow-400',
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading: sessionLoading, signOut } = useSession();
  const { totalXp, level, nextLevel, xpToNext, streak, loading: gamLoading } = useGamification();

  useEffect(() => {
    if (!sessionLoading && !user) router.push('/login');
  }, [sessionLoading, user, router]);

  if (sessionLoading || gamLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Cálculo da barra XP ─────────────────────────────────────────────────────
  const levelStart  = LEVEL_START[level] ?? 0;
  const levelEnd    = LEVEL_END[level]   ?? 500;
  const xpInLevel   = totalXp - levelStart;
  const xpRange     = levelEnd - levelStart;
  const xpPercent   = level === 'Elite'
    ? 100
    : Math.min(100, Math.round((xpInLevel / xpRange) * 100));

  // ── Avatar com iniciais ─────────────────────────────────────────────────────
  const displayName = profile?.full_name || user.email || 'Usuário';
  const initials    = displayName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('');

  const barColor    = LEVEL_BAR_COLOR[level]    ?? 'bg-indigo-500';
  const avatarColor = LEVEL_AVATAR_COLOR[level] ?? 'bg-indigo-600';
  const textColor   = LEVEL_TEXT_COLOR[level]   ?? 'text-indigo-400';

  const currentStreak = streak?.current_streak ?? 0;
  const longestStreak = streak?.longest_streak ?? 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">FormFit AI</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/analyze" className="text-gray-400 hover:text-white transition-colors">
            Treinar
          </Link>
          <button
            onClick={signOut}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full space-y-4">

        {/* ── Hero card: avatar + nome + nível + streak ── */}
        <div className="bg-gray-900 rounded-2xl p-6">

          <div className="flex items-center gap-4 mb-6">
            {/* Avatar */}
            <div
              className={`w-16 h-16 rounded-2xl ${avatarColor} flex items-center justify-center
                text-2xl font-black text-white flex-shrink-0 select-none`}
            >
              {initials}
            </div>

            {/* Nome + nível */}
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold truncate">{displayName}</p>
              <span className={`text-xs font-semibold uppercase tracking-wider ${textColor}`}>
                {level}
              </span>
            </div>

            {/* Streak */}
            <div className="text-right flex-shrink-0">
              <p className="text-3xl font-black leading-none">
                🔥 {currentStreak}
              </p>
              <p className="text-xs text-gray-500 mt-1">dias seguidos</p>
            </div>
          </div>

          {/* Barra XP */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>{totalXp.toLocaleString('pt-BR')} XP</span>
              {nextLevel ? (
                <span>Faltam <strong className="text-white">{xpToNext.toLocaleString('pt-BR')} XP</strong> → {nextLevel}</span>
              ) : (
                <span className="text-yellow-400 font-semibold">✦ Nível máximo</span>
              )}
            </div>

            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${xpPercent}%` }}
              />
            </div>

            {nextLevel && (
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>{level}</span>
                <span>{nextLevel}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats: XP total · streak atual · melhor streak ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            value={totalXp.toLocaleString('pt-BR')}
            label="XP total"
            valueClass="text-indigo-400"
          />
          <StatCard
            value={`🔥 ${currentStreak}`}
            label="Sequência atual"
            valueClass="text-orange-400"
          />
          <StatCard
            value={String(longestStreak)}
            label="Melhor streak"
            valueClass="text-purple-400"
          />
        </div>

        {/* ── CTA ── */}
        <Link
          href="/analyze"
          className="block w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500
            font-bold text-lg text-center transition-all active:scale-95"
        >
          ▶ Iniciar treino
        </Link>

      </main>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  valueClass = 'text-white',
}: {
  value: string;
  label: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-gray-900 rounded-2xl p-4 text-center">
      <p className={`text-2xl font-black ${valueClass}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
