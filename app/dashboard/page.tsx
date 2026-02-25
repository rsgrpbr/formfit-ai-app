'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSession } from '@/hooks/useSession';
import { useGamification } from '@/hooks/useGamification';
import { useWeeklyChallenge } from '@/hooks/useWeeklyChallenge';
import { useLocale } from '@/providers/I18nProvider';
import type { Locale } from '@/providers/I18nProvider';
import { getRecentSessionsWithExercise } from '@/lib/supabase/queries';
import type { SessionWithExercise } from '@/lib/supabase/queries';
import { getAllBadges } from '@/lib/supabase/gamification';
import type { Badge } from '@/types/gamification';

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
  const t = useTranslations('dashboard');

  const { user, profile, loading: sessionLoading, signOut } = useSession();
  const { locale, setLocale } = useLocale();
  const {
    totalXp, level, nextLevel, xpToNext, streak,
    badges, loading: gamLoading,
  } = useGamification();
  const { challenge, progress, timeLeft, isCompleted, loading: chalLoading } = useWeeklyChallenge();

  const [sessions,     setSessions]     = useState<SessionWithExercise[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [allBadges,    setAllBadges]    = useState<Badge[]>([]);

  // Sync locale from profile
  useEffect(() => {
    if (profile?.locale && profile.locale !== locale) {
      setLocale(profile.locale as Locale);
    }
  }, [profile?.locale]); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    getAllBadges().then(setAllBadges);
  }, []);

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
  const xpPercent  = level === 'Elite'
    ? 100
    : Math.min(100, Math.round(((totalXp - levelStart) / (levelEnd - levelStart)) * 100));

  // ── Avatar com iniciais ─────────────────────────────────────────────────────
  const emailPrefix = (user.email ?? '').split('@')[0];
  const metaName    = (user.user_metadata as Record<string, string | undefined>)?.full_name?.trim();
  const rawName     = profile?.full_name || metaName || emailPrefix;
  const displayName = rawName
    ? rawName.charAt(0).toUpperCase() + rawName.slice(1)
    : 'Usuário';
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

  // ── Badges: separar ganhos vs bloqueados ────────────────────────────────────
  const earnedIds  = new Set(badges.map(b => b.badge_id));
  const earnedFirst = [...allBadges].sort((a, b) => {
    const aEarned = earnedIds.has(a.id) ? 0 : 1;
    const bEarned = earnedIds.has(b.id) ? 0 : 1;
    if (aEarned !== bEarned) return aEarned - bEarned;
    return a.condition_value - b.condition_value;
  });

  // ── Desafio semanal ─────────────────────────────────────────────────────────
  const challengePercent = challenge
    ? Math.min(100, Math.round((progress / challenge.target_value) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">FormFit AI</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/analyze" className="text-gray-400 hover:text-white transition-colors">
            {t('train')}
          </Link>
          <Link href="/settings" title={t('settings_link')} className="text-gray-400 hover:text-white transition-colors">
            ⚙️
          </Link>
          <button
            onClick={signOut}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {t('sign_out')}
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full space-y-4">

        {/* ── Hero: avatar + nome + nível + streak + XP bar ── */}
        <div className="bg-gray-900 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-2xl ${avatarColor} flex items-center justify-center
              text-2xl font-black text-white flex-shrink-0 select-none`}>
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
              <p className="text-xs text-gray-500 mt-1">{t('days_in_a_row')}</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>{totalXp.toLocaleString()} XP</span>
              {nextLevel ? (
                <span>
                  {t('xp_needed', { xp: xpToNext.toLocaleString(), level: nextLevel })}
                </span>
              ) : (
                <span className="text-yellow-400 font-semibold">✦ {t('max_level')}</span>
              )}
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div className={`h-3 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${xpPercent}%` }} />
            </div>
            {nextLevel && (
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>{level}</span><span>{nextLevel}</span>
              </div>
            )}
          </div>

        </div>

        {/* ── Gamificação: XP · streak · melhor streak ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={totalXp.toLocaleString()} label={t('stat_xp_total')}      valueClass="text-indigo-400" />
          <StatCard value={`🔥 ${currentStreak}`}    label={t('stat_streak')}         valueClass="text-orange-400" />
          <StatCard value={String(longestStreak)}     label={t('stat_best_streak')}    valueClass="text-purple-400" />
        </div>

        {/* ── Sessões: total · reps · score · minutos ── */}
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-900 rounded-2xl p-4 h-20 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard value={String(totalSessions)}   label={t('stat_sessions')}    valueClass="text-green-400" />
            <StatCard value={totalReps.toLocaleString()} label={t('stat_total_reps')} valueClass="text-blue-400" />
            <StatCard value={String(bestScore)}        label={t('stat_best_score')}  valueClass="text-yellow-400" />
            <StatCard value={`${totalMinutes} ${t('minutes_unit')}`} label={t('stat_time_trained')} valueClass="text-rose-400" />
          </div>
        )}

        {/* ── Desafio semanal ── */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300">🏆 {t('weekly_challenge')}</h2>
            {challenge && (
              <span className="text-xs text-gray-500">⏱ {timeLeft}</span>
            )}
          </div>

          {chalLoading ? (
            <div className="p-5">
              <div className="h-16 bg-gray-800 rounded-xl animate-pulse" />
            </div>
          ) : !challenge ? (
            <p className="px-5 py-6 text-sm text-gray-500 text-center">
              {t('no_challenge')}
            </p>
          ) : (
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{challenge.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{challenge.description}</p>
                </div>
                <span className="flex-shrink-0 px-2 py-1 rounded-lg bg-indigo-900/50 text-indigo-400 text-xs font-bold">
                  +{challenge.xp_reward} XP
                </span>
              </div>

              {/* Barra de progresso */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className={isCompleted ? 'text-green-400 font-semibold' : 'text-gray-400'}>
                    {isCompleted ? t('completed') : `${progress} / ${challenge.target_value}`}
                  </span>
                  <span className="text-gray-500">{challengePercent}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`}
                    style={{ width: `${challengePercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Badges ── */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300">🏅 {t('achievements')}</h2>
            <span className="text-xs text-gray-500">
              {earnedIds.size} / {allBadges.length}
            </span>
          </div>

          {allBadges.length === 0 ? (
            <div className="p-5">
              <div className="grid grid-cols-4 gap-2">
                {[...Array(8)].map((_, i) => <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />)}
              </div>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-4 gap-2">
              {earnedFirst.map(badge => {
                const isEarned = earnedIds.has(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`rounded-xl p-2 flex flex-col items-center gap-1 text-center
                      ${isEarned
                        ? 'bg-indigo-900/40 border border-indigo-700/40'
                        : 'bg-gray-800/60 border border-gray-700/40 opacity-50'
                      }`}
                  >
                    <span className="text-2xl leading-none mt-1">
                      {isEarned ? badge.icon : '🔒'}
                    </span>
                    <span className={`text-[10px] font-medium leading-tight line-clamp-2
                      ${isEarned ? 'text-gray-200' : 'text-gray-500'}`}>
                      {badge.name}
                    </span>
                    {isEarned ? (
                      <span className="text-[9px] text-indigo-400 font-semibold">
                        +{badge.xp_reward} XP
                      </span>
                    ) : (
                      <span className="text-[9px] text-gray-600 leading-tight line-clamp-2">
                        {formatCondition(badge.condition_type, badge.condition_value, t)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Histórico: últimas 10 sessões ── */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-gray-300">{t('recent_sessions')}</h2>
          </div>

          {statsLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-500 text-sm">
              {t('no_sessions')}
              <br />
              <Link href="/analyze" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
                {t('start_now')}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-800">
              {sessions.slice(0, 10).map(s => <SessionRow key={s.id} session={s} t={t} />)}
            </ul>
          )}
        </div>

        {/* ── CTA ── */}
        <Link
          href="/analyze"
          className="block w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500
            font-bold text-lg text-center transition-all active:scale-95"
        >
          {t('start_workout')}
        </Link>

      </main>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function StatCard({ value, label, valueClass = 'text-white' }: {
  value: string; label: string; valueClass?: string;
}) {
  return (
    <div className="bg-gray-900 rounded-2xl p-4 text-center">
      <p className={`text-2xl font-black ${valueClass}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function SessionRow({ session: s, t }: {
  session: SessionWithExercise;
  t: (key: string) => string;
}) {
  const scoreClass =
    s.avg_score >= 80 ? 'text-green-400' :
    s.avg_score >= 60 ? 'text-yellow-400' :
    'text-red-400';

  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <span className="text-xs text-gray-500 w-12 flex-shrink-0 text-center">
        {formatDate(s.started_at, t)}
      </span>
      <span className="flex-1 text-sm font-medium truncate">
        {s.exercise?.name_pt ?? s.exercise_id}
      </span>
      <span className={`text-sm font-bold w-10 text-right flex-shrink-0 ${scoreClass}`}>
        {Math.round(s.avg_score)}
      </span>
      <span className="text-xs text-gray-400 w-14 text-right flex-shrink-0">
        {s.total_reps} reps
      </span>
      <span className="text-xs text-gray-500 w-12 text-right flex-shrink-0">
        {formatDuration(s.started_at, s.ended_at)}
      </span>
    </li>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string, t: (key: string) => string): string {
  const d    = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return t('today');
  if (diff === 1) return t('yesterday');
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

function formatCondition(
  type: string,
  value: number,
  t: (key: string, values?: Record<string, string | number>) => string
): string {
  if (type === 'sessions')      return t('cond_sessions', { value });
  if (type === 'streak')        return t('cond_streak', { value });
  if (type === 'score')         return t('cond_score', { value });
  if (type === 'score_triple')  return t('cond_score_triple', { value });
  if (type === 'total_reps')    return t('cond_total_reps', { value });
  if (type === 'early_morning') return t('cond_early_morning');
  const exerciseNames: Record<string, string> = {
    exercise_squat:  'Agachamento',
    exercise_pushup: 'Flexão',
    exercise_plank:  'Prancha',
    exercise_lunge:  'Afundo',
  };
  if (type in exerciseNames) return t('cond_exercise_times', { value, name: exerciseNames[type] });
  return `${value}`;
}
