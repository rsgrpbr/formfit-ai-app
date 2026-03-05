'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useRef, useState, Suspense, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Dumbbell, Zap, Repeat, Timer } from 'lucide-react';
import CameraFeed from '@/components/camera/CameraFeed';
import { unlockIOSAudio } from '@/lib/pwa';
import PoseOverlay from '@/components/camera/PoseOverlay';
import SessionResultModal from '@/components/gamification/SessionResultModal';
import MuscleAvatar from '@/components/MuscleAvatar';
import type { ExerciseSlug as MuscleAvatarSlug } from '@/components/MuscleAvatar';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { useVoiceCoach } from '@/hooks/useVoiceCoach';
import { useSession } from '@/hooks/useSession';
import { usePlan, FREE_MONTHLY_LIMIT } from '@/hooks/usePlan';
import { useGamification } from '@/hooks/useGamification';
import { useLocale } from '@/providers/I18nProvider';
import type { Locale } from '@/providers/I18nProvider';
import { redirectToCheckout } from '@/lib/perfectpay';
import type { GamificationResult } from '@/types/gamification';
import { computeJointAngles, angleBuffer } from '@/lib/angles/joints';
import {
  analyzeSquat, analyzePushup, analyzePlank, analyzeLunge,
  analyzeGluteBridge, analyzeSidePlank, analyzeSuperman,
  analyzeMountainClimber, analyzeBurpee,
  analyzeJumpSquat, analyzeSumoSquat, analyzeDonkeyKick, analyzeFireHydrant,
  analyzeHipThrust, analyzeWallSit,
  analyzeCrunch, analyzeBicycleCrunch, analyzeLegRaise, analyzeRussianTwist,
  analyzeDeadBug, analyzeBirdDog, analyzeFlutterKick,
  analyzePikePushup, analyzeDiamondPushup, analyzeWidePushup, analyzeTricepDip,
  analyzeHighKnees, analyzeBearCrawl, analyzeInchworm,
} from '@/lib/rules';
import type { ErrorTracker } from '@/lib/rules';
import {
  createSession,
  finishSession,
  getExerciseBySlug,
} from '@/lib/supabase/queries';

// ── Types ─────────────────────────────────────────────────────────────────────

type ExerciseSlug =
  | 'squat' | 'pushup' | 'plank' | 'lunge'
  | 'glute_bridge' | 'side_plank' | 'superman'
  | 'mountain_climber' | 'burpee'
  | 'jump_squat' | 'sumo_squat' | 'donkey_kick' | 'fire_hydrant'
  | 'hip_thrust' | 'wall_sit'
  | 'crunch' | 'bicycle_crunch' | 'leg_raise' | 'russian_twist'
  | 'dead_bug' | 'bird_dog' | 'flutter_kick'
  | 'pike_pushup' | 'diamond_pushup' | 'wide_pushup' | 'tricep_dip'
  | 'high_knees' | 'bear_crawl' | 'inchworm';

type ExercisePhase = 'up' | 'down' | 'transition';

