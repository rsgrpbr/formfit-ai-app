'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useGamification } from '@/hooks/useGamification';
import { getRecentSessionsWithExercise } from '@/lib/supabase/queries';
import type { SessionWithExercise } from '@/lib/supabase/queries';

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

  const [sessions,     setSessions]     = useState<SessionWithExercise[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !user) router.push('/login');
  }, [sessionLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    setStatsLoading(true);
    getRecentSessionsWithExercise(user.id, 50).then(data => {
      setSessions(data);
      setStatsLoading(false);
    });
  }, [user]);

  if (sessionLoading || gamLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Cálculo da barra XP ─────────────────────────────────────────────────────
  const levelStart = LEVEL_START[level] ?? 0;
  const levelEnd   = LEVEL_END[level]   ?? 500;
  const xpInLevel  = totalXp - levelStart;
  const xpRange    = levelEnd - levelStart;
  const xpPercent  = level === 'Elite'
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

  // ── Stats de sessões ────────────────────────────────────────────────────────
  const totalSessions = sessions.length;
  const totalReps     = sessions.reduce((sum, s) => sum + (s.total_reps ?? 0), 0);
  const bestScore     = sessions.length > 0
    ? Math.round(Math.max(...sessions.map(s => s.avg_score ?? 0)) * 10) / 10
    : 0;
  const totalMinutes  = Math.floor(
    sessions.reduce((sum, s) => {
      if (!s.ended_at) return sum;
      return sum + (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000;
    }, 0)
  );

  const recentSessions = sessions.slice(0, 10);

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

        {/* ── Hero card: avatar + nome + nível + streak + XP ── */}
        <div className="bg-gray-900 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`w-16 h-16 rounded-2xl ${avatarColor} flex items-center justify-center
                text-2xl font-black text-white flex-shrink-0 select-none`}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold truncate">{displayName}</p>
              <span className={`text-xs font-semibold uppercase tracking-wider ${textColor}`}>
                {level}
              </span>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-3xl font-black leading-none">🔥 {currentStreak}</p>
              <p className="text-xs text-gray-500 mt-1">dias seguidos</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>{totalXp.toLocaleString('pt-BR')} XP</span>
              {nextLevel ? (
                <span>
                  Faltam <strong className="text-white">{xpToNext.toLocaleString('pt-BR')} XP</strong> → {nextLevel}
                </span>
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

        {/* ── Gamificação: XP · streak atual · melhor streak ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={totalXp.toLocaleString('pt-BR')} label="XP total"         valueClass="text-indigo-400" />
          <StatCard value={`🔥 ${currentStreak}`}           label="Sequência"        valueClass="text-orange-400" />
          <StatCard value={String(longestStreak)}            label="Melhor streak"    valueClass="text-purple-400" />
        </div>

        {/* ── Sessões: total · reps · score · minutos ── */}
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-2xl p-4 h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard value={String(totalSessions)}               label="Sessões completas" valueClass="text-green-400" />
            <StatCard value={totalReps.toLocaleString('pt-BR')}   label="Total de reps"     valueClass="text-blue-400" />
            <StatCard value={`${bestScore}`}                       label="Melhor score"      valueClass="text-yellow-400" />
            <StatCard value={`${totalMinutes} min`}               label="Tempo treinado"    valueClass="text-rose-400" />
          </div>
        )}

        {/* ── Histórico: últimas 10 sessões ── */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-gray-300">Últimas sessões</h2>
          </div>

          {statsLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-500 text-sm">
              Nenhuma sessão registrada ainda.
              <br />
              <Link href="/analyze" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
                Começar agora →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-800">
              {recentSessions.map(s => (
                <SessionRow key={s.id} session={s} />
              ))}
            </ul>
          )}
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

function SessionRow({ session: s }: { session: SessionWithExercise }) {
  const scoreClass =
    s.avg_score >= 80 ? 'text-green-400' :
    s.avg_score >= 60 ? 'text-yellow-400' :
    'text-red-400';

  return (
    <li className="flex items-center gap-3 px-5 py-3">
      {/* Data */}
      <span className="text-xs text-gray-500 w-12 flex-shrink-0 text-center">
        {formatDate(s.started_at)}
      </span>

      {/* Exercício */}
      <span className="flex-1 text-sm font-medium truncate">
        {s.exercise?.name_pt ?? s.exercise_id}
      </span>

      {/* Score */}
      <span className={`text-sm font-bold w-10 text-right flex-shrink-0 ${scoreClass}`}>
        {Math.round(s.avg_score)}
      </span>

      {/* Reps */}
      <span className="text-xs text-gray-400 w-14 text-right flex-shrink-0">
        {s.total_reps} reps
      </span>

      {/* Duração */}
      <span className="text-xs text-gray-500 w-12 text-right flex-shrink-0">
        {formatDuration(s.started_at, s.ended_at)}
      </span>
    </li>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return '--';
  const sec = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const s   = sec % 60;
  return s > 0 ? `${min}m${String(s).padStart(2, '0')}s` : `${min}min`;
}
