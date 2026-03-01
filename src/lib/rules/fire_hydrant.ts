import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type FireHydrantPhase = 'up' | 'down' | 'transition';

// On all fours, raise one knee to the side.
// Detected via knee Y asymmetry (raised knee has smaller Y = higher in frame)
const KNEE_LIFT_THR  = 0.060; // |leftKneeY - rightKneeY| for "raised"
const KNEE_LEVEL_THR = 0.030; // knees considered level when within this range
const HIP_ROT_THR    = 0.055; // hip Y asymmetry (rotation during raise)
const LIFT_MIN_THR   = 0.080; // insufficient lift if asymmetry < this

const PEN_ROT  = 18;
const PEN_LIFT = 15;

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

export function analyzeFireHydrant(
  _angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: FireHydrantPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const lKneeY = landmarks[LANDMARKS.LEFT_KNEE].y;
  const rKneeY = landmarks[LANDMARKS.RIGHT_KNEE].y;
  const kneeAsym = Math.abs(lKneeY - rKneeY);
  const feedback: string[] = [];
  let score = 100;

  let phase: FireHydrantPhase = prevPhase;
  if (kneeAsym >= KNEE_LIFT_THR)    phase = 'down'; // leg raised
  else if (kneeAsym <= KNEE_LEVEL_THR) phase = 'up'; // legs level
  else                               phase = 'transition';

  if (phase === 'down') errorTracker['_fire_hydrant._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_fire_hydrant._was_down'];
  if (repComplete) delete errorTracker['_fire_hydrant._was_down'];

  // ── Rotação do quadril ────────────────────────────────────────────────────
  const hipRot = Math.abs(landmarks[LANDMARKS.LEFT_HIP].y - landmarks[LANDMARKS.RIGHT_HIP].y) > HIP_ROT_THR;
  if (hipRot) score -= PEN_ROT;
  trackError('fire_hydrant.keep_hips_level', hipRot, errorTracker, feedback);

  // ── Amplitude insuficiente ────────────────────────────────────────────────
  const notHighEnough = phase === 'down' && kneeAsym < LIFT_MIN_THR;
  if (notHighEnough) score -= PEN_LIFT;
  trackError('fire_hydrant.lift_higher', notHighEnough, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
