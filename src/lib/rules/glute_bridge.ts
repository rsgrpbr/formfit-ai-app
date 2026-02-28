import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type GluteBridgePhase = 'up' | 'down' | 'transition';

// ── Limiares tolerantes ───────────────────────────────────────────────────────
// Ângulo ombro-quadril-joelho (angles.leftHip / rightHip)
// Ponte no topo: quadril levantado → ângulo aumenta (~150°+)
// Posição baixa: quadril no chão → ângulo menor (~90-115°)
const HIP_UP_MIN    = 150;   // fase "up": quadril levantado
const HIP_DOWN_MAX  = 115;   // fase "down": quadril no chão
const HIP_PEAK_THR  = 120;   // 138 × 0.87 (mais fácil de atingir o topo)
const HIP_ASYM_THR  = 0.079; // 0.069 × 1.15
const FEET_WIDE_THR = 1.85;  // 1.61 × 1.15

const PEN_LOW   = 18;
const PEN_ASYM  = 12;
const PEN_FEET  = 8;

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

export function analyzeGluteBridge(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: GluteBridgePhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const avgHip = (angles.leftHip + angles.rightHip) / 2;
  const feedback: string[] = [];
  let score = 100;

  // ── Fase ─────────────────────────────────────────────────────────────────
  let phase: GluteBridgePhase = prevPhase;
  if (avgHip > HIP_UP_MIN)       phase = 'up';
  else if (avgHip < HIP_DOWN_MAX) phase = 'down';
  else                            phase = 'transition';

  const repComplete = prevPhase === 'down' && phase === 'up';

  // ── Quadril não sobe o suficiente ─────────────────────────────────────────
  const hipLow = phase === 'up' && avgHip < HIP_PEAK_THR;
  if (hipLow) score -= PEN_LOW;
  trackError('glute_bridge.low_hips', hipLow, errorTracker, feedback);

  // ── Assimetria lateral (quadril esquerdo vs direito) ──────────────────────
  const hipAsym = Math.abs(
    landmarks[LANDMARKS.LEFT_HIP].y - landmarks[LANDMARKS.RIGHT_HIP].y
  ) > HIP_ASYM_THR;
  if (hipAsym) score -= PEN_ASYM;
  trackError('glute_bridge.hip_asymmetry', hipAsym, errorTracker, feedback);

  // ── Pés abertos demais ────────────────────────────────────────────────────
  const ankleSpread = Math.abs(landmarks[LANDMARKS.LEFT_ANKLE].x - landmarks[LANDMARKS.RIGHT_ANKLE].x);
  const hipSpread   = Math.abs(landmarks[LANDMARKS.LEFT_HIP].x   - landmarks[LANDMARKS.RIGHT_HIP].x);
  const feetTooWide = hipSpread > 0.01 && ankleSpread / hipSpread > FEET_WIDE_THR;
  if (feetTooWide) score -= PEN_FEET;
  trackError('glute_bridge.feet_too_wide', feetTooWide, errorTracker, feedback);

  const finalScore = Math.max(0, score);

  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
