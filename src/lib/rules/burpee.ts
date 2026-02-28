import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type BurpeePhase = 'up' | 'down' | 'transition';

// ── Limiares +15% de tolerância ──────────────────────────────────────────────
// Burpee: em pé (joelhos esticados) → agachamento/prancha → em pé
// angles.leftKnee / rightKnee = ângulo quadril-joelho-tornozelo
const STANDING_THR = 160;      // em pé: joelhos quase esticados (≥ 160°)
const DOWN_THR     = 115;      // agachado/prono: joelhos dobrados (≤ 115° ≈ 100° × 1.15)

// Alinhamento do tronco (fase de prancha dentro do burpee)
const HIP_SAG_THR  = 0.069;   // 0.06 × 1.15 — quadril caindo / costas arqueadas

const PEN_ARCHED_BACK = 20;

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

export function analyzeBurpee(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: BurpeePhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const feedback: string[] = [];
  let score = 100;

  const avgKnee = (angles.leftKnee + angles.rightKnee) / 2;

  // ── Fase ─────────────────────────────────────────────────────────────────
  let phase: BurpeePhase = prevPhase;
  if (avgKnee >= STANDING_THR)    phase = 'up';
  else if (avgKnee <= DOWN_THR)   phase = 'down';
  else                             phase = 'transition';

  if (phase === 'down') errorTracker['_burpee._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_burpee._was_down'];
  if (repComplete) delete errorTracker['_burpee._was_down'];

  // ── Costas arqueadas (quadril caindo na fase de prancha) ──────────────────
  // Monitora o alinhamento ombro-quadril-tornozelo continuamente
  const shoulderY    = (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipY         = (landmarks[LANDMARKS.LEFT_HIP].y      + landmarks[LANDMARKS.RIGHT_HIP].y)      / 2;
  const ankleY       = (landmarks[LANDMARKS.LEFT_ANKLE].y    + landmarks[LANDMARKS.RIGHT_ANKLE].y)    / 2;
  const expectedHipY = shoulderY + (ankleY - shoulderY) * 0.5;
  const hipDev       = hipY - expectedHipY;

  // Só penaliza na fase de prancha (quando o corpo está próximo à horizontal)
  const bodyHorizontal = Math.abs(shoulderY - ankleY) < 0.15;
  const archedBack = bodyHorizontal && hipDev > HIP_SAG_THR;
  if (archedBack) score -= PEN_ARCHED_BACK;
  trackError('burpee.arched_back', archedBack, errorTracker, feedback);

  const finalScore = Math.max(0, score);

  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
