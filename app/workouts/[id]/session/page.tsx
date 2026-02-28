'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession } from '@/hooks/useSession';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { useVoiceCoach } from '@/hooks/useVoiceCoach';
import { useGamification } from '@/hooks/useGamification';
import { useLocale } from '@/providers/I18nProvider';
import CameraFeed from '@/components/camera/CameraFeed';
import PoseOverlay from '@/components/camera/PoseOverlay';
import SessionResultModal from '@/components/gamification/SessionResultModal';
import { computeJointAngles } from '@/lib/angles/joints';
import {
  analyzeSquat, analyzePushup, analyzePlank, analyzeLunge,
  analyzeGluteBridge, analyzeSidePlank, analyzeSuperman,
  analyzeMountainClimber, analyzeBurpee,
} from '@/lib/rules';
import type { ErrorTracker, SquatPhase } from '@/lib/rules';
import type { PushupPhase } from '@/lib/rules';
import type { LungePhase } from '@/lib/rules';
import type { GluteBridgePhase } from '@/lib/rules';
import type { MountainClimberPhase } from '@/lib/rules';
import type { BurpeePhase } from '@/lib/rules';
import {
  getWorkoutTemplate,
  createSession,
  finishSession,
  getExerciseBySlug,
  type WorkoutTemplate,
} from '@/lib/supabase/queries';
import type { GamificationResult } from '@/types/gamification';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type SessionPhase = 'loading' | 'intro' | 'exercising' | 'resting' | 'done';

const EXERCISE_ICONS: Record<string, string> = {
  squat: '🦵', pushup: '💪', plank: '🏋️', lunge: '🚶',
  glute_bridge: '🍑', side_plank: '⬛', superman: '🦸',
  mountain_climber: '🏔️', burpee: '💥',
};

const TIMED_EXERCISES = new Set(['plank', 'side_plank', 'superman']);

const VIDEO_W = 640;
const VIDEO_H = 480;

// ── Componente ────────────────────────────────────────────────────────────────

