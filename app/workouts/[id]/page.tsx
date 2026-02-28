'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getWorkoutTemplate, type WorkoutTemplate } from '@/lib/supabase/queries';

const EXERCISE_ICONS: Record<string, string> = {
  squat: '🦵', pushup: '💪', plank: '🏋️', lunge: '🚶',
  glute_bridge: '🍑', side_plank: '⬛', superman: '🦸',
  mountain_climber: '🏔️', burpee: '💥',
};

const OBJECTIVE_COLORS: Record<string, string> = {
  emagrecer:       'bg-orange-500/20 text-orange-400',
  ganhar_massa:    'bg-indigo-500/20 text-indigo-400',
  definir:         'bg-emerald-500/20 text-emerald-400',
  condicionamento: 'bg-yellow-500/20 text-yellow-400',
};

const LEVEL_COLORS: Record<string, string> = {
  iniciante:     'bg-green-500/20 text-green-400',
  intermediario: 'bg-yellow-500/20 text-yellow-400',
  avancado:      'bg-red-500/20 text-red-400',
};

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t   = useTranslations('workouts');
  const tEx = useTranslations('exercises');

  const [workout, setWorkout] = useState<WorkoutTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkoutTemplate(id).then(data => { setWorkout(data); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Treino não encontrado.</p>
        <Link href="/workouts" className="text-indigo-400 hover:text-indigo-300">{t('back')}</Link>
      </div>
    );
  }

  const totalSets = workout.exercises.reduce((acc, e) => acc + e.sets, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col pb-32">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
        <Link href="/workouts" className="text-gray-400 hover:text-white transition-colors text-sm">
          {t('back')}
        </Link>
      </header>

      {/* Hero */}
      <div className="px-6 py-6 border-b border-gray-800">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${OBJECTIVE_COLORS[workout.objective] ?? 'bg-gray-700 text-gray-300'}`}>
            {t(`obj_${workout.objective}` as Parameters<typeof t>[0])}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${LEVEL_COLORS[workout.level] ?? 'bg-gray-700 text-gray-300'}`}>
            {t(`level_${workout.level}` as Parameters<typeof t>[0])}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-400">
            {workout.location === 'casa' ? '🏠' : '🏋️'} {t(`loc_${workout.location}` as Parameters<typeof t>[0])}
          </span>
        </div>

        <h1 className="text-2xl font-black mb-2">{workout.name_pt}</h1>

        {workout.description_pt && (
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">{workout.description_pt}</p>
        )}

        {/* Stats row */}
        <div className="flex gap-4">
          <StatBadge icon="⏱" value={t('minutes', { min: workout.duration_minutes })} />
          <StatBadge icon="🏃" value={t('exercises_count', { count: workout.exercises.length })} />
          <StatBadge icon="🔁" value={`${totalSets} séries`} />
        </div>
      </div>

      {/* Exercise list */}
      <div className="px-4 py-4 flex flex-col gap-3">
        {workout.exercises.map((ex, idx) => (
          <div key={idx} className="bg-gray-900 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-2xl flex-shrink-0">{EXERCISE_ICONS[ex.slug] ?? '💪'}</span>
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="font-semibold text-white truncate">{tEx(ex.slug as Parameters<typeof tEx>[0])}</p>
                <p className="text-xs text-gray-400">
                  {ex.sets}×{ex.reps} · {ex.rest_seconds}s descanso
                </p>
              </div>
            </div>
            <Link
              href={`/analyze?exercise=${ex.slug}`}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-all active:scale-95"
            >
              {t('analyze_form')}
            </Link>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gray-950 border-t border-gray-800">
        <Link
          href={`/workouts/${workout.id}/session`}
          className="block w-full py-4 text-center rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg transition-all active:scale-95"
        >
          ▶ {t('start_guided')}
        </Link>
      </div>
    </div>
  );
}

function StatBadge({ icon, value }: { icon: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-300">
      <span>{icon}</span>
      <span>{value}</span>
    </div>
  );
}
