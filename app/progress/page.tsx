'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useSession } from '@/hooks/useSession';
import { useGamification } from '@/hooks/useGamification';
import { useWeeklyChallenge } from '@/hooks/useWeeklyChallenge';
import { getRecentSessionsWithExercise } from '@/lib/supabase/queries';
import type { SessionWithExercise } from '@/lib/supabase/queries';
import type { GamificationLevel } from '@/types/gamification';

// ── Constantes ────────────────────────────────────────────────────────────────

const ACCENT = '#C8F135';

const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const LEVEL_STARTS: Record<GamificationLevel, number> = {
  'Iniciante': 0, 'Intermediário': 500, 'Avançado': 1500, 'Elite': 3000,
};
const LEVEL_ENDS: Record<GamificationLevel, number> = {
  'Iniciante': 500, 'Intermediário': 1500, 'Avançado': 3000, 'Elite': 3000,
};
const LEVEL_COLORS: Record<GamificationLevel, string> = {
  'Iniciante': 'bg-gray-400', 'Intermediário': 'bg-blue-500',
  'Avançado': 'bg-purple-500', 'Elite': 'bg-yellow-400',
};
const LEVEL_TEXT: Record<GamificationLevel, string> = {
  'Iniciante': 'text-gray-400', 'Intermediário': 'text-blue-400',
  'Avançado': 'text-purple-400', 'Elite': 'text-yellow-400',
};
const LEVEL_KEY: Record<GamificationLevel, 'beginner' | 'intermediate' | 'advanced' | 'elite'> = {
  'Iniciante': 'beginner', 'Intermediário': 'intermediate',
  'Avançado': 'advanced', 'Elite': 'elite',
};