interface SessionStats {
  totalReps: number;
  goodReps: number;
  badReps: number;
  scores: number[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EXERCISES: ExerciseSlug[] = [
  'squat', 'pushup', 'plank', 'lunge', 'glute_bridge',
  'side_plank', 'superman', 'mountain_climber', 'burpee',
  'jump_squat', 'sumo_squat', 'donkey_kick', 'fire_hydrant',
  'hip_thrust', 'wall_sit',
  'crunch', 'bicycle_crunch', 'leg_raise', 'russian_twist',
  'dead_bug', 'bird_dog', 'flutter_kick',
  'pike_pushup', 'diamond_pushup', 'wide_pushup', 'tricep_dip',
  'high_knees', 'bear_crawl', 'inchworm',
];

const TIME_BASED: ExerciseSlug[] = ['plank', 'side_plank', 'superman', 'wall_sit', 'dead_bug', 'bird_dog'];

const VIDEO_W = 640;
const VIDEO_H = 480;

// ── Main component ────────────────────────────────────────────────────────────

function AnalyzePageInner() {
  const t   = useTranslations('analyze');
  const tEx = useTranslations('exercises');

  const { user, profile, signOut } = useSession();
  const { locale, setLocale }      = useLocale();
  const { landmarks, isReady, error: poseError, startDetection, stopDetection } = usePoseDetection();
  const { speak, isSpeaking }      = useVoiceCoach({ locale, enabled: true });
  const { plan, canAnalyze, monthlyCount, loading: planLoading } = usePlan();
  const { triggerGamification }    = useGamification();

  const searchParams   = useSearchParams();
  const paramExercise  = searchParams.get('exercise') as ExerciseSlug | null;

  // Sync locale from profile
  useEffect(() => {
    if (profile?.locale && profile.locale !== locale) setLocale(profile.locale as Locale);
  }, [profile?.locale]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Camera state ──────────────────────────────────────────────────────────
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [zoomLevel, setZoomLevel]   = useState(1);
  const [zoomCaps, setZoomCaps]     = useState<{ min: number; max: number; step: number } | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => { unlockIOSAudio(); }, []);

  // ── Exercise / session state ───────────────────────────────────────────────
  const [selectedExercise, setSelectedExercise] = useState<ExerciseSlug>(
    (paramExercise && EXERCISES.includes(paramExercise)) ? paramExercise : 'squat'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isRunning, setIsRunning]     = useState(false);
  const [score, setScore]             = useState(100);
  const [stats, setStats]             = useState<SessionStats>({ totalReps: 0, goodReps: 0, badReps: 0, scores: [] });
  const [elapsed, setElapsed]         = useState(0);
  const [feedback, setFeedback]       = useState<string[]>([]);
  const [sessionId, setSessionId]     = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton]       = useState(false);
  const [gamificationResult, setGamificationResult] = useState<GamificationResult | null>(null);

  // ── Series state ──────────────────────────────────────────────────────────
  const [currentSet, setCurrentSet]     = useState(1);
  const [targetSets, setTargetSets]     = useState(3);
  const [targetReps, setTargetReps]     = useState(10);
  const [restTime, setRestTime]         = useState(60);
  const [isResting, setIsResting]       = useState(false);
  const [restCountdown, setRestCountdown] = useState(0);

  // ── Stable refs ───────────────────────────────────────────────────────────
  const phaseRef            = useRef<ExercisePhase>('up');
  const statsRef            = useRef<SessionStats>({ totalReps: 0, goodReps: 0, badReps: 0, scores: [] });
  const errorTrackerRef     = useRef<ErrorTracker>({});
  const timerRef            = useRef<ReturnType<typeof setInterval> | null>(null);
  const plankStart          = useRef<number>(0);
  const sessionStartHourRef = useRef<number>(0);
  const localeRef           = useRef<string>(locale);
  const selectedExerciseRef = useRef<ExerciseSlug>('squat');
  const currentSetRef       = useRef(1);
  const targetSetsRef       = useRef(3);
  const targetRepsRef       = useRef(10);
  const restTimeRef         = useRef(60);
  const speakRef            = useRef(speak);
  const handleStopRef       = useRef<() => void>(() => {});

  // Sync mutable refs every render
  localeRef.current           = locale;
  selectedExerciseRef.current = selectedExercise;
  currentSetRef.current       = currentSet;
  targetSetsRef.current       = targetSets;
  targetRepsRef.current       = targetReps;
  restTimeRef.current         = restTime;
  speakRef.current            = speak;

  // Signal BottomNav to hide itself while session is running
  useEffect(() => {
    if (isRunning) {
      document.body.setAttribute('data-running', 'true');
    } else {
      document.body.removeAttribute('data-running');
    }
    return () => { document.body.removeAttribute('data-running'); };
  }, [isRunning]);

  // Reset tracker/phase on exercise change
  useEffect(() => {
    errorTrackerRef.current = {};
    phaseRef.current = 'up';
  }, [selectedExercise]);

  // ── Set completion helper (reads only refs) ────────────────────────────────
  const checkSetCompletion = () => {
    if (TIME_BASED.includes(selectedExerciseRef.current)) return;
    const total     = statsRef.current.totalReps;
    const perSet    = targetRepsRef.current;
    const curSet    = currentSetRef.current;
    const totalSets = targetSetsRef.current;

    if (total >= perSet * curSet) {
      if (curSet < totalSets) {
        setIsResting(true);
        const text = getFeedbackText('general.set_complete', localeRef.current)
          .replace('{set}', String(curSet))
          .replace('{rest}', String(restTimeRef.current));
        speakRef.current(text, 'high');
      } else {
        speakRef.current(getFeedbackText('general.workout_complete', localeRef.current), 'high');
        handleStopRef.current();
      }
    }
  };

  // ── Analysis frame-by-frame ───────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning || !landmarks) return;

    const angles  = computeJointAngles(landmarks);
    const tracker = errorTrackerRef.current;

    const speakFeedback = (keys: string[]) => {
      const key = keys[0];
      if (!key) return;
      const text = getFeedbackText(key, localeRef.current);
      if (text) speak(text, key.startsWith('general.') ? 'high' : 'low');
    };

    const handleRep = (result: { repComplete: boolean; score: number; feedback: string[] }) => {
      if (result.repComplete) {
        const isGood = result.score >= 70;
        statsRef.current = {
          totalReps: statsRef.current.totalReps + 1,
          goodReps:  statsRef.current.goodReps  + (isGood ? 1 : 0),
          badReps:   statsRef.current.badReps   + (isGood ? 0 : 1),
          scores:    [...statsRef.current.scores, result.score],
        };
        setStats({ ...statsRef.current });
        const reps = statsRef.current.totalReps;
        if (reps === 1)          speak(getFeedbackText('general.first_rep',      localeRef.current), 'high');
        else if (reps % 10 === 0) speak(getFeedbackText('general.ten_reps',       localeRef.current).replace('{reps}', String(reps)), 'high');
        else if (reps % 5  === 0) speak(getFeedbackText('general.milestone_reps', localeRef.current).replace('{reps}', String(reps)), 'high');
        else speakFeedback(result.feedback);
        checkSetCompletion();
      } else {
        speakFeedback(result.feedback);
      }
    };

    if (selectedExerciseRef.current === 'squat') {
      const r = analyzeSquat(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'pushup') {
      const r = analyzePushup(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'plank') {
      const r = analyzePlank(angles, landmarks, (Date.now() - plankStart.current) / 1000, tracker);
      setScore(r.score); setFeedback(r.feedback); speakFeedback(r.feedback);
    }
    if (selectedExerciseRef.current === 'lunge') {
      const r = analyzeLunge(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'glute_bridge') {
      const r = analyzeGluteBridge(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'side_plank') {
      const r = analyzeSidePlank(angles, landmarks, (Date.now() - plankStart.current) / 1000, tracker);
      setScore(r.score); setFeedback(r.feedback); speakFeedback(r.feedback);
    }
    if (selectedExerciseRef.current === 'superman') {
      const r = analyzeSuperman(angles, landmarks, (Date.now() - plankStart.current) / 1000, tracker);
      setScore(r.score); setFeedback(r.feedback); speakFeedback(r.feedback);
    }
    if (selectedExerciseRef.current === 'mountain_climber') {
      const r = analyzeMountainClimber(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'burpee') {
      const r = analyzeBurpee(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'jump_squat') {
      const r = analyzeJumpSquat(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'sumo_squat') {
      const r = analyzeSumoSquat(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'donkey_kick') {
      const r = analyzeDonkeyKick(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'fire_hydrant') {
      const r = analyzeFireHydrant(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'hip_thrust') {
      const r = analyzeHipThrust(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'wall_sit') {
      const r = analyzeWallSit(angles, landmarks, phaseRef.current, tracker);
      setScore(r.score); setFeedback(r.feedback); speakFeedback(r.feedback);
    }
    if (selectedExerciseRef.current === 'crunch') {
      const r = analyzeCrunch(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'bicycle_crunch') {
      const r = analyzeBicycleCrunch(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'leg_raise') {
      const r = analyzeLegRaise(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'russian_twist') {
      const r = analyzeRussianTwist(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'dead_bug') {
      const r = analyzeDeadBug(angles, landmarks, phaseRef.current, tracker);
      setScore(r.score); setFeedback(r.feedback); speakFeedback(r.feedback);
    }
    if (selectedExerciseRef.current === 'bird_dog') {
      const r = analyzeBirdDog(angles, landmarks, phaseRef.current, tracker);
      setScore(r.score); setFeedback(r.feedback); speakFeedback(r.feedback);
    }
    if (selectedExerciseRef.current === 'flutter_kick') {
      const r = analyzeFlutterKick(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'pike_pushup') {
      const r = analyzePikePushup(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'diamond_pushup') {
      const r = analyzeDiamondPushup(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'wide_pushup') {
      const r = analyzeWidePushup(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'tricep_dip') {
      const r = analyzeTricepDip(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'high_knees') {
      const r = analyzeHighKnees(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'bear_crawl') {
      const r = analyzeBearCrawl(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
    if (selectedExerciseRef.current === 'inchworm') {
      const r = analyzeInchworm(angles, landmarks, phaseRef.current, tracker);
      phaseRef.current = r.phase as ExercisePhase; setScore(r.score); setFeedback(r.feedback); handleRep(r);
    }
  }, [landmarks, isRunning, speak]);

  // ── Session timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  // ── Rest countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isResting) return;
    setRestCountdown(restTimeRef.current);
    const id = setInterval(() => {
      setRestCountdown(prev => {
        if (prev <= 1) {
          clearInterval(id);
          const nextSet = currentSetRef.current + 1;
          setCurrentSet(nextSet);
          currentSetRef.current = nextSet;
          setIsResting(false);
          speakRef.current(
            getFeedbackText('general.next_set', localeRef.current).replace('{set}', String(nextSet)),
            'high'
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isResting]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCameraReady = useCallback(
    (video: HTMLVideoElement) => {
      videoRef.current = video;
      if (isReady) startDetection(video);
      const stream = video.srcObject as MediaStream | null;
      if (stream) {
        const track = stream.getVideoTracks()[0];
        if (track) {
          trackRef.current = track;
          try {
            const caps = track.getCapabilities() as MediaTrackCapabilities & { zoom?: { min: number; max: number; step: number } };
            if (caps.zoom) {
              setZoomCaps({ min: caps.zoom.min, max: caps.zoom.max, step: caps.zoom.step });
              setZoomLevel(caps.zoom.min);
              track.applyConstraints({ advanced: [{ zoom: caps.zoom.min } as MediaTrackConstraintSet] }).catch(() => {});
            }
          } catch { /* zoom not supported */ }
        }
      }
    },
    [isReady, startDetection]
  );

  // If detector becomes ready after camera started
  useEffect(() => {
    if (isReady && videoRef.current && isRunning) startDetection(videoRef.current);
  }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const adjustZoom = useCallback((delta: number) => {
    if (!zoomCaps || !trackRef.current) return;
    setZoomLevel(prev => {
      const next = Math.max(zoomCaps.min, Math.min(zoomCaps.max, prev + delta * zoomCaps.step));
      trackRef.current!.applyConstraints({ advanced: [{ zoom: next } as MediaTrackConstraintSet] }).catch(() => {});
      return next;
    });
  }, [zoomCaps]);

  const handleStart = useCallback(async () => {
    if (!canAnalyze) return;
    phaseRef.current        = 'up';
    statsRef.current        = { totalReps: 0, goodReps: 0, badReps: 0, scores: [] };
    errorTrackerRef.current = {};
    angleBuffer.reset();
    setStats({ totalReps: 0, goodReps: 0, badReps: 0, scores: [] });
    setElapsed(0);
    setScore(100);
    setFeedback([]);
    setCurrentSet(1);
    currentSetRef.current = 1;
    setIsResting(false);
    plankStart.current          = Date.now();
    sessionStartHourRef.current = new Date().getHours();

    if (user) {
      const exercise = await getExerciseBySlug(selectedExercise);
      if (exercise) {
        const id = await createSession(user.id, exercise.id, navigator.userAgent);
        setSessionId(id);
      }
    }

    setIsRunning(true);
    speak(getFeedbackText('general.session_start', localeRef.current), 'high');
  }, [user, selectedExercise, speak, canAnalyze]);

  const handleStop = useCallback(async () => {
    setIsRunning(false);
    setIsResting(false);
    stopDetection();

    if (sessionId && statsRef.current.totalReps > 0) {
      const avg      = statsRef.current.scores.length > 0
        ? statsRef.current.scores.reduce((a, b) => a + b, 0) / statsRef.current.scores.length
        : 0;
      const avgScore = Math.round(avg * 100) / 100;

      await finishSession(sessionId, {
        total_reps:    statsRef.current.totalReps,
        good_reps:     statsRef.current.goodReps,
        bad_reps:      statsRef.current.badReps,
        avg_score:     avgScore,
        feedback_json: { feedbackKeys: feedback },
      });

      if (user) {
        try {
          const result = await triggerGamification({
            userId:       user.id,
            exerciseSlug: selectedExercise,
            totalReps:    statsRef.current.totalReps,
            goodReps:     statsRef.current.goodReps,
            avgScore,
            sessionHour:  sessionStartHourRef.current,
          });
          if (result) setGamificationResult(result);
        } catch (err) {
          console.error('[handleStop] Gamification error (non-fatal):', err);
        }
      }
    }

    setSessionId(null);
  }, [sessionId, feedback, stopDetection, user, selectedExercise, triggerGamification]);

  handleStopRef.current = handleStop;

  // Back button — stops without DB save, returns to setup
  const handleBack = useCallback(() => {
    setIsRunning(false);
    setIsResting(false);
    stopDetection();
    // Reset UI state so setup screen is clean
    statsRef.current        = { totalReps: 0, goodReps: 0, badReps: 0, scores: [] };
    errorTrackerRef.current = {};
    phaseRef.current        = 'up';
    setStats({ totalReps: 0, goodReps: 0, badReps: 0, scores: [] });
    setElapsed(0);
    setScore(100);
    setFeedback([]);
    setCurrentSet(1);
    currentSetRef.current = 1;
    setSessionId(null);
  }, [stopDetection]);

  const skipRest = useCallback(() => {
    const nextSet = currentSetRef.current + 1;
    setCurrentSet(nextSet);
    currentSetRef.current = nextSet;
    setIsResting(false);
    speakRef.current(getFeedbackText('general.rest_skip', localeRef.current), 'high');
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const filteredExercises = searchQuery
    ? EXERCISES.filter(slug => tEx(slug).toLowerCase().includes(searchQuery.toLowerCase()))
    : EXERCISES;

  const scoreColor  = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  const formatTime  = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const errorFeedback = feedback.filter(k => !k.startsWith('general.'));
  const repsInSet     = Math.max(0, stats.totalReps - (currentSet - 1) * targetReps);

  // ── SETUP SCREEN ─────────────────────────────────────────────────────────
  if (!isRunning) {
    return (
      <div className="min-h-screen flex flex-col text-white" style={{ background: 'var(--bg)' }}>

        {/* Gamification result modal (after session) */}
        {gamificationResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm overflow-y-auto">
            <SessionResultModal result={gamificationResult} onClose={() => setGamificationResult(null)} />
          </div>
        )}

        {/* Upgrade gate */}
        {!planLoading && !canAnalyze && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm px-4">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl">
              <p className="text-3xl mb-3">🔒</p>
              <h3 className="text-lg font-bold mb-2">{t('limit_title')}</h3>
              <p className="text-gray-400 text-sm mb-5">
                {t('limit_desc', { count: monthlyCount, limit: FREE_MONTHLY_LIMIT })}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => user && redirectToCheckout('pro_mensal', user.id)}
                  disabled={!user}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {t('upgrade_pro')}
                </button>
                <a href="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors py-2">
                  {t('see_all_plans')}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="meMove" className="h-8 w-auto" />
            {plan !== 'free' && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest"
                style={{ background: 'var(--accent)', color: 'var(--bg)' }}
              >
                PRO
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isSpeaking && <span className="animate-pulse text-xs text-gray-400">🔊</span>}
            {!planLoading && plan === 'free' && (
              <a href="/pricing" className="text-[10px] text-gray-500 hover:text-indigo-400 transition-colors">
                {t('analyses_count', { count: monthlyCount, limit: FREE_MONTHLY_LIMIT })}
              </a>
            )}
            {!user ? (
              <a href="/login" className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold">
                {t('enter')}
              </a>
            ) : (
              <>
                <a href="/settings" className="text-gray-400 hover:text-white transition-colors">⚙️</a>
                <button onClick={signOut} className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
                  {t('sign_out')}
                </button>
              </>
            )}
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 pb-44 space-y-5">

          <h2 className="font-display text-sm tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
            CONFIGURE SEU TREINO
          </h2>

          {/* Exercise grid */}
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Exercício
            </p>
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar exercício…"
              className="w-full px-3 py-2 rounded-xl text-sm mb-2 outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <div className="grid grid-cols-3 gap-2">
              {filteredExercises.map(slug => {
                const sel = selectedExercise === slug;
                return (
                  <button
                    key={slug}
                    onClick={() => setSelectedExercise(slug)}
                    className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl text-[11px] font-semibold transition-all active:scale-95 border"
                    style={sel
                      ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'rgba(200,241,53,0.12)' }
                      : { borderColor: 'transparent', background: 'var(--surface)', color: 'var(--text-muted)' }
                    }
                  >
                    <Dumbbell size={15} />
                    <span className="text-center leading-tight">{tEx(slug)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Config rows */}
          <div className="space-y-2">
            <ConfigRow
              icon={<Zap size={17} style={{ color: 'var(--accent)' }} />}
              label="SÉRIES"
              value={String(targetSets)}
              onDec={() => setTargetSets(v => Math.max(1, v - 1))}
              onInc={() => setTargetSets(v => Math.min(10, v + 1))}
            />
            <ConfigRow
              icon={<Repeat size={17} style={{ color: 'var(--accent)' }} />}
              label="REPS"
              value={String(targetReps)}
              onDec={() => setTargetReps(v => Math.max(1, v - 1))}
              onInc={() => setTargetReps(v => Math.min(50, v + 1))}
            />
            <ConfigRow
              icon={<Timer size={17} style={{ color: 'var(--accent)' }} />}
              label="DESCANSO"
              value={`${restTime}s`}
              onDec={() => setRestTime(v => Math.max(0, v - 15))}
              onInc={() => setRestTime(v => Math.min(300, v + 15))}
            />
          </div>

          {/* Muscle avatar */}
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Músculos
            </p>
            <div className="flex justify-center">
              <MuscleAvatar
                slug={selectedExercise as MuscleAvatarSlug}
                size={110}
                gender={profile?.gender ?? 'male'}
              />
            </div>
          </div>

        </div>

        {/* Fixed CTA */}
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 z-10">
          {!planLoading && !canAnalyze ? (
            <a
              href="/pricing"
              className="flex items-center justify-center w-full rounded-xl font-display text-gray-900 active:scale-95 transition-transform"
              style={{ height: 64, fontSize: 20, letterSpacing: '0.1em', background: '#eab308' }}
            >
              🔒 {t('see_plans')}
            </a>
          ) : (
            <button
              onClick={handleStart}
              disabled={!isReady || planLoading}
              className="w-full rounded-xl font-display transition-all active:scale-95 disabled:opacity-40"
              style={{ height: 64, fontSize: 22, letterSpacing: '0.1em', background: 'var(--accent)', color: 'var(--bg)' }}
            >
              {!isReady ? 'CARREGANDO…' : 'INICIAR TREINO'}
            </button>
          )}
          {!user && (
            <p className="text-center text-[10px] text-gray-600 mt-1">{t('login_to_save')}</p>
          )}
        </div>

      </div>
    );
  }

  // ── RUNNING SCREEN ────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">

      {/* Camera fullscreen */}
      <CameraFeed
        onReady={handleCameraReady}
        facingMode={facingMode}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Skeleton overlay */}
      <PoseOverlay
        landmarks={landmarks}
        width={VIDEO_W}
        height={VIDEO_H}
        score={score}
        showSkeleton={showSkeleton}
      />

      {/* MediaPipe loading */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 z-20">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-300 text-sm">{t('loading')}</p>
          </div>
        </div>
      )}

      {/* Rest overlay */}
      {isResting && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <p className="font-display text-2xl tracking-widest" style={{ color: 'var(--text-muted)' }}>
            😮‍💨 DESCANSANDO
          </p>
          <p
            className="font-display leading-none"
            style={{ fontSize: 120, color: 'var(--accent)' }}
          >
            {restCountdown}
          </p>
          <p className="text-sm tracking-wider" style={{ color: 'var(--text-muted)' }}>
            PRÓXIMA SÉRIE: {currentSet + 1} DE {targetSets}
          </p>
          <button
            onClick={skipRest}
            className="mt-2 px-8 py-2.5 rounded-full font-display text-sm tracking-widest active:scale-95 transition-transform"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            PULAR DESCANSO
          </button>
        </div>
      )}

      {/* Gamification modal (shown after handleStop fires) */}
      {gamificationResult && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm overflow-y-auto">
          <SessionResultModal result={gamificationResult} onClose={() => setGamificationResult(null)} />
        </div>
      )}

      {/* TOP LEFT — back button + score */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white text-lg font-bold active:scale-95 transition-transform"
          aria-label="Voltar"
        >
          ←
        </button>
        <span className={`font-display leading-none ${scoreColor}`} style={{ fontSize: 56 }}>
          {score}
        </span>
      </div>

      {/* TOP CENTER — exercise name */}
      <div className="absolute top-5 left-16 right-16 z-10 flex justify-center pointer-events-none">
        <span className="font-display text-base tracking-widest text-white drop-shadow-lg">
          {tEx(selectedExercise).toUpperCase()}
        </span>
      </div>

      {/* TOP RIGHT — camera + zoom */}
      <div className="absolute top-4 right-3 z-10 flex flex-col items-end gap-2">
        <button
          onClick={() => setFacingMode(m => m === 'user' ? 'environment' : 'user')}
          className="bg-black/50 backdrop-blur-sm rounded-full w-11 h-11 flex items-center justify-center text-white text-lg active:scale-95 transition-transform"
        >
          🔄
        </button>
        {zoomCaps && (
          <>
            <button onClick={() => adjustZoom(1)}  className="bg-black/50 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center text-white font-bold active:scale-95">+</button>
            <button onClick={() => adjustZoom(-1)} className="bg-black/50 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center text-white font-bold active:scale-95">−</button>
          </>
        )}
      </div>

      {/* MIDDLE — series + rep progress bar */}
      {!TIME_BASED.includes(selectedExercise) && (
        <div className="absolute top-24 left-4 right-4 z-10">
          <p className="font-display text-xs tracking-widest text-white/60 text-center mb-1.5">
            SÉRIE {currentSet} DE {targetSets}
          </p>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                background: 'var(--accent)',
                width: `${Math.min(100, (repsInSet / targetReps) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-white/40 text-center mt-1">{repsInSet} / {targetReps} reps</p>
        </div>
      )}

      {/* Error feedback */}
      {errorFeedback.length > 0 && (
        <div className="absolute top-40 left-4 right-4 z-10 space-y-1">
          {errorFeedback.slice(0, 2).map(key => (
            <div key={key} className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-yellow-300">
              ⚠ {getFeedbackText(key, locale)}
            </div>
          ))}
        </div>
      )}

      {/* Pose error */}
      {poseError && (
        <div className="absolute top-4 left-4 right-20 z-10 bg-red-900/80 rounded-lg px-3 py-2 text-sm text-red-200">
          {poseError}
        </div>
      )}

      {/* Skeleton toggle */}
      <button
        onClick={() => setShowSkeleton(v => !v)}
        className={`absolute bottom-32 right-3 z-10 min-w-[44px] min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold shadow-lg backdrop-blur-sm transition-all flex items-center justify-center gap-1
          ${showSkeleton ? 'bg-green-600/90 text-white' : 'bg-gray-900/80 text-gray-300'}`}
      >
        🦴 {showSkeleton ? 'ON' : 'OFF'}
      </button>

      {/* BOTTOM — stats + stop */}
      <div className="absolute bottom-16 left-0 right-0 z-10 bg-black/60 backdrop-blur-md px-4 pt-3 pb-4">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <RunStat label="TEMPO" value={formatTime(elapsed)} />
          <RunStat label="REPS"  value={`${repsInSet}/${targetReps}`} />
          <RunStat label="SCORE" value={String(score)} color={scoreColor} />
        </div>
        <button
          onClick={handleStop}
          className="w-full h-14 rounded-xl font-display text-xl tracking-widest text-white active:scale-95 transition-transform"
          style={{ background: 'var(--danger)' }}
        >
          PARAR
        </button>
      </div>

    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense>
      <AnalyzePageInner />
    </Suspense>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ConfigRow({
  icon, label, value, onDec, onInc,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex items-center h-14 px-4 rounded-xl gap-3" style={{ background: 'var(--surface)' }}>
      <span className="flex-shrink-0">{icon}</span>
      <span className="font-display text-xs tracking-widest flex-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={onDec}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg active:scale-90 transition-transform"
          style={{ background: 'var(--surface2)' }}
        >
          −
        </button>
        <span className="font-display text-lg tracking-wider w-10 text-center text-white">{value}</span>
        <button
          onClick={onInc}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg active:scale-90 transition-transform"
          style={{ background: 'var(--surface2)' }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function RunStat({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center">
      <p className="font-display text-[9px] tracking-widest text-white/40">{label}</p>
      <p className={`font-display text-2xl leading-tight ${color}`}>{value}</p>
    </div>
  );
}

// ── Feedback texts (4 locales) ────────────────────────────────────────────────

const FEEDBACK_TEXTS: Record<string, Record<string, string>> = {
  pt: {
    'general.perfect_form':      'Execução perfeita!',
    'general.rep_complete':      'Repetição completa!',
    'general.session_start':     'Vamos começar! Posicione-se na câmera.',
    'general.first_rep':         'Primeira rep! Vamos lá!',
    'general.milestone_reps':    '{reps} repetições! Continue assim!',
    'general.ten_reps':          'Incrível! {reps} repetições!',
    'general.not_visible':       'Posicione-se melhor na câmera.',
    'general.set_complete':      'Série {set} completa! Descanse {rest} segundos.',
    'general.next_set':          'Vamos para a série {set}!',
    'general.workout_complete':  'Treino completo! Parabéns!',
    'general.rest_skip':         'Partiu!',
    'squat.knees_over_toes':     'Joelhos ultrapassando os pés.',
    'squat.go_deeper':           'Desça mais! Abaixo de 90 graus.',
    'squat.keep_back_straight':  'Mantenha as costas retas.',
    'pushup.keep_body_straight': 'Corpo alinhado! Nem suba nem desça o quadril.',
    'pushup.go_lower':           'Desça mais! Cotovelos a 90 graus.',
    'pushup.align_elbows':       'Alinhe os cotovelos.',
    'plank.lower_hips':          'Abaixe o quadril.',
    'plank.raise_hips':          'Suba o quadril.',
    'plank.level_shoulders':     'Nivele os ombros.',
    'lunge.knee_over_toe':               'Joelho avançado demais.',
    'lunge.keep_torso_upright':          'Mantenha o tronco ereto.',
    'lunge.go_deeper':                   'Desça mais!',
    'glute_bridge.low_hips':             'Suba mais o quadril.',
    'glute_bridge.hip_asymmetry':        'Quadril desnivelado — alinhe os lados.',
    'glute_bridge.feet_too_wide':        'Feche os pés — largura do quadril.',
    'side_plank.hip_too_high':           'Abaixe um pouco o quadril.',
    'side_plank.hip_dropping':           'Suba o quadril — não deixe cair.',
    'side_plank.neck_dropped':           'Mantenha o pescoço alinhado.',
    'superman.hold_position':            'Levante braços e pernas do chão.',
    'superman.only_arms':                'Levante também as pernas.',
    'superman.head_too_high':            'Não force o pescoço para cima.',
    'mountain_climber.hip_too_high':     'Abaixe o quadril — não pike.',
    'mountain_climber.hip_sagging':      'Suba o quadril — mantenha prancha.',
    'burpee.arched_back':                'Mantenha o tronco reto na prancha.',
    'jump_squat.go_deeper':              'Desça mais antes de saltar.',
    'jump_squat.land_evenly':            'Pouse os dois pés juntos.',
    'sumo_squat.go_deeper':              'Desça mais! Abaixo de 90 graus.',
    'sumo_squat.widen_stance':           'Abra mais os pés.',
    'sumo_squat.knees_out':              'Empurre os joelhos para fora.',
    'donkey_kick.keep_hips_level':       'Mantenha o quadril nivelado.',
    'donkey_kick.kick_higher':           'Chute mais alto.',
    'fire_hydrant.keep_hips_level':      'Não rotacione o quadril.',
    'fire_hydrant.lift_higher':          'Levante mais a perna.',
    'hip_thrust.thrust_higher':          'Suba mais o quadril.',
    'hip_thrust.hip_asymmetry':          'Quadril desnivelado — alinhe os lados.',
    'wall_sit.adjust_knee_angle':        'Ajuste o ângulo dos joelhos — 90 graus.',
    'wall_sit.keep_back_straight':       'Mantenha as costas retas na parede.',
    'crunch.crunch_higher':              'Contraia mais — eleve os ombros.',
    'bicycle_crunch.lower_hips':         'Abaixe o quadril.',
    'bicycle_crunch.raise_hips':         'Suba o quadril.',
    'leg_raise.keep_back_flat':          'Mantenha a lombar no chão.',
    'russian_twist.maintain_lean':       'Mantenha o tronco inclinado a 45 graus.',
    'dead_bug.keep_back_flat':           'Pressione a lombar no chão.',
    'dead_bug.keep_hips_level':          'Mantenha o quadril nivelado.',
    'bird_dog.keep_hips_level':          'Não deixe o quadril rodar.',
    'bird_dog.keep_back_neutral':        'Mantenha as costas neutras.',
    'flutter_kick.keep_back_flat':       'Mantenha a lombar no chão.',
    'pike_pushup.raise_hips':            'Suba mais o quadril — posição V.',
    'pike_pushup.keep_body_straight':    'Alinhe o corpo durante a descida.',
    'diamond_pushup.keep_body_straight': 'Corpo alinhado — não suba o quadril.',
    'diamond_pushup.go_lower':           'Desça mais — cotovelos a 90 graus.',
    'diamond_pushup.bring_hands_together': 'Aproxime mais as mãos.',
    'wide_pushup.keep_body_straight':    'Corpo alinhado — não suba o quadril.',
    'wide_pushup.go_lower':              'Desça mais — cotovelos a 90 graus.',
    'wide_pushup.align_elbows':          'Alinhe os cotovelos.',
    'tricep_dip.dip_lower':              'Desça mais — cotovelos a 90 graus.',
    'tricep_dip.align_elbows':           'Alinhe os cotovelos.',
    'tricep_dip.keep_hips_close':        'Mantenha o quadril próximo ao banco.',
    'high_knees.stay_upright':           'Mantenha o tronco ereto.',
    'bear_crawl.lower_hips':             'Abaixe o quadril.',
    'bear_crawl.raise_hips':             'Suba o quadril.',
    'inchworm.keep_hips_aligned':        'Alinhe o quadril na prancha.',
    'inchworm.keep_legs_straight':       'Mantenha as pernas estendidas.',
  },
  en: {
    'general.perfect_form':      'Perfect form!',
    'general.rep_complete':      'Rep complete!',
    'general.session_start':     "Let's go! Position yourself in front of the camera.",
    'general.first_rep':         "First rep! Let's go!",
    'general.milestone_reps':    '{reps} reps! Keep it up!',
    'general.ten_reps':          'Amazing! {reps} reps!',
    'general.not_visible':       'Position yourself better in the camera.',
    'general.set_complete':      'Set {set} done! Rest for {rest} seconds.',
    'general.next_set':          "Let's go, set {set}!",
    'general.workout_complete':  'Workout complete! Well done!',
    'general.rest_skip':         "Let's go!",
    'squat.knees_over_toes':     'Knees past your toes.',
    'squat.go_deeper':           'Go deeper! Below 90 degrees.',
    'squat.keep_back_straight':  'Keep your back straight.',
    'pushup.keep_body_straight': 'Keep your body aligned.',
    'pushup.go_lower':           'Go lower! Elbows at 90 degrees.',
    'pushup.align_elbows':       'Align your elbows.',
    'plank.lower_hips':          'Lower your hips.',
    'plank.raise_hips':          'Raise your hips.',
    'plank.level_shoulders':     'Level your shoulders.',
    'lunge.knee_over_toe':               'Knee too far forward.',
    'lunge.keep_torso_upright':          'Keep your torso upright.',
    'lunge.go_deeper':                   'Go deeper!',
    'glute_bridge.low_hips':             'Push your hips higher.',
    'glute_bridge.hip_asymmetry':        'Uneven hips — align both sides.',
    'glute_bridge.feet_too_wide':        'Bring feet closer — hip width.',
    'side_plank.hip_too_high':           'Lower your hips slightly.',
    'side_plank.hip_dropping':           "Raise your hips — don't let them drop.",
    'side_plank.neck_dropped':           'Keep your neck aligned.',
    'superman.hold_position':            'Lift both arms and legs off the floor.',
    'superman.only_arms':                'Lift your legs too.',
    'superman.head_too_high':            "Don't force your neck back.",
    'mountain_climber.hip_too_high':     'Lower your hips — no piking.',
    'mountain_climber.hip_sagging':      'Raise your hips — keep plank form.',
    'burpee.arched_back':                'Keep your core tight in plank.',
    'jump_squat.go_deeper':              'Squat deeper before jumping.',
    'jump_squat.land_evenly':            'Land on both feet evenly.',
    'sumo_squat.go_deeper':              'Go deeper! Below 90 degrees.',
    'sumo_squat.widen_stance':           'Widen your stance.',
    'sumo_squat.knees_out':              'Push your knees out.',
    'donkey_kick.keep_hips_level':       'Keep your hips level.',
    'donkey_kick.kick_higher':           'Kick higher.',
    'fire_hydrant.keep_hips_level':      "Don't rotate your hips.",
    'fire_hydrant.lift_higher':          'Lift your leg higher.',
    'hip_thrust.thrust_higher':          'Push your hips higher.',
    'hip_thrust.hip_asymmetry':          'Uneven hips — align both sides.',
    'wall_sit.adjust_knee_angle':        'Adjust knee angle to 90 degrees.',
    'wall_sit.keep_back_straight':       'Keep your back flat against the wall.',
    'crunch.crunch_higher':              'Crunch higher — lift your shoulders.',
    'bicycle_crunch.lower_hips':         'Lower your hips.',
    'bicycle_crunch.raise_hips':         'Raise your hips.',
    'leg_raise.keep_back_flat':          'Keep your lower back pressed down.',
    'russian_twist.maintain_lean':       'Maintain a 45-degree lean.',
    'dead_bug.keep_back_flat':           'Press your lower back into the floor.',
    'dead_bug.keep_hips_level':          'Keep your hips level.',
    'bird_dog.keep_hips_level':          "Don't let your hips rotate.",
    'bird_dog.keep_back_neutral':        'Keep your back neutral.',
    'flutter_kick.keep_back_flat':       'Keep your lower back pressed down.',
    'pike_pushup.raise_hips':            'Raise your hips into a V shape.',
    'pike_pushup.keep_body_straight':    'Keep your body aligned on the way down.',
    'diamond_pushup.keep_body_straight': 'Keep your body aligned.',
    'diamond_pushup.go_lower':           'Go lower! Elbows at 90 degrees.',
    'diamond_pushup.bring_hands_together': 'Bring your hands closer together.',
    'wide_pushup.keep_body_straight':    'Keep your body aligned.',
    'wide_pushup.go_lower':              'Go lower! Elbows at 90 degrees.',
    'wide_pushup.align_elbows':          'Align your elbows.',
    'tricep_dip.dip_lower':              'Dip lower — elbows at 90 degrees.',
    'tricep_dip.align_elbows':           'Align your elbows.',
    'tricep_dip.keep_hips_close':        'Keep your hips close to the bench.',
    'high_knees.stay_upright':           'Stay upright — do not lean back.',
    'bear_crawl.lower_hips':             'Lower your hips.',
    'bear_crawl.raise_hips':             'Raise your hips.',
    'inchworm.keep_hips_aligned':        'Keep your hips aligned in plank.',
    'inchworm.keep_legs_straight':       'Keep your legs straight.',
  },
  es: {
    'general.perfect_form':      '¡Forma perfecta!',
    'general.rep_complete':      '¡Repetición completa!',
    'general.session_start':     '¡Vamos! Colócate frente a la cámara.',
    'general.first_rep':         '¡Primera rep! ¡Vamos!',
    'general.milestone_reps':    '¡{reps} repeticiones! ¡Sigue así!',
    'general.ten_reps':          '¡Increíble! ¡{reps} repeticiones!',
    'general.not_visible':       'Colócate mejor frente a la cámara.',
    'general.set_complete':      '¡Serie {set} completada! Descansa {rest} segundos.',
    'general.next_set':          '¡Vamos a la serie {set}!',
    'general.workout_complete':  '¡Entrenamiento completo! ¡Felicidades!',
    'general.rest_skip':         '¡Vamos!',
    'squat.knees_over_toes':     'Rodillas pasando los pies.',
    'squat.go_deeper':           '¡Baja más! Menos de 90 grados.',
    'squat.keep_back_straight':  'Mantén la espalda recta.',
    'pushup.keep_body_straight': 'Mantén el cuerpo alineado.',
    'pushup.go_lower':           '¡Baja más! Codos a 90 grados.',
    'pushup.align_elbows':       'Alinea los codos.',
    'plank.lower_hips':          'Baja las caderas.',
    'plank.raise_hips':          'Sube las caderas.',
    'plank.level_shoulders':     'Nivela los hombros.',
    'lunge.knee_over_toe':               'Rodilla demasiado adelantada.',
    'lunge.keep_torso_upright':          'Mantén el torso erguido.',
    'lunge.go_deeper':                   '¡Baja más!',
    'glute_bridge.low_hips':             'Sube más las caderas.',
    'glute_bridge.hip_asymmetry':        'Caderas desniveladas — alinea los lados.',
    'glute_bridge.feet_too_wide':        'Cierra los pies — ancho de caderas.',
    'side_plank.hip_too_high':           'Baja un poco las caderas.',
    'side_plank.hip_dropping':           'Sube las caderas — no las dejes caer.',
    'side_plank.neck_dropped':           'Mantén el cuello alineado.',
    'superman.hold_position':            'Levanta brazos y piernas del suelo.',
    'superman.only_arms':                'Levanta también las piernas.',
    'superman.head_too_high':            'No fuerces el cuello hacia atrás.',
    'mountain_climber.hip_too_high':     'Baja las caderas — sin pike.',
    'mountain_climber.hip_sagging':      'Sube las caderas — mantén la plancha.',
    'burpee.arched_back':                'Mantén el core apretado en la plancha.',
    'jump_squat.go_deeper':              'Baja más antes de saltar.',
    'jump_squat.land_evenly':            'Aterriza con los dos pies al mismo tiempo.',
    'sumo_squat.go_deeper':              '¡Baja más! Menos de 90 grados.',
    'sumo_squat.widen_stance':           'Abre más los pies.',
    'sumo_squat.knees_out':              'Empuja las rodillas hacia afuera.',
    'donkey_kick.keep_hips_level':       'Mantén las caderas niveladas.',
    'donkey_kick.kick_higher':           'Patea más alto.',
    'fire_hydrant.keep_hips_level':      'No rotas las caderas.',
    'fire_hydrant.lift_higher':          'Levanta más la pierna.',
    'hip_thrust.thrust_higher':          'Sube más las caderas.',
    'hip_thrust.hip_asymmetry':          'Caderas desniveladas — alinea los lados.',
    'wall_sit.adjust_knee_angle':        'Ajusta el ángulo de las rodillas a 90 grados.',
    'wall_sit.keep_back_straight':       'Mantén la espalda recta contra la pared.',
    'crunch.crunch_higher':              'Contrae más — eleva los hombros.',
    'bicycle_crunch.lower_hips':         'Baja las caderas.',
    'bicycle_crunch.raise_hips':         'Sube las caderas.',
    'leg_raise.keep_back_flat':          'Mantén la zona lumbar pegada al suelo.',
    'russian_twist.maintain_lean':       'Mantén el torso inclinado a 45 grados.',
    'dead_bug.keep_back_flat':           'Presiona la zona lumbar contra el suelo.',
    'dead_bug.keep_hips_level':          'Mantén las caderas niveladas.',
    'bird_dog.keep_hips_level':          'No dejes que las caderas roten.',
    'bird_dog.keep_back_neutral':        'Mantén la espalda neutral.',
    'flutter_kick.keep_back_flat':       'Mantén la zona lumbar pegada al suelo.',
    'pike_pushup.raise_hips':            'Sube las caderas en forma de V.',
    'pike_pushup.keep_body_straight':    'Mantén el cuerpo alineado al bajar.',
    'diamond_pushup.keep_body_straight': 'Mantén el cuerpo alineado.',
    'diamond_pushup.go_lower':           '¡Baja más! Codos a 90 grados.',
    'diamond_pushup.bring_hands_together': 'Junta más las manos.',
    'wide_pushup.keep_body_straight':    'Mantén el cuerpo alineado.',
    'wide_pushup.go_lower':              '¡Baja más! Codos a 90 grados.',
    'wide_pushup.align_elbows':          'Alinea los codos.',
    'tricep_dip.dip_lower':              'Baja más — codos a 90 grados.',
    'tricep_dip.align_elbows':           'Alinea los codos.',
    'tricep_dip.keep_hips_close':        'Mantén las caderas cerca del banco.',
    'high_knees.stay_upright':           'Mantén el torso erguido.',
    'bear_crawl.lower_hips':             'Baja las caderas.',
    'bear_crawl.raise_hips':             'Sube las caderas.',
    'inchworm.keep_hips_aligned':        'Alinea las caderas en la plancha.',
    'inchworm.keep_legs_straight':       'Mantén las piernas estiradas.',
  },
  fr: {
    'general.perfect_form':      'Forme parfaite !',
    'general.rep_complete':      'Répétition complète !',
    'general.session_start':     "C'est parti ! Positionnez-vous devant la caméra.",
    'general.first_rep':         'Première rép ! Allez !',
    'general.milestone_reps':    '{reps} répétitions ! Continuez !',
    'general.ten_reps':          'Incroyable ! {reps} répétitions !',
    'general.not_visible':       'Positionnez-vous mieux face à la caméra.',
    'general.set_complete':      'Série {set} terminée ! Reposez-vous {rest} secondes.',
    'general.next_set':          'En route pour la série {set} !',
    'general.workout_complete':  'Entraînement terminé ! Félicitations !',
    'general.rest_skip':         'Allons-y !',
    'squat.knees_over_toes':     'Genoux au-delà des pieds.',
    'squat.go_deeper':           'Descendez plus ! Moins de 90 degrés.',
    'squat.keep_back_straight':  'Gardez le dos droit.',
    'pushup.keep_body_straight': 'Gardez le corps aligné.',
    'pushup.go_lower':           'Descendez plus ! Coudes à 90 degrés.',
    'pushup.align_elbows':       'Alignez les coudes.',
    'plank.lower_hips':          'Abaissez les hanches.',
    'plank.raise_hips':          'Levez les hanches.',
    'plank.level_shoulders':     'Nivélez les épaules.',
    'lunge.knee_over_toe':               'Genou trop en avant.',
    'lunge.keep_torso_upright':          'Gardez le torse droit.',
    'lunge.go_deeper':                   'Descendez plus !',
    'glute_bridge.low_hips':             'Poussez les hanches plus haut.',
    'glute_bridge.hip_asymmetry':        'Hanches inégales — alignez les deux côtés.',
    'glute_bridge.feet_too_wide':        'Rapprochez les pieds — largeur des hanches.',
    'side_plank.hip_too_high':           'Abaissez légèrement les hanches.',
    'side_plank.hip_dropping':           'Levez les hanches — ne les laissez pas tomber.',
    'side_plank.neck_dropped':           'Gardez le cou aligné.',
    'superman.hold_position':            'Levez les bras et les jambes du sol.',
    'superman.only_arms':                'Levez aussi les jambes.',
    'superman.head_too_high':            'Ne forcez pas le cou en arrière.',
    'mountain_climber.hip_too_high':     'Abaissez les hanches — pas de pic.',
    'mountain_climber.hip_sagging':      'Levez les hanches — maintenez la planche.',
    'burpee.arched_back':                'Gardez le corps droit en planche.',
    'jump_squat.go_deeper':              'Descendez plus avant de sauter.',
    'jump_squat.land_evenly':            'Atterrissez sur les deux pieds.',
    'sumo_squat.go_deeper':              'Descendez plus ! Moins de 90 degrés.',
    'sumo_squat.widen_stance':           'Écartez davantage les pieds.',
    'sumo_squat.knees_out':              'Poussez les genoux vers lextérieur.',
    'donkey_kick.keep_hips_level':       'Gardez les hanches de niveau.',
    'donkey_kick.kick_higher':           'Montez la jambe plus haut.',
    'fire_hydrant.keep_hips_level':      'Ne faites pas pivoter les hanches.',
    'fire_hydrant.lift_higher':          'Levez la jambe plus haut.',
    'hip_thrust.thrust_higher':          'Poussez les hanches plus haut.',
    'hip_thrust.hip_asymmetry':          'Hanches inégales — alignez les deux côtés.',
    'wall_sit.adjust_knee_angle':        'Ajustez langle des genoux à 90 degrés.',
    'wall_sit.keep_back_straight':       'Gardez le dos droit contre le mur.',
    'crunch.crunch_higher':              'Contractez plus — soulevez les épaules.',
    'bicycle_crunch.lower_hips':         'Abaissez les hanches.',
    'bicycle_crunch.raise_hips':         'Levez les hanches.',
    'leg_raise.keep_back_flat':          'Gardez le bas du dos plaqué au sol.',
    'russian_twist.maintain_lean':       'Maintenez une inclinaison de 45 degrés.',
    'dead_bug.keep_back_flat':           'Plaque le bas du dos au sol.',
    'dead_bug.keep_hips_level':          'Gardez les hanches de niveau.',
    'bird_dog.keep_hips_level':          'Ne laissez pas les hanches pivoter.',
    'bird_dog.keep_back_neutral':        'Gardez le dos neutre.',
    'flutter_kick.keep_back_flat':       'Gardez le bas du dos plaqué au sol.',
    'pike_pushup.raise_hips':            'Levez les hanches en forme de V.',
    'pike_pushup.keep_body_straight':    'Gardez le corps aligné à la descente.',
    'diamond_pushup.keep_body_straight': 'Gardez le corps aligné.',
    'diamond_pushup.go_lower':           'Descendez plus ! Coudes à 90 degrés.',
    'diamond_pushup.bring_hands_together': 'Rapprochez les mains.',
    'wide_pushup.keep_body_straight':    'Gardez le corps aligné.',
    'wide_pushup.go_lower':              'Descendez plus ! Coudes à 90 degrés.',
    'wide_pushup.align_elbows':          'Alignez les coudes.',
    'tricep_dip.dip_lower':              'Descendez plus — coudes à 90 degrés.',
    'tricep_dip.align_elbows':           'Alignez les coudes.',
    'tricep_dip.keep_hips_close':        'Gardez les hanches près du banc.',
    'high_knees.stay_upright':           'Restez droit — ne vous penchez pas.',
    'bear_crawl.lower_hips':             'Abaissez les hanches.',
    'bear_crawl.raise_hips':             'Levez les hanches.',
    'inchworm.keep_hips_aligned':        'Alignez les hanches en planche.',
    'inchworm.keep_legs_straight':       'Gardez les jambes tendues.',
  },
};

function getFeedbackText(key: string, locale: string): string {
  return FEEDBACK_TEXTS[locale]?.[key] ?? FEEDBACK_TEXTS.pt[key] ?? key;
}
