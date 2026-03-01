import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type HipThrustPhase = 'up' | 'down' | 'transition';

// Shoulders on bench/floor, feet planted, thrust hips up.
// angles.leftHip/rightHip = shoulder→hip→knee
const HIP_UP_MIN   = 155;   // fully extended at top
const HIP_DOWN_MAX = 110;   // lowered position
const HIP_PEAK_THR = 138;   // 0.87 × 158 — minimum peak for adequate thrust
const HIP_ASYM_THR = 0.069; // hip Y asymmetry

const PEN_LOW  = 18;
const PEN_ASYM = 12;

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

export function analyzeHipThrust(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: HipThrustPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const avgHip = (angles.leftHip + angles.rightHip) / 2;
  const feedback: string[] = [];
  let score = 100;

  let phase: HipThrustPhase = prevPhase;
  if (avgHip > HIP_UP_MIN)        phase = 'up';
  else if (avgHip < HIP_DOWN_MAX) phase = 'down';
  else                             phase = 'transition';

  if (phase === 'down') errorTracker['_hip_thrust._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_hip_thrust._was_down'];
  if (repComplete) delete errorTracker['_hip_thrust._was_down'];

  // ── Quadril não sobe o suficiente ─────────────────────────────────────────
  const hipLow = phase === 'up' && avgHip < HIP_PEAK_THR;
  if (hipLow) score -= PEN_LOW;
  trackError('hip_thrust.thrust_higher', hipLow, errorTracker, feedback);

  // ── Assimetria lateral ────────────────────────────────────────────────────
  const hipAsym = Math.abs(landmarks[LANDMARKS.LEFT_HIP].y - landmarks[LANDMARKS.RIGHT_HIP].y) > HIP_ASYM_THR;
  if (hipAsym) score -= PEN_ASYM;
  trackError('hip_thrust.hip_asymmetry', hipAsym, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
