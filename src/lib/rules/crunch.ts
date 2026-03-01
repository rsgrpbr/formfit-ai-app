import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type CrunchPhase = 'up' | 'down' | 'transition';

// Lying on back, lift upper body toward knees.
// angles.leftHip = shoulder→hip→knee — decreases when crunching up.
const HIP_DOWN_MIN = 65;   // contracted (crunched): hip angle ≤ 65°
const HIP_UP_MAX   = 95;   // extended (lying flat): hip angle ≥ 95°
const SPINE_FLEX_THR = 55; // spine angle threshold for insufficient crunch

const PEN_SHALLOW = 15;

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

export function analyzeCrunch(
  angles: JointAngles,
  _landmarks: PoseLandmarks,
  prevPhase: CrunchPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const avgHip = (angles.leftHip + angles.rightHip) / 2;
  const feedback: string[] = [];
  let score = 100;

  let phase: CrunchPhase = prevPhase;
  if (avgHip <= HIP_DOWN_MIN)   phase = 'down'; // contracted
  else if (avgHip >= HIP_UP_MAX) phase = 'up';  // extended
  else                            phase = 'transition';

  if (phase === 'down') errorTracker['_crunch._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_crunch._was_down'];
  if (repComplete) delete errorTracker['_crunch._was_down'];

  // ── Amplitude insuficiente ────────────────────────────────────────────────
  const tooShallow = phase === 'down' && avgHip > SPINE_FLEX_THR;
  if (tooShallow) score -= PEN_SHALLOW;
  trackError('crunch.crunch_higher', tooShallow, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
