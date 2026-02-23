'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import CameraFeed from '@/components/camera/CameraFeed';
import PoseOverlay from '@/components/camera/PoseOverlay';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { useVoiceCoach } from '@/hooks/useVoiceCoach';
import { useSession } from '@/hooks/useSession';
import { computeJointAngles } from '@/lib/angles/joints';
import { analyzeSquat, analyzePushup, analyzePlank, analyzeLunge } from '@/lib/rules';
import type { ErrorTracker } from '@/lib/rules';
import type { SquatPhase } from '@/lib/rules/squat';
import type { PushupPhase } from '@/lib/rules/pushup';
import type { LungePhase } from '@/lib/rules/lunge';
import {
  createSession,
  finishSession,
  getExerciseBySlug,
} from '@/lib/supabase/queries';

// ── Tipos ────────────────────────────────────────────────────────────────────

type ExerciseSlug = 'squat' | 'pushup' | 'plank' | 'lunge';

interface SessionStats {
  totalReps: number;
  goodReps: number;
  badReps: number;
  scores: number[];
}

// ── Constantes ───────────────────────────────────────────────────────────────

const EXERCISES: { slug: ExerciseSlug; label: string; icon: string }[] = [
  { slug: 'squat',  label: 'Agachamento', icon: '🦵' },
  { slug: 'pushup', label: 'Flexão',      icon: '💪' },
  { slug: 'plank',  label: 'Prancha',     icon: '🏋️' },
  { slug: 'lunge',  label: 'Afundo',      icon: '🚶' },
];

const VIDEO_W = 640;
const VIDEO_H = 480;

// ── Componente principal ──────────────────────────────────────────────────────

