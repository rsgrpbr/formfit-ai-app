'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from '@/hooks/useSession';
import {
  getExercises,
  getUserFavorites,
  toggleFavorite,
} from '@/lib/supabase/queries';
import type { Exercise } from '@/lib/supabase/queries';

// ── Static maps ───────────────────────────────────────────────────────────────

const EXERCISE_EMOJI: Record<string, string> = {
  squat: '🦵', pushup: '💪', plank: '🏋️', lunge: '🚶',
  glute_bridge: '🍑', side_plank: '⬛', superman: '🦸',
  mountain_climber: '🏔️', burpee: '💥',
};

const DIFF_STYLE: Record<string, string> = {
  beginner:     'bg-green-900/50  text-green-400',
  intermediate: 'bg-yellow-900/50 text-yellow-400',
  advanced:     'bg-red-900/50    text-red-400',
};

type Tab = 'muscle' | 'objective' | 'favorites';

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExercisesPage() {
  const t      = useTranslations('exercises_catalog');
  const tDiff  = useTranslations('levels');
  const locale = useLocale();
  const { user } = useSession();

  const MUSCLE_GROUPS = [
    { key: 'pernas',   icon: '🦵', label: t('group_legs'),
      keywords: ['quadriceps', 'hamstrings', 'calves', 'Quadríceps', 'Isquiotibiais', 'Panturrilhas'] },
    { key: 'peito',    icon: '💪', label: t('group_chest'),
      keywords: ['chest', 'triceps', 'pectoral', 'Peitoral', 'Tríceps'] },
    { key: 'costas',   icon: '🔙', label: t('group_back'),
      keywords: ['lower_back', 'back', 'Lombar', 'Rombóides', 'Dorsal'] },
    { key: 'core',     icon: '🎯', label: t('group_core'),
      keywords: ['core', 'obliques', 'Core', 'Abdômen', 'Oblíquos', 'full_body'] },
    { key: 'ombros',   icon: '🏋️', label: t('group_shoulders'),
      keywords: ['shoulders', 'Deltóide', 'Ombros'] },
    { key: 'gluteos',  icon: '🍑', label: t('group_glutes'),
      keywords: ['glutes', 'Glúteos'] },
  ];

  const OBJ_GROUPS = [
    { key: 'forca',  icon: '🏋️', label: t('obj_strength'), categories: ['lower', 'upper'] },
    { key: 'cardio', icon: '🏃', label: t('obj_cardio'),   categories: ['cardio'] },
    { key: 'core',   icon: '🎯', label: t('obj_core'),     categories: ['core'] },
  ];

  const DIFF_LABEL: Record<string, string> = {
    beginner: tDiff('beginner'), intermediate: tDiff('intermediate'), advanced: tDiff('advanced'),
  };

  const [exercises,     setExercises]     = useState<Exercise[]>([]);
  const [favorites,     setFavorites]     = useState<Set<string>>(new Set());
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState<Tab>('muscle');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [search,        setSearch]        = useState('');

  useEffect(() => {
    getExercises().then(exs => { setExercises(exs); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!user) return;
    getUserFavorites(user.id).then(ids => setFavorites(new Set(ids)));
  }, [user]);

  const getName = (ex: Exercise) => {
    if (locale === 'en') return ex.name_en;
    if (locale === 'es') return ex.name_es ?? ex.name_pt;
    if (locale === 'fr') return ex.name_fr ?? ex.name_pt;
    return ex.name_pt;
  };

  const filteredAll = useMemo(() => {
    if (!search) return exercises;
    const q = search.toLowerCase();
    return exercises.filter(ex =>
      ex.name_pt.toLowerCase().includes(q) || ex.name_en.toLowerCase().includes(q)
    );
  }, [exercises, search]);

  const exercisesForMuscle = (groupKey: string) => {
    const group = MUSCLE_GROUPS.find(g => g.key === groupKey);
    if (!group) return filteredAll;
    return filteredAll.filter(ex => {
      const allMuscles = [
        ...(ex.muscles ?? []),
        ...(ex.muscles_primary ?? []),
        ...(ex.muscles_secondary ?? []),
      ];
      return group.keywords.some(kw =>
        allMuscles.some(m => m.toLowerCase().includes(kw.toLowerCase()))
      );
    });
  };

  const exercisesForObjective = (objKey: string) => {
    const group = OBJ_GROUPS.find(g => g.key === objKey);
    if (!group) return filteredAll;
    return filteredAll.filter(ex => group.categories.includes(ex.category));
  };

  const favoriteList = filteredAll.filter(ex => favorites.has(ex.id));

  const handleToggleFav = async (e: React.MouseEvent, ex: Exercise) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    const isFav = favorites.has(ex.id);
    setFavorites(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(ex.id); else next.add(ex.id);
      return next;
    });
    await toggleFavorite(user.id, ex.id, isFav);
  };

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    setSelectedGroup(null);
  };

  // ── List view (shared for muscle + objective) ─────────────────────────────

  const ExerciseList = ({ exs }: { exs: Exercise[] }) => (
    exs.length === 0 ? (
      <p className="text-center text-gray-500 py-12 text-sm">{t('no_results')}</p>
    ) : (
      <div className="space-y-3">
        {exs.map(ex => (
          <Link key={ex.id} href={`/exercises/${ex.slug}`}>
            <div className="bg-gray-900 rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-800 active:scale-[0.98] transition-all">
              <span className="text-4xl flex-shrink-0 w-12 text-center">
                {EXERCISE_EMOJI[ex.slug] ?? '🏃'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{getName(ex)}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${DIFF_STYLE[ex.difficulty] ?? 'bg-gray-700 text-gray-400'}`}>
                    {DIFF_LABEL[ex.difficulty] ?? ex.difficulty}
                  </span>
                  {ex.muscles_primary?.slice(0, 2).map(m => (
                    <span key={m} className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">{m}</span>
                  ))}
                </div>
              </div>
              <button
                onClick={e => handleToggleFav(e, ex)}
                className={`flex-shrink-0 text-xl w-9 h-9 flex items-center justify-center rounded-full transition-colors
                  ${favorites.has(ex.id) ? 'text-rose-400' : 'text-gray-600 hover:text-gray-400'}`}
                aria-label={favorites.has(ex.id) ? 'Remover favorito' : 'Adicionar favorito'}
              >
                {favorites.has(ex.id) ? '❤️' : '♡'}
              </button>
            </div>
          </Link>
        ))}
      </div>
    )
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col pb-24">

      {/* Header + search */}
      <header className="px-4 pt-5 pb-3 border-b border-gray-800">
        <h1 className="text-xl font-bold mb-3">{t('title')}</h1>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full bg-gray-800 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none
              focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-500"
          />
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex border-b border-gray-800 bg-gray-950">
        {(['muscle', 'objective', 'favorites'] as Tab[]).map(tabKey => (
          <button
            key={tabKey}
            onClick={() => handleTabChange(tabKey)}
            className={`flex-1 py-3 text-xs font-semibold transition-colors border-b-2 -mb-px
              ${tab === tabKey
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            {tabKey === 'muscle' ? t('tab_muscle') : tabKey === 'objective' ? t('tab_objective') : t('tab_favorites')}
          </button>
        ))}
      </div>

      <main className="flex-1 px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : tab === 'muscle' ? (
          selectedGroup ? (
            <>
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1"
              >
                {t('back')}
              </button>
              <ExerciseList exs={exercisesForMuscle(selectedGroup)} />
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {MUSCLE_GROUPS.map(group => {
                const count = exercisesForMuscle(group.key).length;
                return (
                  <button
                    key={group.key}
                    onClick={() => setSelectedGroup(group.key)}
                    className="bg-gray-900 rounded-2xl p-4 flex flex-col items-center gap-2
                      hover:bg-gray-800 active:scale-95 transition-all text-center"
                  >
                    <span className="text-4xl">{group.icon}</span>
                    <span className="font-semibold text-sm leading-tight">{group.label}</span>
                    <span className="text-xs text-gray-500">{count} exerc.</span>
                  </button>
                );
              })}
            </div>
          )
        ) : tab === 'objective' ? (
          selectedGroup ? (
            <>
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1"
              >
                {t('back')}
              </button>
              <ExerciseList exs={exercisesForObjective(selectedGroup)} />
            </>
          ) : (
            <div className="space-y-3">
              {OBJ_GROUPS.map(group => {
                const count = exercisesForObjective(group.key).length;
                return (
                  <button
                    key={group.key}
                    onClick={() => setSelectedGroup(group.key)}
                    className="w-full bg-gray-900 rounded-2xl p-5 flex items-center gap-4
                      hover:bg-gray-800 active:scale-[0.98] transition-all"
                  >
                    <span className="text-5xl">{group.icon}</span>
                    <div className="text-left">
                      <p className="font-bold text-lg">{group.label}</p>
                      <p className="text-sm text-gray-400">{count} exercícios</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          /* Favorites tab */
          !user ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-4">🔒</p>
              <p className="text-sm">{t('login_to_fav')}</p>
            </div>
          ) : favoriteList.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-4">♡</p>
              <p className="text-sm">{t('no_favorites')}</p>
            </div>
          ) : (
            <ExerciseList exs={favoriteList} />
          )
        )}
      </main>
    </div>
  );
}
