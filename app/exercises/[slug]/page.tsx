'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bebas_Neue } from 'next/font/google';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip,
} from 'recharts';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from '@/hooks/useSession';
import {
  getExerciseBySlug,
  getUserFavorites,
  toggleFavorite,
  getUserExerciseSessions,
} from '@/lib/supabase/queries';
import type { Exercise, Session } from '@/lib/supabase/queries';

// ── Font ──────────────────────────────────────────────────────────────────────

const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'] });

// ── Static maps ───────────────────────────────────────────────────────────────

const EXERCISE_EMOJI: Record<string, string> = {
  squat: '🦵', pushup: '💪', plank: '🏋️', lunge: '🚶',
  glute_bridge: '🍑', side_plank: '⬛', superman: '🦸',
  mountain_climber: '🏔️', burpee: '💥',
};

const CATEGORY_LABEL: Record<string, string> = {
  lower: '🦵 Inferior', upper: '💪 Superior', core: '🎯 Core', cardio: '🏃 Cardio',
};

const DIFF_STYLE: Record<string, string> = {
  beginner:     'bg-green-900/50  text-green-400',
  intermediate: 'bg-yellow-900/50 text-yellow-400',
  advanced:     'bg-red-900/50    text-red-400',
};

const ACCENT = '#C8F135';

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExerciseDetailPage() {
  const t      = useTranslations('exercises_catalog');
  const tDiff  = useTranslations('levels');
  const locale = useLocale();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const { user } = useSession();

  const [exercise,  setExercise]  = useState<Exercise | null>(null);
  const [sessions,  setSessions]  = useState<Session[]>([]);
  const [isFav,     setIsFav]     = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [loading,   setLoading]   = useState(true);

  // Load exercise
  useEffect(() => {
    if (!slug) return;
    getExerciseBySlug(slug).then(ex => {
      if (!ex) { router.replace('/exercises'); return; }
      setExercise(ex);
      setLoading(false);
    });
  }, [slug, router]);

  // Load user data
  useEffect(() => {
    if (!user || !exercise) return;
    getUserFavorites(user.id).then(ids => setIsFav(ids.includes(exercise.id)));
    getUserExerciseSessions(user.id, exercise.id, 14).then(setSessions);
  }, [user, exercise]);

  const handleToggleFav = async () => {
    if (!user || !exercise || favLoading) return;
    setFavLoading(true);
    const prev = isFav;
    setIsFav(!prev);
    await toggleFavorite(user.id, exercise.id, prev);
    setFavLoading(false);
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const getName = (ex: Exercise) => {
    if (locale === 'en') return ex.name_en;
    if (locale === 'es') return ex.name_es ?? ex.name_pt;
    if (locale === 'fr') return ex.name_fr ?? ex.name_pt;
    return ex.name_pt;
  };

  const instructions = useMemo(() => {
    const raw = locale === 'en' ? exercise?.instructions_en : exercise?.instructions_pt;
    return raw ? raw.split('\n').filter(Boolean) : [];
  }, [exercise, locale]);

  const tips = useMemo(() => {
    const raw = locale === 'en' ? exercise?.tips_en : exercise?.tips_pt;
    return raw ? raw.split('\n').filter(Boolean) : [];
  }, [exercise, locale]);

  const chartData = useMemo(() =>
    [...sessions].reverse().map(s => ({
      date:  new Date(s.started_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      score: Math.round((s.avg_score ?? 0) * 10) / 10,
    })),
    [sessions],
  );

  const lastScore = sessions[0]?.avg_score ? Math.round(sessions[0].avg_score * 10) / 10 : null;
  const bestScore = sessions.length > 0
    ? Math.round(Math.max(...sessions.map(s => s.avg_score ?? 0)) * 10) / 10
    : null;

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading || !exercise) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col pb-48">

      {/* Back nav */}
      <div className="px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-white"
        >
          {t('back')}
        </button>
      </div>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-6">
        <div className="text-6xl mb-3">{EXERCISE_EMOJI[exercise.slug] ?? '🏃'}</div>
        <h1 className={`${bebas.className} text-[52px] leading-none tracking-wide mb-3`}>
          {getName(exercise)}
        </h1>
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DIFF_STYLE[exercise.difficulty] ?? 'bg-gray-700 text-gray-400'}`}>
            {tDiff(exercise.difficulty as 'beginner' | 'intermediate' | 'advanced' | 'elite')}
          </span>
          {CATEGORY_LABEL[exercise.category] && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-900/50 text-indigo-400">
              {CATEGORY_LABEL[exercise.category]}
            </span>
          )}
          {exercise.equipment?.map(eq => (
            <span key={eq} className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-400">
              {eq}
            </span>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* ── Como fazer ────────────────────────────────────────────────── */}
        {instructions.length > 0 && (
          <Section title={`📋 ${t('how_to')}`}>
            <ol className="space-y-3">
              {instructions.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-gray-900"
                    style={{ background: ACCENT }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-300 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* ── Músculos ──────────────────────────────────────────────────── */}
        {(exercise.muscles_primary?.length || exercise.muscles_secondary?.length) ? (
          <Section title={`💪 ${t('muscles_section')}`}>
            {exercise.muscles_primary?.length ? (
              <div className="mb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{t('muscles_primary')}</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.muscles_primary.map(m => (
                    <span
                      key={m}
                      className="text-xs font-semibold px-3 py-1 rounded-full text-gray-900"
                      style={{ background: ACCENT }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {exercise.muscles_secondary?.length ? (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{t('muscles_secondary')}</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.muscles_secondary.map(m => (
                    <span key={m} className="text-xs px-3 py-1 rounded-full bg-gray-800 text-gray-400">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </Section>
        ) : null}

        {/* ── Dicas ─────────────────────────────────────────────────────── */}
        {tips.length > 0 && (
          <Section title={`💡 ${t('tips_section')}`}>
            <ul className="space-y-2.5">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-300">
                  <span className="text-[#C8F135] flex-shrink-0 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ── Meu histórico ─────────────────────────────────────────────── */}
        {user && (
          <Section title={`📊 ${t('history_section')}`}>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">{t('no_history')}</p>
            ) : (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <StatPill
                    value={lastScore !== null ? String(lastScore) : '—'}
                    label={t('last_score')}
                    color="text-indigo-400"
                  />
                  <StatPill
                    value={bestScore !== null ? String(bestScore) : '—'}
                    label={t('best_score')}
                    color="text-yellow-400"
                  />
                  <StatPill
                    value={String(sessions.length)}
                    label={t('sessions_count')}
                    color="text-green-400"
                  />
                </div>

                {/* Mini chart */}
                {chartData.length >= 2 && (
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: '#6b7280', fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: '#6b7280', fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                          width={24}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#111827', border: '1px solid #374151',
                            borderRadius: '8px', color: '#f9fafb', fontSize: '11px',
                          }}
                          itemStyle={{ color: ACCENT }}
                          labelStyle={{ color: '#9ca3af', marginBottom: '2px' }}
                          cursor={{ stroke: '#374151' }}
                        />
                        <Line
                          type="monotone" dataKey="score" stroke={ACCENT}
                          strokeWidth={2}
                          dot={{ fill: ACCENT, r: 3, strokeWidth: 0 }}
                          activeDot={{ fill: ACCENT, r: 5, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </Section>
        )}

      </div>

      {/* ── Fixed footer CTA ──────────────────────────────────────────────────── */}
      <div className="fixed bottom-16 left-0 right-0 z-40 px-4 py-3 bg-gray-950/95 backdrop-blur-md border-t border-gray-800">
        <Link
          href={`/analyze?exercise=${exercise.slug}`}
          className="block w-full text-center font-black text-[15px] tracking-wide text-gray-900 py-4 rounded-2xl mb-2"
          style={{ background: ACCENT }}
        >
          📷 {t('analyze_cta')}
        </Link>
        {user && (
          <button
            onClick={handleToggleFav}
            disabled={favLoading}
            className={`w-full text-center font-semibold text-sm py-2.5 rounded-2xl transition-colors
              ${isFav
                ? 'bg-rose-900/40 text-rose-400 border border-rose-800'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            {isFav ? `❤️ ${t('unfavorite_btn')}` : `♡ ${t('favorite_btn')}`}
          </button>
        )}
      </div>

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-4">
      <h2 className="text-sm font-semibold text-gray-300 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function StatPill({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3 text-center">
      <p className={`text-xl font-black ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}
