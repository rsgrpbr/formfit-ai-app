import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type PushupPhase = 'up' | 'down' | 'transition';

// ── Limiares tolerantes ───────────────────────────────────────────────────────
const ELBOW_DOWN_MAX   = 95;               // detecção de fase (inalterado)
const ELBOW_UP_MIN     = 155;              // detecção de fase (inalterado)
const BODY_ALIGN_THR   = 0.106;            // 0.092 × 1.15
const DEPTH_ELBOW_THR  = 146;              // 127 × 1.15
const ELBOW_ASYM_THR   = 26;              // 23 × 1.15

// Deduções de pontuação (imediatas, independente do debounce)
const PEN_BODY    = 18;
const PEN_DEPTH   = 12;
const PEN_ELBOWS  = 8;

const ERROR_PERSIST_MS = 3000;

function quality(score: number): ExerciseResult['quality'] {
  if (score >= 80) return 'optimal';
  if (score >= 60) return 'good';
  return 'corrective';
}

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

export function analyzePushup(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: PushupPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const elbow = (angles.leftElbow + angles.rightElbow) / 2;
  const feedback: string[] = [];
  let score = 100;

  // Fase
  let phase: PushupPhase = prevPhase;
  if (elbow < ELBOW_DOWN_MAX)    phase = 'down';
  else if (elbow > ELBOW_UP_MIN) phase = 'up';
  else                            phase = 'transition';

  const repComplete = prevPhase === 'down' && phase === 'up';

  // ── Alinhamento do corpo ──────────────────────────────────────────────────
  const shoulderY    = (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipY         = (landmarks[LANDMARKS.LEFT_HIP].y      + landmarks[LANDMARKS.RIGHT_HIP].y)      / 2;
  const ankleY       = (landmarks[LANDMARKS.LEFT_ANKLE].y    + landmarks[LANDMARKS.RIGHT_ANKLE].y)    / 2;
  const expectedHipY = shoulderY + (ankleY - shoulderY) * 0.5;
  const bodyMisaligned = Math.abs(hipY - expectedHipY) > BODY_ALIGN_THR;
  if (bodyMisaligned) score -= PEN_BODY;
  trackError('pushup.keep_body_straight', bodyMisaligned, errorTracker, feedback);

  // ── Amplitude insuficiente (só na fase baixa) ─────────────────────────────
  const tooShallow = phase === 'down' && elbow > DEPTH_ELBOW_THR;
  if (tooShallow) score -= PEN_DEPTH;
  trackError('pushup.go_lower', tooShallow, errorTracker, feedback);

  // ── Cotovelos assimétricos ────────────────────────────────────────────────
  const elbowAsym = Math.abs(angles.leftElbow - angles.rightElbow) > ELBOW_ASYM_THR;
  if (elbowAsym) score -= PEN_ELBOWS;
  trackError('pushup.align_elbows', elbowAsym, errorTracker, feedback);

  const finalScore = Math.max(0, score);

  // ── Feedback positivo: apenas ao completar rep com boa forma ──────────────
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
