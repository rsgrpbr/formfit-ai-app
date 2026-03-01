import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type HighKneesPhase = 'up' | 'down' | 'transition';

// Running in place with knees driven high (above hip level).
// Same landmark detection as mountain_climber but in upright position.
const KNEE_DRIVE_THR  = 0.050; // kneeY - hipY < -THR = knee above hip ("high")
const LEAN_BACK_THR   = 55;    // spine angle too low = leaning back excessively

const PEN_LEAN = 15;

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

export function analyzeHighKnees(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: HighKneesPhase,
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

  let phase: HighKneesPhase = prevPhase;
  if (anyDrive) phase = 'down';
  else          phase = 'up';

  if (phase === 'down') errorTracker['_high_knees._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_high_knees._was_down'];
  if (repComplete) delete errorTracker['_high_knees._was_down'];

  // ── Inclinação para trás excessiva ────────────────────────────────────────
  const leaningBack = angles.spine < (180 - LEAN_BACK_THR);
  if (leaningBack) score -= PEN_LEAN;
  trackError('high_knees.stay_upright', leaningBack, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