export default function WorkoutSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const t       = useTranslations('workouts');
  const tEx     = useTranslations('exercises');

  const { user }               = useSession();
  const { locale }             = useLocale();
  const { landmarks, isReady, startDetection, stopDetection } = usePoseDetection();
  const { speak }              = useVoiceCoach({ locale, enabled: true });
  const { triggerGamification } = useGamification();

  // ── State ──────────────────────────────────────────────────────────────────

  const [workout,  setWorkout]  = useState<WorkoutTemplate | null>(null);
  const [phase,    setPhase]    = useState<SessionPhase>('loading');
  const [exIdx,    setExIdx]    = useState(0);
  const [setsDone, setSetsDone] = useState(0);
  const [repCount, setRepCount] = useState(0);
  const [score,    setScore]    = useState(100);
  const [restLeft, setRestLeft] = useState(0);
  const [holdLeft, setHoldLeft] = useState(0);
  const [gamResult, setGamResult] = useState<GamificationResult | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // ── Refs ───────────────────────────────────────────────────────────────────

  const exIdxRef      = useRef(0);
  const setsDoneRef   = useRef(0);
  const repRef        = useRef(0);
  const advancingRef  = useRef(false);
  const phaseRef      = useRef<SquatPhase | PushupPhase | LungePhase | GluteBridgePhase | MountainClimberPhase | BurpeePhase>('up');
  const errorRef      = useRef<ErrorTracker>({});
  const plankStartRef = useRef(0);
  const statsRef      = useRef({ totalReps: 0, goodReps: 0, scores: [] as number[] });
  const sessionIdRef  = useRef<string | null>(null);
  const restTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseStateRef = useRef<SessionPhase>('loading');

  // Sync phase → ref so it can be read inside timers/effects
  useEffect(() => { phaseStateRef.current = phase; }, [phase]);

  // ── Load workout ───────────────────────────────────────────────────────────

  useEffect(() => {
    getWorkoutTemplate(id).then(w => {
      setWorkout(w);
      setPhase(w ? 'intro' : 'loading');
    });
  }, [id]);

  // ── Exercise reset when exIdx changes ─────────────────────────────────────

  useEffect(() => {
    phaseRef.current  = 'up';
    errorRef.current  = {};
    repRef.current    = 0;
    setRepCount(0);
    advancingRef.current = false;
  }, [exIdx]);

  // ── Camera ready ──────────────────────────────────────────────────────────

  const handleCameraReady = useCallback(
    (video: HTMLVideoElement) => { if (isReady) startDetection(video); },
    [isReady, startDetection],
  );

  // ── Rest timer ────────────────────────────────────────────────────────────

  const startRest = useCallback((seconds: number) => {
    setPhase('resting');
    setRestLeft(seconds);
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    restTimerRef.current = setInterval(() => {
      setRestLeft(prev => {
        if (prev <= 1) {
          clearInterval(restTimerRef.current!);
          advancingRef.current = false;
          setPhase('exercising');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ── Hold timer (for timed exercises) ──────────────────────────────────────

  const startHold = useCallback((seconds: number, onDone: () => void) => {
    setHoldLeft(seconds);
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    holdTimerRef.current = setInterval(() => {
      setHoldLeft(prev => {
        if (prev <= 1) {
          clearInterval(holdTimerRef.current!);
          onDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ── Finish set → advance to next set / exercise / done ────────────────────

  const handleFinishSet = useCallback(() => {
    if (!workout) return;
    const ex = workout.exercises[exIdxRef.current];
    if (!ex) return;

    // Accumulate stats
    const repsThisSet = repRef.current;
    statsRef.current.totalReps += repsThisSet;

    const newSetsDone = setsDoneRef.current + 1;
    setsDoneRef.current = newSetsDone;
    setSetsDone(newSetsDone);
    repRef.current = 0;
    setRepCount(0);

    if (newSetsDone >= ex.sets) {
      // All sets done for this exercise → next exercise
      const nextIdx = exIdxRef.current + 1;
      if (nextIdx >= workout.exercises.length) {
        // Workout done
        setPhase('done');
      } else {
        exIdxRef.current = nextIdx;
        setExIdx(nextIdx);
        setsDoneRef.current = 0;
        setSetsDone(0);
        startRest(ex.rest_seconds);
      }
    } else {
      // More sets → rest
      startRest(ex.rest_seconds);
    }
  }, [workout, startRest]);

  // Keep ref up-to-date
  const handleFinishSetRef = useRef(handleFinishSet);
  useEffect(() => { handleFinishSetRef.current = handleFinishSet; }, [handleFinishSet]);

  // ── Skip rest ─────────────────────────────────────────────────────────────

  const handleSkipRest = useCallback(() => {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    advancingRef.current = false;
    setPhase('exercising');
  }, []);

  // ── Start workout ─────────────────────────────────────────────────────────

  const handleStart = useCallback(async () => {
    if (!workout || !user) return;
    // Create DB session for first exercise
    const firstSlug = workout.exercises[0]?.slug;
    if (firstSlug) {
      const ex = await getExerciseBySlug(firstSlug);
      if (ex) {
        const sid = await createSession(user.id, ex.id, navigator.userAgent);
        sessionIdRef.current = sid;
      }
    }
    exIdxRef.current   = 0;
    setsDoneRef.current = 0;
    statsRef.current   = { totalReps: 0, goodReps: 0, scores: [] };
    setExIdx(0);
    setSetsDone(0);
    setPhase('exercising');
  }, [workout, user]);

  // ── Workout done: gamification ────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'done' || !workout || !user) return;

    // Finish the DB session
    if (sessionIdRef.current && statsRef.current.totalReps > 0) {
      const avg = statsRef.current.scores.length > 0
        ? statsRef.current.scores.reduce((a, b) => a + b, 0) / statsRef.current.scores.length
        : 80;
      finishSession(sessionIdRef.current, {
        total_reps: statsRef.current.totalReps,
        good_reps:  statsRef.current.goodReps,
        bad_reps:   statsRef.current.totalReps - statsRef.current.goodReps,
        avg_score:  Math.round(avg * 100) / 100,
      });
    }

    const firstSlug = workout.exercises[0]?.slug ?? 'squat';
    const avgScore = statsRef.current.scores.length > 0
      ? statsRef.current.scores.reduce((a, b) => a + b, 0) / statsRef.current.scores.length
      : 80;

    triggerGamification({
      userId:       user.id,
      exerciseSlug: firstSlug,
      totalReps:    statsRef.current.totalReps,
      goodReps:     statsRef.current.goodReps,
      avgScore:     Math.round(avgScore * 100) / 100,
      sessionHour:  new Date().getHours(),
    }).then(r => { if (r) setGamResult(r); }).catch(console.error);
  }, [phase, workout, user, triggerGamification]);

  // ── Pose analysis ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'exercising' || !landmarks || !workout) return;
    const ex = workout.exercises[exIdxRef.current];
    if (!ex || TIMED_EXERCISES.has(ex.slug)) return; // timed exercises handled by hold timer

    const angles  = computeJointAngles(landmarks);
    const tracker = errorRef.current;
    let repComplete = false;
    let newScore    = score;

    if (ex.slug === 'squat') {
      const r = analyzeSquat(angles, landmarks, phaseRef.current as SquatPhase, tracker);
      phaseRef.current = r.phase; newScore = r.score; repComplete = r.repComplete;
    } else if (ex.slug === 'pushup') {
      const r = analyzePushup(angles, landmarks, phaseRef.current as PushupPhase, tracker);
      phaseRef.current = r.phase; newScore = r.score; repComplete = r.repComplete;
    } else if (ex.slug === 'lunge') {
      const r = analyzeLunge(angles, landmarks, phaseRef.current as LungePhase, tracker);
      phaseRef.current = r.phase; newScore = r.score; repComplete = r.repComplete;
    } else if (ex.slug === 'glute_bridge') {
      const r = analyzeGluteBridge(angles, landmarks, phaseRef.current as GluteBridgePhase, tracker);
      phaseRef.current = r.phase; newScore = r.score; repComplete = r.repComplete;
    } else if (ex.slug === 'mountain_climber') {
      const r = analyzeMountainClimber(angles, landmarks, phaseRef.current as MountainClimberPhase, tracker);
      phaseRef.current = r.phase; newScore = r.score; repComplete = r.repComplete;
    } else if (ex.slug === 'burpee') {
      const r = analyzeBurpee(angles, landmarks, phaseRef.current as BurpeePhase, tracker);
      phaseRef.current = r.phase; newScore = r.score; repComplete = r.repComplete;
    }

    setScore(newScore);

    if (repComplete) {
      const isGood = newScore >= 70;
      statsRef.current.goodReps += isGood ? 1 : 0;
      statsRef.current.scores.push(newScore);
      repRef.current += 1;
      setRepCount(repRef.current);

      if (repRef.current >= ex.reps && !advancingRef.current) {
        advancingRef.current = true;
        speak('Série concluída!', 'high');
        handleFinishSetRef.current();
      }
    }
  }, [landmarks, phase, score, speak, workout]);

  // ── Timed exercise: auto-start hold timer when exercising phase starts ────

  useEffect(() => {
    if (phase !== 'exercising' || !workout) return;
    const ex = workout.exercises[exIdxRef.current];
    if (!ex || !TIMED_EXERCISES.has(ex.slug)) return;

    plankStartRef.current = Date.now();
    startHold(ex.reps, () => {
      if (!advancingRef.current) {
        advancingRef.current = true;
        handleFinishSetRef.current();
      }
    });

    return () => { if (holdTimerRef.current) clearInterval(holdTimerRef.current); };
  }, [phase, exIdx, workout, startHold]);

  // ── Timed exercise: pose feedback (no rep counting) ───────────────────────

  useEffect(() => {
    if (phase !== 'exercising' || !landmarks || !workout) return;
    const ex = workout.exercises[exIdxRef.current];
    if (!ex || !TIMED_EXERCISES.has(ex.slug)) return;

    const angles  = computeJointAngles(landmarks);
    const held    = (Date.now() - plankStartRef.current) / 1000;
    const tracker = errorRef.current;

    if (ex.slug === 'plank')      { const r = analyzePlank(angles, landmarks, held, tracker); setScore(r.score); }
    if (ex.slug === 'side_plank') { const r = analyzeSidePlank(angles, landmarks, held, tracker); setScore(r.score); }
    if (ex.slug === 'superman')   { const r = analyzeSuperman(angles, landmarks, held, tracker); setScore(r.score); }
  }, [landmarks, phase, workout]);

  // ── Cleanup ───────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopDetection();
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, [stopDetection]);

  // ── Render helpers ────────────────────────────────────────────────────────

  const currentEx     = workout?.exercises[exIdx];
  const isTimed       = currentEx ? TIMED_EXERCISES.has(currentEx.slug) : false;
  const scoreColor    = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';

  // ── Loading ───────────────────────────────────────────────────────────────

  if (phase === 'loading' || !workout) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Intro ─────────────────────────────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col pb-32">
        <header className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-sm transition-colors">
            {t('back')}
          </button>
        </header>

        <div className="flex-1 px-4 py-6">
          <h1 className="text-2xl font-black mb-1">{workout.name_pt}</h1>
          <p className="text-sm text-gray-400 mb-6">
            {t('minutes', { min: workout.duration_minutes })} · {t('exercises_count', { count: workout.exercises.length })}
          </p>

          <div className="flex flex-col gap-3">
            {workout.exercises.map((ex, idx) => (
              <div key={idx} className="bg-gray-900 rounded-2xl p-4 flex items-center gap-4">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="text-xl flex-shrink-0">{EXERCISE_ICONS[ex.slug] ?? '💪'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{tEx(ex.slug as Parameters<typeof tEx>[0])}</p>
                  <p className="text-xs text-gray-400">
                    {ex.sets}×{isTimed ? `${ex.reps}s` : ex.reps} · {ex.rest_seconds}s descanso
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gray-950 border-t border-gray-800">
          <button
            onClick={handleStart}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg transition-all active:scale-95"
          >
            ▶ {t('start_btn')}
          </button>
        </div>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────

  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6 px-6">
        <div className="text-center">
          <p className="text-4xl mb-2">🎉</p>
          <h1 className="text-2xl font-black">{t('workout_done')}</h1>
          <p className="text-gray-400 mt-2">{t('summary_reps', { reps: statsRef.current.totalReps })}</p>
        </div>

        {gamResult && (
          <div className="w-full max-w-xs">
            <SessionResultModal
              result={gamResult}
              onClose={() => router.push('/workouts')}
            />
          </div>
        )}

        {!gamResult && (
          <button
            onClick={() => router.push('/workouts')}
            className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all active:scale-95"
          >
            {t('back')}
          </button>
        )}
      </div>
    );
  }

  // ── Exercising + Resting ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Camera — always mounted once session starts */}
      <div className={`relative flex-1 bg-gray-900 ${phase === 'resting' ? 'opacity-30' : ''}`}>
        <CameraFeed
          onReady={handleCameraReady}
          facingMode={facingMode}
          className="w-full h-full"
        />
        <PoseOverlay
          landmarks={phase === 'exercising' ? landmarks : null}
          width={VIDEO_W}
          height={VIDEO_H}
          score={score}
          showSkeleton={true}
        />

        {/* Flip camera */}
        <button
          onClick={() => setFacingMode(m => m === 'user' ? 'environment' : 'user')}
          className="absolute top-4 right-4 z-10 bg-black/50 rounded-full w-10 h-10 flex items-center justify-center text-white text-base"
        >
          🔄
        </button>

        {/* Score */}
        {phase === 'exercising' && (
          <div className={`absolute top-4 left-4 text-3xl font-black ${scoreColor}`}>
            {score}<span className="text-sm font-normal text-gray-400 ml-1">pts</span>
          </div>
        )}

        {/* MediaPipe loading */}
        {!isReady && phase === 'exercising' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* REST overlay */}
        {phase === 'resting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/85 gap-4">
            <p className="text-gray-400 text-sm uppercase tracking-widest">{t('rest_label')}</p>
            <p className="text-7xl font-black text-indigo-400">{restLeft}</p>

            {/* Next exercise preview */}
            {workout.exercises[exIdx] && (
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <span>{t('next_exercise')}:</span>
                <span className="font-semibold">{tEx(workout.exercises[exIdx].slug as Parameters<typeof tEx>[0])}</span>
              </div>
            )}

            <button
              onClick={handleSkipRest}
              className="mt-2 px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-all active:scale-95"
            >
              {t('skip_rest')}
            </button>
          </div>
        )}
      </div>

      {/* Bottom panel */}
      {phase === 'exercising' && currentEx && (
        <div className="bg-gray-950 border-t border-gray-800 px-4 py-4 flex flex-col gap-3">
          {/* Exercise info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{EXERCISE_ICONS[currentEx.slug] ?? '💪'}</span>
              <div>
                <p className="font-bold text-white">{tEx(currentEx.slug as Parameters<typeof tEx>[0])}</p>
                <p className="text-xs text-gray-400">
                  {t('set_progress', { current: setsDone + 1, total: currentEx.sets })}
                </p>
              </div>
            </div>

            {/* Rep / hold counter */}
            {isTimed ? (
              <div className="text-right">
                <p className="text-2xl font-black text-indigo-400">{holdLeft}</p>
                <p className="text-xs text-gray-400">seg restantes</p>
              </div>
            ) : (
              <div className="text-right">
                <p className="text-2xl font-black text-white">
                  <span className="text-indigo-400">{repCount}</span>
                  <span className="text-gray-600">/{currentEx.reps}</span>
                </p>
                <p className="text-xs text-gray-400">reps</p>
              </div>
            )}
          </div>

          {/* Set dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: currentEx.sets }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${i < setsDone ? 'bg-indigo-600' : i === setsDone ? 'bg-indigo-400' : 'bg-gray-700'}`}
              />
            ))}
          </div>

          {/* Action button */}
          <button
            onClick={() => {
              if (!advancingRef.current) {
                advancingRef.current = true;
                handleFinishSet();
              }
            }}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg transition-all active:scale-95"
          >
            {setsDone + 1 >= currentEx.sets && exIdx + 1 >= workout.exercises.length
              ? t('finish_workout')
              : t('finish_set')}
          </button>
        </div>
      )}
    </div>
  );
}
