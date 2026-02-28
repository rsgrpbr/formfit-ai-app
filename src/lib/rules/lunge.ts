import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type LungePhase = 'up' | 'down' | 'transition';

// ── Limiares tolerantes ───────────────────────────────────────────────────────
const FRONT_KNEE_DOWN_MAX = 105;           // detecção de fase (inalterado)
const FRONT_KNEE_UP_MIN   = 160;           // detecção de fase (inalterado)
const KNEE_TOE_THR        = 0.132;         // 0.115 × 1.15
const SPINE_MIN           = 117;           // 134 × 0.87 (mais inclinação permitida)
const DEPTH_KNEE_THR      = 152;           // 132 × 1.15

// Deduções de pontuação (imediatas, independente do debounce)
const PEN_KNEE   = 18;
const PEN_TORSO  = 18;
const PEN_DEPTH  = 12;

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

export function analyzeLunge(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: LungePhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const frontKnee = Math.min(angles.leftKnee, angles.rightKnee);
  const feedback: string[] = [];
  let score = 100;

  // Fase
  let phase: LungePhase = prevPhase;
  if (frontKnee < FRONT_KNEE_DOWN_MAX)    phase = 'down';
  else if (frontKnee > FRONT_KNEE_UP_MIN) phase = 'up';
  else                                     phase = 'transition';

  if (phase === 'down') errorTracker['_lunge._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_lunge._was_down'];
  if (repComplete) delete errorTracker['_lunge._was_down'];

  // ── Joelho da frente alinhado com o dedo do pé ────────────────────────────
  const frontIsLeft = angles.leftKnee < angles.rightKnee;
  const kneeX = frontIsLeft ? landmarks[LANDMARKS.LEFT_KNEE].x       : landmarks[LANDMARKS.RIGHT_KNEE].x;
  const toeX  = frontIsLeft ? landmarks[LANDMARKS.LEFT_FOOT_INDEX].x : landmarks[LANDMARKS.RIGHT_FOOT_INDEX].x;
  const kneeOverToe = Math.abs(kneeX - toeX) > KNEE_TOE_THR;
  if (kneeOverToe) score -= PEN_KNEE;
  trackError('lunge.knee_over_toe', kneeOverToe, errorTracker, feedback);

  // ── Tronco ereto ─────────────────────────────────────────────────────────
  const torsoLeaning = angles.spine < SPINE_MIN;
  if (torsoLeaning) score -= PEN_TORSO;
  trackError('lunge.keep_torso_upright', torsoLeaning, errorTracker, feedback);

  // ── Profundidade insuficiente (só na fase baixa) ──────────────────────────
  const tooShallow = phase === 'down' && frontKnee > DEPTH_KNEE_THR;
  if (tooShallow) score -= PEN_DEPTH;
  trackError('lunge.go_deeper', tooShallow, errorTracker, feedback);

  const finalScore = Math.max(0, score);

  // ── Feedback positivo: apenas ao completar rep com boa forma ──────────────
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
