import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';

export interface ExerciseResult {
  repComplete: boolean;
  score: number;                             // 0–100
  quality: 'optimal' | 'good' | 'corrective'; // 80+ / 60-79 / <60
  feedback: string[];                        // chaves i18n (só erros persistindo 3s+)
  phase: 'up' | 'down' | 'transition';
}

export type SquatPhase = 'up' | 'down' | 'transition';

/**
 * Rastreia desde quando cada erro está ativo.
 * Deve ser um objeto estável (useRef no componente) para o debounce funcionar.
 */
export type ErrorTracker = Record<string, number>;

// ── Limiares +15% de tolerância ──────────────────────────────────────────────
const KNEE_DOWN_MAX    = 100;                // detecção de fase (inalterado)
const KNEE_UP_MIN      = 160;               // detecção de fase (inalterado)
const KNEE_TOE_THR     = 0.092;             // era 0.08  → × 1.15
const DEPTH_KNEE_THR   = 127;              // era 110   → × 1.15
const BACK_TILT_DEG    = 52;               // era 45°   → × 1.15  (spine < 128)

// Deduções de pontuação (imediatas, independente do debounce)
const PEN_KNEE_TOE  = 18;
const PEN_DEPTH     = 12;
const PEN_BACK      = 18;

const ERROR_PERSIST_MS = 3000;

function quality(score: number): ExerciseResult['quality'] {
  if (score >= 80) return 'optimal';
  if (score >= 60) return 'good';
  return 'corrective';
}

/**
 * Registra erro e só adiciona ao feedback de voz após 3s contínuos.
 * Limpa o timer quando o erro some.
 */
function trackError(
  key: string,
  active: boolean,
  tracker: ErrorTracker,
  feedback: string[]
): void {
  if (active) {
    if (!(key in tracker)) tracker[key] = Date.now();
    if (Date.now() - tracker[key] >= ERROR_PERSIST_MS) feedback.push(key);
  } else {
    delete tracker[key];
  }
}

export function analyzeSquat(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: SquatPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const knee = (angles.leftKnee + angles.rightKnee) / 2;
  const feedback: string[] = [];
  let score = 100;

  // Fase
  let phase: SquatPhase = prevPhase;
  if (knee < KNEE_DOWN_MAX)    phase = 'down';
  else if (knee > KNEE_UP_MIN) phase = 'up';
  else                          phase = 'transition';

  const repComplete = prevPhase === 'down' && phase === 'up';

  // ── Joelhos passando os pés ───────────────────────────────────────────────
  const lKneeX = landmarks[LANDMARKS.LEFT_KNEE].x;
  const lToeX  = landmarks[LANDMARKS.LEFT_FOOT_INDEX].x;
  const kneesToo = Math.abs(lKneeX - lToeX) > KNEE_TOE_THR;
  if (kneesToo) score -= PEN_KNEE_TOE;
  trackError('squat.knees_over_toes', kneesToo, errorTracker, feedback);

  // ── Profundidade insuficiente (só na fase baixa) ──────────────────────────
  const tooShallow = phase === 'down' && knee > DEPTH_KNEE_THR;
  if (tooShallow) score -= PEN_DEPTH;
  trackError('squat.go_deeper', tooShallow, errorTracker, feedback);

  // ── Costas inclinadas demais ──────────────────────────────────────────────
  const backTilted = angles.spine < (180 - BACK_TILT_DEG);
  if (backTilted) score -= PEN_BACK;
  trackError('squat.keep_back_straight', backTilted, errorTracker, feedback);

  const finalScore = Math.max(0, score);

  // ── Feedback positivo: apenas ao completar rep com boa forma ─────────────
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
