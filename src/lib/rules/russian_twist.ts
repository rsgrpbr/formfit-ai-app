import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type RussianTwistPhase = 'up' | 'down' | 'transition';

// Sitting, rotate trunk side to side.
// Detected via shoulder Y asymmetry (one shoulder rises as you rotate).
const ROTATION_THR  = 0.045; // |leftShoulderY - rightShoulderY| during twist
const CENTERED_THR  = 0.020; // shoulders level = centered position
const LEAN_BACK_THR = 0.079; // back too upright or not enough lean (spine check)

const PEN_LEAN = 12;

const ERROR_PERSIST_MS = 3000;

function quality(score: number): ExerciseResult['quality'] {
  if (score >= 80) return 'optimal';
  if (score >= 60) return 'good';
  return 'corrective';
}

function trackError(key: string, active: boolean, tracker: ErrorTracker, feedback: string[]): void {
  if (active) {
    if (!(key in tracker)) tracker[key] = Date.now();
    if (Date.now() - tracker[key] >= ERROR_PERSIST_MS) feedback.push(key);
  } else {
    delete tracker[key];
  }
}

export function analyzeRussianTwist(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: RussianTwistPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const lShoulderY = landmarks[LANDMARKS.LEFT_SHOULDER].y;
  const rShoulderY = landmarks[LANDMARKS.RIGHT_SHOULDER].y;
  const shoulderAsym = Math.abs(lShoulderY - rShoulderY);
  const feedback: string[] = [];
  let score = 100;

  let phase: RussianTwistPhase = prevPhase;
  if (shoulderAsym >= ROTATION_THR)   phase = 'down'; // rotating
  else if (shoulderAsym <= CENTERED_THR) phase = 'up'; // centered
  else                                   phase = 'transition';

  if (phase === 'down') errorTracker['_russian_twist._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_russian_twist._was_down'];
  if (repComplete) delete errorTracker['_russian_twist._was_down'];

  // ── Inclinação do tronco ──────────────────────────────────────────────────
  // spine angle (shoulder→hip→knee) should be in ~110-140° range for V-sit
  const spineOk = angles.spine > 100 && angles.spine < 150;
  if (!spineOk) score -= PEN_LEAN;
  trackError('russian_twist.maintain_lean', !spineOk, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
