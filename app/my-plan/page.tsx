'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSession } from '@/hooks/useSession';
import {
  getActivePlan,
  getPlanDays,
  getPlanExercises,
  type TrainingPlan,
  type PlanDay,
  type PlanExercise,
} from '@/lib/supabase/queries';
import { toast } from 'sonner';
import { Moon, Camera } from 'lucide-react';

export default function MyPlanPage() {
  const t = useTranslations('my_plan');
  const { user, profile, loading } = useSession();

  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [days, setDays] = useState<PlanDay[]>([]);
  const [exercises, setExercises] = useState<Record<string, PlanExercise[]>>({});
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const loadPlan = useCallback(async (uid: string) => {
    setPlanLoading(true);
    const activePlan = await getActivePlan(uid);
    if (!activePlan) { setPlan(null); setPlanLoading(false); return; }
    setPlan(activePlan);

    const planDays = await getPlanDays(activePlan.id);
    setDays(planDays);
    if (planDays.length > 0) setSelectedDayId(planDays[0].id);

    const exMap: Record<string, PlanExercise[]> = {};
    await Promise.all(
      planDays
        .filter((d) => !d.is_rest)
        .map(async (d) => {
          exMap[d.id] = await getPlanExercises(d.id);
        })
    );
    setExercises(exMap);
    setPlanLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && user) loadPlan(user.id);
    else if (!loading && !user) setPlanLoading(false);
  }, [user, loading, loadPlan]);

  const handleRegenerate = async () => {
    if (!user || !profile?.objective || !profile?.level || !profile?.days_per_week || !profile?.location) return;
    setRegenerating(true);
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          objective: profile.objective,
          level: profile.level,
          days_per_week: profile.days_per_week,
          location: profile.location,
        }),
      });
      if (!res.ok) throw new Error('Regeneration failed');
      await loadPlan(user.id);
    } catch {
      toast.error('Erro ao regenerar plano.');
    } finally {
      setRegenerating(false);
    }
  };

  const canRegenerate = !!(
    profile?.objective && profile?.level && profile?.days_per_week && profile?.location
  );

  const selectedDay = days.find((d) => d.id === selectedDayId) ?? null;
  const selectedExercises = selectedDayId ? (exercises[selectedDayId] ?? []) : [];

  if (planLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-lg text-gray-400">{t('no_plan')}</p>
        <Link href="/login" className="px-6 py-3 bg-indigo-600 rounded-2xl font-semibold text-white">
          Entrar
        </Link>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-lg text-gray-400">{t('no_plan')}</p>
        <Link
          href="/onboarding"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-semibold text-white transition-all active:scale-95"
        >
          {t('create_plan')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col pb-24">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">{plan.name}</h1>
          {plan.level && (
            <span className="px-3 py-1 rounded-full bg-indigo-600 text-xs font-semibold uppercase">
              {plan.level}
            </span>
          )}
        </div>
      </header>

      {/* Day tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none border-b border-gray-800">
        {days.map((day) => (
          <button
            key={day.id}
            onClick={() => setSelectedDayId(day.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95
              ${selectedDayId === day.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            {day.name}
          </button>
        ))}
      </div>

      {/* Day content */}
      <div className="flex-1 px-4 py-4">
        {selectedDay?.is_rest ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16" style={{ color: 'var(--text-muted)' }}>
            <Moon size={48} strokeWidth={1.5} />
            <p className="text-lg font-medium">{t('rest_day')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {selectedExercises.map((ex) => {
              const name = ex.exercise?.name_pt ?? ex.exercise?.name_en ?? ex.exercise_id;
              const slug = ex.exercise?.slug ?? '';
              return (
                <div
                  key={ex.id}
                  className="bg-gray-900 rounded-2xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-0.5">
                    <p className="font-semibold text-white">{name}</p>
                    <p className="text-sm text-gray-400">
                      {t('sets_reps', { sets: ex.sets, reps: ex.reps })}
                      {' · '}
                      {t('rest_label', { seconds: ex.rest_seconds })}
                    </p>
                  </div>
                  {slug && (
                    <Link
                      href={`/analyze?exercise=${slug}`}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                      style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                    >
                      <Camera size={14} />
                      {t('analyze_cta').replace('📷 ', '')}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer — Regenerate */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gray-950 border-t border-gray-800">
        <button
          onClick={handleRegenerate}
          disabled={!canRegenerate || regenerating}
          className="w-full py-4 rounded-2xl bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {regenerating ? t('regenerating') : t('regenerate')}
        </button>
      </div>
    </div>
  );
}
