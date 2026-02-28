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
import { Heart, Dumbbell, Search, ChevronLeft } from 'lucide-react';

// ── Static maps ───────────────────────────────────────────────────────────────

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
    { key: 'pernas',   label: t('group_legs'),
      keywords: ['quadriceps', 'hamstrings', 'calves', 'Quadríceps', 'Isquiotibiais', 'Panturrilhas'] },
    { key: 'peito',    label: t('group_chest'),
      keywords: ['chest', 'triceps', 'pectoral', 'Peitoral', 'Tríceps'] },
    { key: 'costas',   label: t('group_back'),
      keywords: ['lower_back', 'back', 'Lombar', 'Rombóides', 'Dorsal'] },
    { key: 'core',     label: t('group_core'),
      keywords: ['core', 'obliques', 'Core', 'Abdômen', 'Oblíquos', 'full_body'] },
    { key: 'ombros',   label: t('group_shoulders'),
      keywords: ['shoulders', 'Deltóide', 'Ombros'] },
    { key: 'gluteos',  label: t('group_glutes'),
      keywords: ['glutes', 'Glúteos'] },
  ];

  const OBJ_GROUPS = [
    { key: 'forca',  label: t('obj_strength'), categories: ['lower', 'upper'] },
    { key: 'cardio', label: t('obj_cardio'),   categories: ['cardio'] },
    { key: 'core',   label: t('obj_core'),     categories: ['core'] },
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

  // ── List view (shared for muscle + objective + favorites) ─────────────────

  const ExerciseList = ({ exs }: { exs: Exercise[] }) => (
    exs.length === 0 ? (
      <p className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>{t('no_results')}</p>
    ) : (
      <div className="space-y-3">
        {exs.map(ex => (
          <Link key={ex.id} href={`/exercises/${ex.slug}`}>
            <div
              className="rounded-2xl p-5 flex items-center gap-4 transition-all active:scale-[0.98]"
              style={{ background: 'var(--surface)' }}
            >
              {/* Icon */}
              <div
                className="flex-shrink-0 rounded-xl p-3 flex items-center justify-center"
                style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}
              >
                <Dumbbell size={22} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate text-base">{getName(ex)}</p>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${DIFF_STYLE[ex.difficulty] ?? 'bg-gray-700 text-gray-400'}`}>
                    {DIFF_LABEL[ex.difficulty] ?? ex.difficulty}
                  </span>
                  {ex.muscles_primary?.slice(0, 2).map(m => (
                    <span
                      key={m}
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Heart */}
              <button
                onClick={e => handleToggleFav(e, ex)}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                style={{ color: favorites.has(ex.id) ? '#f43f5e' : 'var(--text-muted)' }}
                aria-label={favorites.has(ex.id) ? 'Remover favorito' : 'Adicionar favorito'}
              >
                <Heart size={18} fill={favorites.has(ex.id) ? '#f43f5e' : 'none'} />
              </button>
            </div>
          </Link>
        ))}
      </div>
    )
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-white flex flex-col pb-24" style={{ background: 'var(--bg)' }}>

      {/* Header + search */}
      <header className="px-4 pt-5 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold mb-3">{t('title')}</h1>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            >
              <Search size={16} />
            </span>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              style={{
                background: 'var(--surface2)',
                color: 'var(--text)',
              }}
            />
          </div>
        </div>
      </header>

      {/* Tab bar — sticky */}
      <div
        className="sticky top-0 z-10 flex border-b"
        style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
      >
        <div className="flex w-full max-w-2xl mx-auto">
          {(['muscle', 'objective', 'favorites'] as Tab[]).map(tabKey => (
            <button
              key={tabKey}
              onClick={() => handleTabChange(tabKey)}
              className="flex-1 py-3 text-xs font-semibold transition-colors border-b-2 -mb-px"
              style={{
                borderColor: tab === tabKey ? 'var(--accent)' : 'transparent',
                color: tab === tabKey ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {tabKey === 'muscle' ? t('tab_muscle') : tabKey === 'objective' ? t('tab_objective') : t('tab_favorites')}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />
              ))}
            </div>
          ) : tab === 'muscle' ? (
            selectedGroup ? (
              <>
                <BackButton onClick={() => setSelectedGroup(null)} label={t('back')} />
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
                      className="rounded-2xl p-4 flex flex-col items-center gap-2
                        active:scale-95 transition-all text-center"
                      style={{ background: 'var(--surface)' }}
                    >
                      <div
                        className="rounded-xl p-3 flex items-center justify-center"
                        style={{ background: 'var(--surface2)', color: 'var(--accent)' }}
                      >
                        <Dumbbell size={24} />
                      </div>
                      <span className="font-semibold text-sm leading-tight">{group.label}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{count} exerc.</span>
                    </button>
                  );
                })}
              </div>
            )
          ) : tab === 'objective' ? (
            selectedGroup ? (
              <>
                <BackButton onClick={() => setSelectedGroup(null)} label={t('back')} />
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
                      className="w-full rounded-2xl p-5 flex items-center gap-4
                        active:scale-[0.98] transition-all"
                      style={{ background: 'var(--surface)' }}
                    >
                      <div
                        className="rounded-xl p-3 flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--surface2)', color: 'var(--accent)' }}
                      >
                        <Dumbbell size={28} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg">{group.label}</p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{count} exercícios</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            /* Favorites tab */
            !user ? (
              <div className="text-center py-16 flex flex-col items-center gap-3" style={{ color: 'var(--text-muted)' }}>
                <Heart size={40} strokeWidth={1.5} />
                <p className="text-sm">{t('login_to_fav')}</p>
              </div>
            ) : favoriteList.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center gap-3" style={{ color: 'var(--text-muted)' }}>
                <Heart size={40} strokeWidth={1.5} />
                <p className="text-sm">{t('no_favorites')}</p>
              </div>
            ) : (
              <ExerciseList exs={favoriteList} />
            )
          )}
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 transition-all active:scale-95"
      style={{ background: 'var(--surface2)', color: 'var(--text)' }}
    >
      <ChevronLeft size={16} />
      {label.replace('← ', '')}
    </button>
  );
}
