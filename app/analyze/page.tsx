'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import CameraFeed from '@/components/camera/CameraFeed';
import PoseOverlay from '@/components/camera/PoseOverlay';
import SessionResultModal from '@/components/gamification/SessionResultModal';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { useVoiceCoach } from '@/hooks/useVoiceCoach';
import { useSession } from '@/hooks/useSession';
import { usePlan, FREE_MONTHLY_LIMIT } from '@/hooks/usePlan';
import { useGamification } from '@/hooks/useGamification';
import { redirectToCheckout } from '@/lib/perfectpay';
import type { GamificationResult } from '@/types/gamification';
import { computeJointAngles } from '@/lib/angles/joints';
import {
  analyzeSquat, analyzePushup, analyzePlank, analyzeLunge,
  analyzeGluteBridge, analyzeSidePlank, analyzeSuperman,
  analyzeMountainClimber, analyzeBurpee,
} from '@/lib/rules';
import type { ErrorTracker } from '@/lib/rules';
import type { SquatPhase } from '@/lib/rules/squat';
import type { PushupPhase } from '@/lib/rules/pushup';
import type { LungePhase } from '@/lib/rules/lunge';
import type { GluteBridgePhase } from '@/lib/rules/glute_bridge';
import type { MountainClimberPhase } from '@/lib/rules/mountain_climber';
import type { BurpeePhase } from '@/lib/rules/burpee';
import {
  createSession,
  finishSession,
  getExerciseBySlug,
} from '@/lib/supabase/queries';

// ── Tipos ────────────────────────────────────────────────────────────────────

type ExerciseSlug =
  | 'squat' | 'pushup' | 'plank' | 'lunge'
  | 'glute_bridge' | 'side_plank' | 'superman'
  | 'mountain_climber' | 'burpee';

interface SessionStats {
  totalReps: number;
  goodReps: number;
  badReps: number;
  scores: number[];
}

// ── Constantes ───────────────────────────────────────────────────────────────

const EXERCISES: { slug: ExerciseSlug; label: string; icon: string; group: 'gym' | 'home' }[] = [
  { slug: 'squat',           label: 'Agachamento',    icon: '🦵', group: 'gym'  },
  { slug: 'pushup',          label: 'Flexão',         icon: '💪', group: 'gym'  },
  { slug: 'plank',           label: 'Prancha',        icon: '🏋️', group: 'gym'  },
  { slug: 'lunge',           label: 'Afundo',         icon: '🚶', group: 'gym'  },
  { slug: 'glute_bridge',    label: 'Elev. Quadril',  icon: '🍑', group: 'home' },
  { slug: 'side_plank',      label: 'Prancha Lat.',   icon: '⬛', group: 'home' },
  { slug: 'superman',        label: 'Superman',       icon: '🦸', group: 'home' },
  { slug: 'mountain_climber',label: 'Escalada',       icon: '🏔️', group: 'home' },
  { slug: 'burpee',          label: 'Burpee',         icon: '💥', group: 'home' },
];

const VIDEO_W = 640;
const VIDEO_H = 480;

// ── Componente principal ──────────────────────────────────────────────────────