// ── Componente ────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const t   = useTranslations('progress');
  const tL  = useTranslations('levels');
  const tEx = useTranslations('exercises');
  const router = useRouter();

  const { user, loading: sessionLoading } = useSession();
  const {
    totalXp, level, nextLevel, xpToNext, streak, badges, loading: gamLoading,
  } = useGamification();
  const { challenge, progress: chalProgress, timeLeft, isCompleted } = useWeeklyChallenge();

  const [sessions,   setSessions]   = useState<SessionWithExercise[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [filter,     setFilter]     = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!sessionLoading && !user) router.push('/login');
  }, [sessionLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    getRecentSessionsWithExercise(user.id, 50).then(data => {
      setSessions(data);
      setDataLoading(false);
    });
  }, [user]);

  // ── Mapa de calor semanal ─────────────────────────────────────────────────

  const last7 = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return { dateStr: d.toISOString().slice(0, 10), day: DAY_SHORT[d.getDay()] };
  }), []);

  const trainedDays = useMemo(
    () => new Set(sessions.map(s => s.started_at.slice(0, 10))),
    [sessions],
  );

  const weekSessions = useMemo(
    () => last7.filter(d => trainedDays.has(d.dateStr)).length,
    [last7, trainedDays],
  );

  // ── Dados do gráfico ──────────────────────────────────────────────────────

  const exerciseOptions = useMemo(() => {
    const seen = new Map<string, string>();
    sessions.forEach(s => {
      if (s.exercise?.slug) seen.set(s.exercise.slug, s.exercise.slug);
    });
    return Array.from(seen.keys());
  }, [sessions]);

  const chartData = useMemo(() => (
    sessions
      .filter(s => !filter || s.exercise?.slug === filter)
      .slice(0, 14)
      .reverse()
      .map(s => ({
        date:  new Date(s.started_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        score: Math.round(s.avg_score * 10) / 10,
        name:  s.exercise?.name_pt ?? s.exercise_id,
      }))
  ), [sessions, filter]);

  // ── Estatísticas gerais ───────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const totalReps     = sessions.reduce((s, r) => s + (r.total_reps ?? 0), 0);
    const bestScore     = sessions.length > 0
      ? Math.round(Math.max(...sessions.map(s => s.avg_score ?? 0)) * 10) / 10
      : 0;
    const totalMinutes  = Math.floor(sessions.reduce((sum, s) => {
      if (!s.ended_at) return sum;
      return sum + (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000;
    }, 0));

    // Exercício favorito
    const counts: Record<string, { slug: string; count: number }> = {};
    sessions.forEach(s => {
      const slug = s.exercise?.slug ?? s.exercise_id;
      if (!counts[slug]) counts[slug] = { slug, count: 0 };
      counts[slug].count++;
    });
    const favSlug = Object.values(counts).sort((a, b) => b.count - a.count)[0]?.slug ?? '';

    return { totalSessions, totalReps, bestScore, totalMinutes, favSlug };
  }, [sessions]);

  // ── XP / nível ────────────────────────────────────────────────────────────

  const levelStart  = LEVEL_STARTS[level] ?? 0;
  const levelEnd    = LEVEL_ENDS[level]   ?? 500;
  const xpPercent   = level === 'Elite'
    ? 100
    : Math.min(100, Math.round(((totalXp - levelStart) / (levelEnd - levelStart)) * 100));

  // ── Badges recentes ───────────────────────────────────────────────────────

  const recentBadges = useMemo(
    () => [...badges]
      .sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
      .slice(0, 3),
    [badges],
  );

  // ── Challenge % ───────────────────────────────────────────────────────────

  const chalPct = challenge
    ? Math.min(100, Math.round((chalProgress / challenge.target_value) * 100))
    : 0;

  if (sessionLoading || gamLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col pb-24">
      <header className="px-6 py-4 border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-tight">{t('title')}</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">

        {/* ── SEÇÃO 1: Mapa de calor semanal ─────────────────────────────── */}
        <Section title={`🗓 ${t('heatmap_title')}`}>
          <div className="flex items-end gap-2">
            {last7.map(({ dateStr, day }) => {
              const trained = trainedDays.has(dateStr);
              const isToday = dateStr === new Date().toISOString().slice(0, 10);
              return (
                <div key={dateStr} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-lg transition-colors ${
                      trained ? 'bg-[#C8F135]/80' : 'bg-gray-800'
                    } ${isToday ? 'ring-2 ring-[#C8F135]/50' : ''}`}
                    style={{ height: trained ? '48px' : '32px' }}
                  />
                  <span className="text-[10px] text-gray-500">{day}</span>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-gray-400 mt-2">
            <span className="font-bold text-white">{weekSessions}</span>{' '}
            {t('week_sessions')}
          </p>
        </Section>

        {/* ── SEÇÃO 2: Gráfico de evolução ───────────────────────────────── */}
        <Section title={`📈 ${t('chart_title')}`}>
          {/* Filtro de exercício */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
            <FilterChip active={!filter} label={t('filter_all')} onClick={() => setFilter('')} />
            {exerciseOptions.map(slug => (
              <FilterChip
                key={slug}
                active={filter === slug}
                label={tEx(slug as Parameters<typeof tEx>[0])}
                onClick={() => setFilter(filter === slug ? '' : slug)}
              />
            ))}
          </div>

          {dataLoading ? (
            <div className="h-48 bg-gray-800 rounded-xl animate-pulse" />
          ) : chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
              {t('no_data')}
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#111827',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f9fafb',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: ACCENT }}
                    labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                    cursor={{ stroke: '#374151' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={ACCENT}
                    strokeWidth={2}
                    dot={{ fill: ACCENT, r: 3, strokeWidth: 0 }}
                    activeDot={{ fill: ACCENT, r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>

        {/* ── SEÇÃO 3: Gamificação ────────────────────────────────────────── */}
        <Section title={`🏆 ${t('gamification_title')}`}>

          {/* XP + nível */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold uppercase tracking-wide ${LEVEL_TEXT[level]}`}>
                {tL(LEVEL_KEY[level])}
              </span>
              <span className="text-sm text-gray-400">{totalXp.toLocaleString()} XP</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${LEVEL_COLORS[level]}`}
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            {nextLevel && (
              <p className="text-xs text-gray-500 text-right">
                {xpToNext.toLocaleString()} XP → {tL(LEVEL_KEY[nextLevel])}
              </p>
            )}
          </div>

          {/* Streak */}
          <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3 mt-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="font-bold text-white text-lg leading-none">
                {streak?.current_streak ?? 0}
              </p>
              <p className="text-xs text-gray-400">{t('streak_label')}</p>
            </div>
          </div>

          {/* Desafio semanal */}
          {challenge && (
            <div className="bg-gray-800 rounded-xl px-4 py-3 mt-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{challenge.title}</p>
                  <p className="text-xs text-gray-400">{challenge.description}</p>
                </div>
                <span className="flex-shrink-0 text-xs bg-indigo-900/60 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                  +{challenge.xp_reward} XP
                </span>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className={isCompleted ? 'text-green-400 font-semibold' : 'text-gray-400'}>
                    {isCompleted ? '✓ Concluído!' : `${chalProgress} / ${challenge.target_value}`}
                  </span>
                  <span className="text-gray-500">{timeLeft}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`}
                    style={{ width: `${chalPct}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Últimas 3 badges */}
          {recentBadges.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{t('recent_badges')}</p>
              {recentBadges.map(ub => (
                <div key={ub.badge_id} className="flex items-center gap-3 bg-gray-800/60 rounded-xl px-3 py-2.5">
                  <span className="text-2xl flex-shrink-0">{ub.badge.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{ub.badge.name}</p>
                    <p className="text-xs text-gray-400 truncate">{ub.badge.description}</p>
                  </div>
                  <span className="text-xs text-indigo-400 font-bold flex-shrink-0">
                    +{ub.badge.xp_reward} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── SEÇÃO 4: Estatísticas gerais ───────────────────────────────── */}
        <Section title={`📊 ${t('stats_title')}`}>
          {dataLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <StatCard value={String(stats.totalSessions)} label={t('stat_sessions')}  color="text-green-400" />
                <StatCard value={stats.totalReps.toLocaleString()} label={t('stat_reps')} color="text-blue-400" />
                <StatCard value={String(stats.bestScore)}      label={t('stat_best_score')} color="text-yellow-400" />
                <StatCard value={`${stats.totalMinutes}min`}   label={t('stat_time')}     color="text-rose-400" />
              </div>

              {/* Exercício favorito */}
              {stats.favSlug && (
                <div className="mt-3 bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">{t('stat_fav')}</p>
                    <p className="font-bold text-white">
                      {tEx(stats.favSlug as Parameters<typeof tEx>[0])}
                    </p>
                  </div>
                  <span className="text-3xl">🏅</span>
                </div>
              )}

              {/* Melhor sequência */}
              <div className="mt-3 bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">{t('stat_best_streak')}</p>
                  <p className="font-bold text-white text-xl">
                    🔥 {streak?.longest_streak ?? 0} {t('stat_streak_days')}
                  </p>
                </div>
              </div>
            </>
          )}
        </Section>

      </main>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-4">
      <h2 className="text-sm font-semibold text-gray-300 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
        ${active ? 'text-gray-900' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
      style={active ? { background: '#C8F135', color: '#111827' } : undefined}
    >
      {label}
    </button>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3 text-center">
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
