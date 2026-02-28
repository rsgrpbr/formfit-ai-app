'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getWorkoutTemplate, type WorkoutTemplate } from '@/lib/supabase/queries';
import { Clock, Layers, Repeat2, MapPin, Dumbbell, Camera } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-400">
            <MapPin size={10} />
            {t(`loc_${workout.location}` as Parameters<typeof t>[0])}
          </span>
        </div>

        <h1 className="text-2xl font-black mb-2">{workout.name_pt}</h1>

        {workout.description_pt && (
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">{workout.description_pt}</p>
        )}

        {/* Stats row */}
        <div className="flex gap-4">
          <StatBadge Icon={Clock}   value={t('minutes', { min: workout.duration_minutes })} />
          <StatBadge Icon={Layers}  value={t('exercises_count', { count: workout.exercises.length })} />
          <StatBadge Icon={Repeat2} value={`${totalSets} séries`} />
        </div>
      </div>

      {/* Exercise list */}
      <div className="px-4 py-4 flex flex-col gap-3">
        {workout.exercises.map((ex, idx) => (
          <div key={idx} className="bg-gray-900 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                <Dumbbell size={18} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="font-semibold text-white truncate">{tEx(ex.slug as Parameters<typeof tEx>[0])}</p>
                <p className="text-xs text-gray-400">
                  {ex.sets}×{ex.reps} · {ex.rest_seconds}s descanso
                </p>
              </div>
            </div>
            <Link
              href={`/analyze?exercise=${ex.slug}`}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}
            >
              <Camera size={12} />
              {t('analyze_form').replace('📷 ', '')}
            </Link>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gray-950 border-t border-gray-800">
        <Link
          href={`/workouts/${workout.id}/session`}
          className="font-display btn-primary"
        >
          {t('start_guided').toUpperCase()}
        </Link>
      </div>
    </div>
  );
}

function StatBadge({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-300">
      <Icon size={14} style={{ color: 'var(--text-muted)' }} />
      <span>{value}</span>
    </div>
  );
}
