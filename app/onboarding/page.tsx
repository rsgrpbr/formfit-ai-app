'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession } from '@/hooks/useSession';
import { updateProfile } from '@/lib/supabase/queries';
import { toast } from 'sonner';

type Objective = 'emagrecer' | 'ganhar_massa' | 'definir' | 'condicionamento';
type Level = 'iniciante' | 'intermediario' | 'avancado';
type Location = 'casa' | 'academia';

function OnboardingContent() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReset = searchParams.get('reset') === 'true';
  const { user, profile, loading } = useSession();

  const [currentStep, setCurrentStep] = useState(1);
  const [objective, setObjective] = useState<Objective | ''>('');
  const [level, setLevel] = useState<Level | ''>('');
  const [daysPerWeek, setDaysPerWeek] = useState<number | null>(null);
  const [location, setLocation] = useState<Location | ''>('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    if (profile?.objective && !isReset) { router.replace('/my-plan'); return; }
  }, [user, profile, loading, router]);

  const handleFinish = async (loc: Location) => {
    if (!user || !objective || !level || !daysPerWeek) return;
    setGenerating(true);
    try {
      await updateProfile(user.id, {
        objective,
        level,
        days_per_week: daysPerWeek,
        location: loc,
      });

      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          objective,
          level,
          days_per_week: daysPerWeek,
          location: loc,
        }),
      });

      if (!res.ok) throw new Error('Generation failed');
      router.push('/my-plan');
    } catch {
      toast.error(t('error_generating'));
      setGenerating(false);
    }
  };

  if (loading || !user) return null;

  if (generating) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center gap-6 z-50">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white text-lg font-medium">{t('generating')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-800">
        <div
          className="h-1 bg-indigo-600 transition-all duration-500"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        />
      </div>

      <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 max-w-md mx-auto w-full">
        {/* Step 1 — Objective */}
        {currentStep === 1 && (
          <StepContainer title={t('title_objective')}>
            <OptionButton emoji="🔥" label={t('obj_lose_weight')} onClick={() => { setObjective('emagrecer'); setCurrentStep(2); }} />
            <OptionButton emoji="💪" label={t('obj_gain_muscle')} onClick={() => { setObjective('ganhar_massa'); setCurrentStep(2); }} />
            <OptionButton emoji="✂️" label={t('obj_tone')} onClick={() => { setObjective('definir'); setCurrentStep(2); }} />
            <OptionButton emoji="🏃" label={t('obj_conditioning')} onClick={() => { setObjective('condicionamento'); setCurrentStep(2); }} />
          </StepContainer>
        )}

        {/* Step 2 — Level */}
        {currentStep === 2 && (
          <StepContainer title={t('title_level')}>
            <OptionButton emoji="🌱" label={t('level_beginner')} onClick={() => { setLevel('iniciante'); setCurrentStep(3); }} />
            <OptionButton emoji="⚡" label={t('level_intermediate')} onClick={() => { setLevel('intermediario'); setCurrentStep(3); }} />
            <OptionButton emoji="🔱" label={t('level_advanced')} onClick={() => { setLevel('avancado'); setCurrentStep(3); }} />
          </StepContainer>
        )}

        {/* Step 3 — Days per week */}
        {currentStep === 3 && (
          <StepContainer title={t('title_days')}>
            <div className="grid grid-cols-2 gap-3 w-full">
              {[3, 4, 5, 6].map((d) => (
                <button
                  key={d}
                  onClick={() => { setDaysPerWeek(d); setCurrentStep(4); }}
                  className="py-6 rounded-2xl bg-gray-800 hover:bg-indigo-600 text-white font-bold text-2xl transition-all duration-150 active:scale-95"
                >
                  {d}
                </button>
              ))}
            </div>
          </StepContainer>
        )}

        {/* Step 4 — Location */}
        {currentStep === 4 && (
          <StepContainer title={t('title_location')}>
            <OptionButton emoji="🏠" label={t('loc_home')} onClick={() => { setLocation('casa'); handleFinish('casa'); }} />
            <OptionButton emoji="🏋️" label={t('loc_gym')} onClick={() => { setLocation('academia'); handleFinish('academia'); }} />
          </StepContainer>
        )}

        {/* Back button */}
        {currentStep > 1 && (
          <button
            onClick={() => setCurrentStep(s => s - 1)}
            className="mt-6 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Voltar
          </button>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <OnboardingContent />
    </Suspense>
  );
}

function StepContainer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <h1 className="text-2xl font-bold text-center mb-2">{title}</h1>
      {children}
    </div>
  );
}

function OptionButton({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-6 py-4 min-h-[56px] rounded-2xl bg-gray-800 hover:bg-indigo-600 text-white font-semibold text-lg transition-all duration-150 active:scale-95"
    >
      <span className="text-2xl">{emoji}</span>
      <span>{label}</span>
    </button>
  );
}