export default function AnalyzePage() {
  const { user, profile, signOut } = useSession();
  const { landmarks, isReady, error: poseError, startDetection, stopDetection } = usePoseDetection();
  const { speak, isSpeaking } = useVoiceCoach({ locale: profile?.locale ?? 'pt', enabled: true });
  const { plan, canAnalyze, monthlyCount, loading: planLoading } = usePlan();
  const { triggerGamification } = useGamification();

  // Estado da sessão
  const [selectedExercise, setSelectedExercise] = useState<ExerciseSlug>('squat');
  const [isRunning, setIsRunning]               = useState(false);
  const [score, setScore]                       = useState(100);
  const [stats, setStats]                       = useState<SessionStats>({ totalReps: 0, goodReps: 0, badReps: 0, scores: [] });
  const [elapsed, setElapsed]                   = useState(0);
  const [feedback, setFeedback]                 = useState<string[]>([]);
  const [sessionId, setSessionId]               = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton]         = useState(false);
  const [gamificationResult, setGamificationResult] = useState<GamificationResult | null>(null);

  // Refs para fases e rastreadores de erro (estáveis entre renders)
  const phaseRef        = useRef<SquatPhase | PushupPhase | LungePhase | GluteBridgePhase | MountainClimberPhase | BurpeePhase>('up');
  const statsRef        = useRef<SessionStats>({ totalReps: 0, goodReps: 0, badReps: 0, scores: [] });
  const errorTrackerRef = useRef<ErrorTracker>({});
  const timerRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const plankStart         = useRef<number>(0);
  const sessionStartHourRef = useRef<number>(0);

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

    if (selectedExercise === 'glute_bridge') {
      const result = analyzeGluteBridge(angles, landmarks, phaseRef.current as GluteBridgePhase, tracker);
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

    if (selectedExercise === 'side_plank') {
      const held   = (Date.now() - plankStart.current) / 1000;
      const result = analyzeSidePlank(angles, landmarks, held, tracker);
      setScore(result.score);
      setFeedback(result.feedback);
      speakFeedback(result.feedback);
    }

    if (selectedExercise === 'superman') {
      const held   = (Date.now() - plankStart.current) / 1000;
      const result = analyzeSuperman(angles, landmarks, held, tracker);
      setScore(result.score);
      setFeedback(result.feedback);
      speakFeedback(result.feedback);
    }

    if (selectedExercise === 'mountain_climber') {
      const result = analyzeMountainClimber(angles, landmarks, phaseRef.current as MountainClimberPhase, tracker);
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

    if (selectedExercise === 'burpee') {
      const result = analyzeBurpee(angles, landmarks, phaseRef.current as BurpeePhase, tracker);
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
    if (!canAnalyze) return;
    phaseRef.current        = 'up';
    statsRef.current        = { totalReps: 0, goodReps: 0, badReps: 0, scores: [] };
    errorTrackerRef.current = {};
    setStats({ totalReps: 0, goodReps: 0, badReps: 0, scores: [] });
    setElapsed(0);
    setScore(100);
    setFeedback([]);
    plankStart.current = Date.now();
    sessionStartHourRef.current = new Date().getHours();

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
      const avgScore = Math.round(avg * 100) / 100;

      // ── Salva sessão (lógica existente, inalterada) ───────────────────────
      await finishSession(sessionId, {
        total_reps:    statsRef.current.totalReps,
        good_reps:     statsRef.current.goodReps,
        bad_reps:      statsRef.current.badReps,
        avg_score:     avgScore,
        feedback_json: { feedbackKeys: feedback },
      });

      // ── Gamificação (isolada — falha nunca cancela o save) ────────────────
      if (user) {
        try {
          const result = await triggerGamification({
            userId:      user.id,
            exerciseSlug: selectedExercise,
            totalReps:   statsRef.current.totalReps,
            goodReps:    statsRef.current.goodReps,
            avgScore,
            sessionHour: sessionStartHourRef.current,
          });
          if (result) setGamificationResult(result);
        } catch (err) {
          console.error('[handleStop] Gamification error (non-fatal):', err);
        }
      }
    }

    setSessionId(null);
  }, [sessionId, feedback, stopDetection, user, selectedExercise, triggerGamification]);

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
          {plan !== 'free' && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-xs font-medium uppercase">
              {plan}
            </span>
          )}
          {!planLoading && plan === 'free' && (
            <a href="/pricing" className="text-xs text-gray-500 hover:text-indigo-400 transition-colors">
              {monthlyCount}/{FREE_MONTHLY_LIMIT} análises
            </a>
          )}
          {!user ? (
            <a
              href="/login"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
            >
              Entrar
            </a>
          ) : (
            <button
              onClick={signOut}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Sair
            </button>
          )}
        </div>
      </header>

      {/* pb-20 no mobile reserva espaço para o botão fixed do esqueleto (bottom-6) */}
      <div className="flex flex-col lg:flex-row flex-1 gap-4 p-4 pb-20 lg:pb-4">
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
            showSkeleton={showSkeleton}
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

          {/* Modal de upgrade — plano free esgotou análises do mês */}
          {!planLoading && !canAnalyze && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm">
              <div className="bg-gray-900 rounded-2xl p-6 max-w-xs mx-4 text-center shadow-2xl">
                <p className="text-3xl mb-3">🔒</p>
                <h3 className="text-lg font-bold mb-2">Limite atingido</h3>
                <p className="text-gray-400 text-sm mb-5">
                  Você usou <span className="text-white font-semibold">{monthlyCount}/{FREE_MONTHLY_LIMIT}</span> análises
                  gratuitas este mês. Faça upgrade para continuar.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => user && redirectToCheckout('pro_mensal', user.id)}
                    disabled={!user}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
                  >
                    Pro — R$ 29,90/mês
                  </button>
                  <a
                    href="/pricing"
                    className="text-sm text-gray-400 hover:text-white transition-colors py-2"
                  >
                    Ver todos os planos →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Modal de resultado pós-sessão com XP, badges e streak */}
          {gamificationResult && !isRunning && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm overflow-y-auto">
              <SessionResultModal
                result={gamificationResult}
                onClose={() => setGamificationResult(null)}
              />
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

            {/* Academia */}
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">🏋️ Academia</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {EXERCISES.filter(e => e.group === 'gym').map(ex => (
                <ExerciseButton
                  key={ex.slug}
                  ex={ex}
                  selected={selectedExercise === ex.slug}
                  disabled={isRunning}
                  onClick={() => setSelectedExercise(ex.slug)}
                />
              ))}
            </div>

            {/* Casa */}
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">🏠 Em casa</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {EXERCISES.filter(e => e.group === 'home').map(ex => (
                <ExerciseButton
                  key={ex.slug}
                  ex={ex}
                  selected={selectedExercise === ex.slug}
                  disabled={isRunning}
                  onClick={() => setSelectedExercise(ex.slug)}
                />
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

          {/* Botão start/stop ou upgrade */}
          {!planLoading && !canAnalyze ? (
            <a
              href="/pricing"
              className="w-full py-4 rounded-2xl font-bold text-lg text-center transition-all active:scale-95 bg-yellow-500 hover:bg-yellow-400 text-gray-900 block"
            >
              🔒 Ver planos
            </a>
          ) : (
            <button
              onClick={isRunning ? handleStop : handleStart}
              disabled={!isReady || planLoading}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-95
                ${isRunning
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }
                disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isRunning ? '⏹ Parar sessão' : '▶ Iniciar sessão'}
            </button>
          )}

          {!user && (
            <p className="text-center text-xs text-gray-500">
              Faça login para salvar seu histórico.
            </p>
          )}
        </aside>
      </div>

      {/* Botão esqueleto — fixed no viewport, z-[9999], independente de qualquer filho */}
      <button
        onClick={() => setShowSkeleton(v => !v)}
        title={showSkeleton ? 'Ocultar esqueleto' : 'Mostrar esqueleto'}
        className={`fixed bottom-6 right-4 z-[9999]
          min-w-[48px] min-h-[48px] px-4 py-3
          rounded-xl text-sm font-semibold
          shadow-lg backdrop-blur-sm transition-all
          flex items-center justify-center gap-1
          ${showSkeleton
            ? 'bg-green-600/90 text-white'
            : 'bg-gray-900/90 text-gray-300 hover:text-white hover:bg-gray-700/90'
          }`}
      >
        🦴 {showSkeleton ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function ExerciseButton({
  ex,
  selected,
  disabled,
  onClick,
}: {
  ex: { slug: string; label: string; icon: string };
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-3 rounded-xl text-sm font-medium transition-all
        ${selected
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }
        disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span className="text-xl">{ex.icon}</span>
      <span className="text-xs leading-tight text-center">{ex.label}</span>
    </button>
  );
}

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
    'lunge.knee_over_toe':               'Knee too far forward.',
    'lunge.keep_torso_upright':          'Keep your torso upright.',
    'lunge.go_deeper':                   'Go deeper!',
    'glute_bridge.low_hips':             'Push your hips higher.',
    'glute_bridge.hip_asymmetry':        'Uneven hips — align both sides.',
    'glute_bridge.feet_too_wide':        'Bring feet closer — hip width.',
    'side_plank.hip_too_high':           'Lower your hips slightly.',
    'side_plank.hip_dropping':           'Raise your hips — don\'t let them drop.',
    'side_plank.neck_dropped':           'Keep your neck aligned.',
    'superman.hold_position':            'Lift both arms and legs off the floor.',
    'superman.only_arms':                'Lift your legs too.',
    'superman.head_too_high':            'Don\'t force your neck back.',
    'mountain_climber.hip_too_high':     'Lower your hips — no piking.',
    'mountain_climber.hip_sagging':      'Raise your hips — keep plank form.',
    'burpee.arched_back':                'Keep your core tight in plank.',
  },
};

function getFeedbackText(key: string, locale: string): string {
  return FEEDBACK_TEXTS[locale]?.[key] ?? FEEDBACK_TEXTS.pt[key] ?? key;
}