export default function AnalyzePage() {
  const { user, profile } = useSession();
  const { landmarks, isReady, error: poseError, startDetection, stopDetection } = usePoseDetection();
  const { speak, isSpeaking } = useVoiceCoach({ locale: profile?.locale ?? 'pt', enabled: true });

  // Estado da sessão
  const [selectedExercise, setSelectedExercise] = useState<ExerciseSlug>('squat');
  const [isRunning, setIsRunning]               = useState(false);
  const [score, setScore]                       = useState(100);
  const [stats, setStats]                       = useState<SessionStats>({ totalReps: 0, goodReps: 0, badReps: 0, scores: [] });
  const [elapsed, setElapsed]                   = useState(0);
  const [feedback, setFeedback]                 = useState<string[]>([]);
  const [sessionId, setSessionId]               = useState<string | null>(null);

  // Refs para fases e rastreadores de erro (estáveis entre renders)
  const phaseRef        = useRef<SquatPhase | PushupPhase | LungePhase>('up');
  const statsRef        = useRef<SessionStats>({ totalReps: 0, goodReps: 0, badReps: 0, scores: [] });
  const errorTrackerRef = useRef<ErrorTracker>({});
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const plankStart      = useRef<number>(0);

  // Limpa o errorTracker ao trocar de exercício
  useEffect(() => {
    errorTrackerRef.current = {};
  }, [selectedExercise]);

  // ── Análise frame a frame ─────────────────────────────────────────────────

  useEffect(() => {
    if (!isRunning || !landmarks) return;

    const angles  = computeJointAngles(landmarks);
    const locale  = profile?.locale ?? 'pt';
    const tracker = errorTrackerRef.current;

    const speakFeedback = (keys: string[]) => {
      const key = keys[0];
      if (!key) return;
      const text = getFeedbackText(key, locale);
      if (text) speak(text, key.startsWith('general.') ? 'high' : 'low');
    };

    if (selectedExercise === 'squat') {
      const result = analyzeSquat(angles, landmarks, phaseRef.current as SquatPhase, tracker);
      phaseRef.current = result.phase;
      setScore(result.score);
      setFeedback(result.feedback);

      if (result.repComplete) {
        const isGood = result.score >= 70;
        statsRef.current = {
          totalReps: statsRef.current.totalReps + 1,
          goodReps:  statsRef.current.goodReps  + (isGood ? 1 : 0),
          badReps:   statsRef.current.badReps   + (isGood ? 0 : 1),
          scores:    [...statsRef.current.scores, result.score],
        };
        setStats({ ...statsRef.current });
      }
      speakFeedback(result.feedback);
    }

    if (selectedExercise === 'pushup') {
      const result = analyzePushup(angles, landmarks, phaseRef.current as PushupPhase, tracker);
      phaseRef.current = result.phase;
      setScore(result.score);
      setFeedback(result.feedback);

      if (result.repComplete) {
        const isGood = result.score >= 70;
        statsRef.current = {
          totalReps: statsRef.current.totalReps + 1,
          goodReps:  statsRef.current.goodReps  + (isGood ? 1 : 0),
          badReps:   statsRef.current.badReps   + (isGood ? 0 : 1),
          scores:    [...statsRef.current.scores, result.score],
        };
        setStats({ ...statsRef.current });
      }
      speakFeedback(result.feedback);
    }

    if (selectedExercise === 'plank') {
      const held   = (Date.now() - plankStart.current) / 1000;
      const result = analyzePlank(angles, landmarks, held, tracker);
      setScore(result.score);
      setFeedback(result.feedback);
      speakFeedback(result.feedback);
    }

    if (selectedExercise === 'lunge') {
      const result = analyzeLunge(angles, landmarks, phaseRef.current as LungePhase, tracker);
      phaseRef.current = result.phase;
      setScore(result.score);
      setFeedback(result.feedback);

      if (result.repComplete) {
        const isGood = result.score >= 70;
        statsRef.current = {
          totalReps: statsRef.current.totalReps + 1,
          goodReps:  statsRef.current.goodReps  + (isGood ? 1 : 0),
          badReps:   statsRef.current.badReps   + (isGood ? 0 : 1),
          scores:    [...statsRef.current.scores, result.score],
        };
        setStats({ ...statsRef.current });
      }
      speakFeedback(result.feedback);
    }
  }, [landmarks, isRunning, selectedExercise, speak, profile?.locale]);

  // ── Timer ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCameraReady = useCallback(
    (video: HTMLVideoElement) => {
      if (isReady) startDetection(video);
    },
    [isReady, startDetection]
  );

  const handleStart = useCallback(async () => {
    phaseRef.current        = 'up';
    statsRef.current        = { totalReps: 0, goodReps: 0, badReps: 0, scores: [] };
    errorTrackerRef.current = {};
    setStats({ totalReps: 0, goodReps: 0, badReps: 0, scores: [] });
    setElapsed(0);
    setScore(100);
    setFeedback([]);
    plankStart.current = Date.now();

    if (user) {
      const exercise = await getExerciseBySlug(selectedExercise);
      if (exercise) {
        const id = await createSession(user.id, exercise.id, navigator.userAgent);
        setSessionId(id);
      }
    }

    setIsRunning(true);
    speak('Vamos começar! Posicione-se na câmera.', 'high');
  }, [user, selectedExercise, speak]);

  const handleStop = useCallback(async () => {
    setIsRunning(false);
    stopDetection();

    if (sessionId && statsRef.current.totalReps > 0) {
      const avg = statsRef.current.scores.length > 0
        ? statsRef.current.scores.reduce((a, b) => a + b, 0) / statsRef.current.scores.length
        : 0;

      await finishSession(sessionId, {
        total_reps:    statsRef.current.totalReps,
        good_reps:     statsRef.current.goodReps,
        bad_reps:      statsRef.current.badReps,
        avg_score:     Math.round(avg * 100) / 100,
        feedback_json: { feedbackKeys: feedback },
      });
    }
    setSessionId(null);
  }, [sessionId, feedback, stopDetection]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const scoreColor = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  const avgScore   = stats.scores.length > 0
    ? Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length)
    : 0;

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Apenas chaves de erro (não positivas) aparecem na sobreposição visual
  const errorFeedback = feedback.filter(k => !k.startsWith('general.'));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">FormFit AI</h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          {isSpeaking && <span className="animate-pulse">🔊</span>}
          {profile?.plan && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-xs font-medium uppercase">
              {profile.plan}
            </span>
          )}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 gap-4 p-4">
        {/* Câmera + Overlay */}
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-gray-900 flex items-center justify-center min-h-[360px]">
          <CameraFeed
            onReady={handleCameraReady}
            className="w-full h-full"
          />
          <PoseOverlay
            landmarks={landmarks}
            width={VIDEO_W}
            height={VIDEO_H}
            score={score}
          />

          {/* Score badge */}
          {isRunning && (
            <div className={`absolute top-4 left-4 text-4xl font-black ${scoreColor}`}>
              {score}
              <span className="text-base font-normal text-gray-400 ml-1">pts</span>
            </div>
          )}

          {/* Estado do detector */}
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-300 text-sm">Carregando MediaPipe…</p>
              </div>
            </div>
          )}

          {poseError && (
            <div className="absolute bottom-4 left-4 right-4 bg-red-900/80 rounded-lg px-3 py-2 text-sm text-red-200">
              {poseError}
            </div>
          )}

          {/* Feedback de erros em tempo real (não cobre o botão do esqueleto) */}
          {isRunning && errorFeedback.length > 0 && (
            <div className="absolute bottom-4 left-4 right-16 space-y-1">
              {errorFeedback.slice(0, 2).map(key => (
                <div key={key} className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-yellow-300">
                  ⚠ {getFeedbackText(key, profile?.locale ?? 'pt')}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Painel lateral */}
        <aside className="w-full lg:w-72 flex flex-col gap-4">
          {/* Seleção de exercício */}
          <div className="bg-gray-900 rounded-2xl p-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Exercício
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {EXERCISES.map(ex => (
                <button
                  key={ex.slug}
                  disabled={isRunning}
                  onClick={() => setSelectedExercise(ex.slug)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl text-sm font-medium transition-all
                    ${selectedExercise === ex.slug
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="text-xl">{ex.icon}</span>
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estatísticas da sessão */}
          <div className="bg-gray-900 rounded-2xl p-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Sessão
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Tempo"       value={formatTime(elapsed)} />
              <Stat label="Reps"        value={String(stats.totalReps)} />
              <Stat label="Boas"        value={String(stats.goodReps)}  color="text-green-400" />
              <Stat label="Corrigir"    value={String(stats.badReps)}   color="text-red-400" />
              <Stat label="Pontuação"   value={isRunning ? String(score) : String(avgScore)} className="col-span-2" />
            </div>
          </div>

          {/* Botão start/stop */}
          <button
            onClick={isRunning ? handleStop : handleStart}
            disabled={!isReady}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-95
              ${isRunning
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }
              disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isRunning ? '⏹ Parar sessão' : '▶ Iniciar sessão'}
          </button>

          {!user && (
            <p className="text-center text-xs text-gray-500">
              Faça login para salvar seu histórico.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  color = 'text-white',
  className = '',
}: {
  label: string;
  value: string;
  color?: string;
  className?: string;
}) {
  return (
    <div className={`bg-gray-800 rounded-xl p-3 ${className}`}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ── Mapa de feedback → texto ──────────────────────────────────────────────────

const FEEDBACK_TEXTS: Record<string, Record<string, string>> = {
  pt: {
    'general.perfect_form':      'Execução perfeita!',
    'general.rep_complete':      'Repetição completa!',
    'squat.knees_over_toes':     'Joelhos ultrapassando os pés.',
    'squat.go_deeper':           'Desça mais! Abaixo de 90 graus.',
    'squat.keep_back_straight':  'Mantenha as costas retas.',
    'pushup.keep_body_straight': 'Corpo alinhado! Nem suba nem desça o quadril.',
    'pushup.go_lower':           'Desça mais! Cotovelos a 90 graus.',
    'pushup.align_elbows':       'Alinhe os cotovelos.',
    'plank.lower_hips':          'Abaixe o quadril.',
    'plank.raise_hips':          'Suba o quadril.',
    'plank.level_shoulders':     'Nivele os ombros.',
    'lunge.knee_over_toe':       'Joelho avançado demais.',
    'lunge.keep_torso_upright':  'Mantenha o tronco ereto.',
    'lunge.go_deeper':           'Desça mais!',
  },
  en: {
    'general.perfect_form':      'Perfect form!',
    'general.rep_complete':      'Rep complete!',
    'squat.knees_over_toes':     'Knees past your toes.',
    'squat.go_deeper':           'Go deeper! Below 90 degrees.',
    'squat.keep_back_straight':  'Keep your back straight.',
    'pushup.keep_body_straight': 'Keep your body aligned.',
    'pushup.go_lower':           'Go lower! Elbows at 90 degrees.',
    'pushup.align_elbows':       'Align your elbows.',
    'plank.lower_hips':          'Lower your hips.',
    'plank.raise_hips':          'Raise your hips.',
    'plank.level_shoulders':     'Level your shoulders.',
    'lunge.knee_over_toe':       'Knee too far forward.',
    'lunge.keep_torso_upright':  'Keep your torso upright.',
    'lunge.go_deeper':           'Go deeper!',
  },
};

function getFeedbackText(key: string, locale: string): string {
  return FEEDBACK_TEXTS[locale]?.[key] ?? FEEDBACK_TEXTS.pt[key] ?? key;
}
