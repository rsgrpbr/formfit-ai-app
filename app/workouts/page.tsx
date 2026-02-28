'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getWorkoutTemplates, type WorkoutTemplate } from '@/lib/supabase/queries';
import { Clock, MapPin, Layers } from 'lucide-react';

const OBJECTIVES = ['emagrecer', 'ganhar_massa', 'definir', 'condicionamento'] as const;
const LEVELS     = ['iniciante', 'intermediario', 'avancado'] as const;
const LOCATIONS  = ['casa', 'academia'] as const;

const OBJECTIVE_COLORS: Record<string, string> = {
  emagrecer:        'bg-orange-500/20 text-orange-400',
  ganhar_massa:     'bg-indigo-500/20 text-indigo-400',
  definir:          'bg-emerald-500/20 text-emerald-400',
  condicionamento:  'bg-yellow-500/20 text-yellow-400',
};

const LEVEL_COLORS: Record<string, string> = {
  iniciante:     'bg-green-500/20 text-green-400',
  intermediario: 'bg-yellow-500/20 text-yellow-400',
  avancado:      'bg-red-500/20 text-red-400',
};

export default function WorkoutsPage() {
  const t = useTranslations('workouts');

  const [workouts, setWorkouts]   = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading]     = useState(true);
  const [objective, setObjective] = useState('');
  const [level, setLevel]         = useState('');
  const [location, setLocation]   = useState('');

  useEffect(() => {
    getWorkoutTemplates().then(data => { setWorkouts(data); setLoading(false); });
  }, []);

  const filtered = workouts.filter(w => {
    if (objective && w.objective !== objective) return false;
    if (level     && w.level     !== level)     return false;
    if (location  && w.location  !== location)  return false;
    return true;
  });

  const levelLocationAllActive = !level && !location;

  return (
    <div className="min-h-screen text-white flex flex-col pb-24" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold tracking-tight">{t('title')}</h1>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b py-3 space-y-2" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-2xl mx-auto px-4 space-y-2">
          {/* Linha 1 — Objetivo */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
            <FilterChip
              active={!objective}
              label={t('filter_all')}
              onClick={() => setObjective('')}
            />
            {OBJECTIVES.map(o => (
              <FilterChip
                key={o}
                active={objective === o}
                label={t(`obj_${o}` as Parameters<typeof t>[0])}
                onClick={() => setObjective(objective === o ? '' : o)}
              />
            ))}
          </div>

          {/* Linha 2 — Nível + Local */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
            <FilterChip
              active={levelLocationAllActive}
              label={t('filter_all')}
              onClick={() => { setLevel(''); setLocation(''); }}
            />
            {LEVELS.map(l => (
              <FilterChip
                key={l}
                active={level === l}
                label={t(`level_${l}` as Parameters<typeof t>[0])}
                onClick={() => { setLevel(level === l ? '' : l); setLocation(''); }}
              />
            ))}
            <span className="w-px self-stretch mx-1" style={{ background: 'var(--border)' }} />
            {LOCATIONS.map(loc => (
              <FilterChip
                key={loc}
                active={location === loc}
                label={t(`loc_${loc}` as Parameters<typeof t>[0])}
                onClick={() => { setLocation(location === loc ? '' : loc); setLevel(''); }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 py-4 px-4">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>
              Nenhum treino encontrado.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(w => (
                <WorkoutCard key={w.id} workout={w} t={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active, label, onClick,
}: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95"
      style={
        active
          ? { background: 'var(--accent)', color: 'var(--bg)' }
          : { background: 'var(--surface2)', color: 'var(--text-muted)' }
      }
    >
      {label}
    </button>
  );
}

function WorkoutCard({
  workout: w,
  t,
}: {
  workout: WorkoutTemplate;
  t: ReturnType<typeof useTranslations<'workouts'>>;
}) {
  return (
    <Link
      href={`/workouts/${w.id}`}
      className="rounded-2xl p-4 flex flex-col gap-3 transition-colors active:scale-[0.98]"
      style={{ background: 'var(--surface)' }}
    >
      {/* Objective badge */}
      <span className={`self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${OBJECTIVE_COLORS[w.objective] ?? 'bg-gray-700 text-gray-300'}`}>
        {t(`obj_${w.objective}` as Parameters<typeof t>[0])}
      </span>

      {/* Name */}
      <p className="font-bold text-white leading-tight text-sm">{w.name_pt}</p>

      {/* Meta */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Clock size={11} />
          <span>{t('minutes', { min: w.duration_minutes })}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <MapPin size={11} />
          <span>{t(`loc_${w.location}` as Parameters<typeof t>[0])}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Layers size={11} />
          <span>{t('exercises_count', { count: w.exercises.length })}</span>
        </div>
      </div>

      {/* Level */}
      <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[w.level] ?? 'bg-gray-700 text-gray-300'}`}>
        {t(`level_${w.level}` as Parameters<typeof t>[0])}
      </span>
    </Link>
  );
}
