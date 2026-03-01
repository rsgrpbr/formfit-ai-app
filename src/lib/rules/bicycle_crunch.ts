import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type BicycleCrunchPhase = 'up' | 'down' | 'transition';

// Alternating knee-to-elbow crunch: drive one knee while extending other leg.
// Use knee Y vs hip Y (same as mountain_climber) for drive detection.
const KNEE_DRIVE_THR = 0.045;   // kneeY - hipY < -THR = knee driven
const HIP_HIGH_THR   = 0.072;   // hip too high (not flat on back)
const HIP_SAG_THR    = 0.072;

const PEN_HIP = 20;

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

export function analyzeBicycleCrunch(
  _angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: BicycleCrunchPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const lKneeY = landmarks[LANDMARKS.LEFT_KNEE].y;
  const rKneeY = landmarks[LANDMARKS.RIGHT_KNEE].y;
  const lHipY  = landmarks[LANDMARKS.LEFT_HIP].y;
  const rHipY  = landmarks[LANDMARKS.RIGHT_HIP].y;

  const leftDrive  = lKneeY - lHipY < -KNEE_DRIVE_THR;
  const rightDrive = rKneeY - rHipY < -KNEE_DRIVE_THR;
  const anyDrive   = leftDrive || rightDrive;

  const feedback: string[] = [];
  let score = 100;

  let phase: BicycleCrunchPhase = prevPhase;
  if (anyDrive) phase = 'down';
  else          phase = 'up';

  if (phase === 'down') errorTracker['_bicycle_crunch._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_bicycle_crunch._was_down'];
  if (repComplete) delete errorTracker['_bicycle_crunch._was_down'];

  // ── Alinhamento do quadril ────────────────────────────────────────────────
  const shoulderY    = (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipY         = (landmarks[LANDMARKS.LEFT_HIP].y      + landmarks[LANDMARKS.RIGHT_HIP].y)      / 2;
  const ankleY       = (landmarks[LANDMARKS.LEFT_ANKLE].y    + landmarks[LANDMARKS.RIGHT_ANKLE].y)    / 2;
  const expectedHipY = shoulderY + (ankleY - shoulderY) * 0.5;
  const hipDev       = hipY - expectedHipY;

  const hipTooHigh = hipDev < -HIP_HIGH_THR;
  if (hipTooHigh) score -= PEN_HIP;
  trackError('bicycle_crunch.lower_hips', hipTooHigh, errorTracker, feedback);

  const hipSagging = hipDev > HIP_SAG_THR;
  if (hipSagging) score -= PEN_HIP;
  trackError('bicycle_crunch.raise_hips', hipSagging, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
