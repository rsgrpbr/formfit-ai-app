import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type TricepDipPhase = 'up' | 'down' | 'transition';

// Arms behind on chair/bench, dip by bending elbows.
const ELBOW_DOWN_MAX = 95;   // elbows bent (bottom position)
const ELBOW_UP_MIN   = 150;  // elbows extended (top position)
const DEPTH_THR      = 140;  // must reach ≤ 140° for adequate depth
const ELBOW_ASYM_THR = 25;   // asymmetric arm bend
const FORWARD_THR    = 0.08; // hips too far forward from shoulders

const PEN_DEPTH   = 15;
const PEN_ASYM    = 12;
const PEN_FORWARD = 12;

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

export function analyzeTricepDip(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: TricepDipPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const elbow = (angles.leftElbow + angles.rightElbow) / 2;
  const feedback: string[] = [];
  let score = 100;

  let phase: TricepDipPhase = prevPhase;
  if (elbow < ELBOW_DOWN_MAX)    phase = 'down';
  else if (elbow > ELBOW_UP_MIN) phase = 'up';
  else                            phase = 'transition';

  if (phase === 'down') errorTracker['_tricep_dip._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_tricep_dip._was_down'];
  if (repComplete) delete errorTracker['_tricep_dip._was_down'];

  // ── Amplitude insuficiente ────────────────────────────────────────────────
  const tooShallow = phase === 'down' && elbow > DEPTH_THR;
  if (tooShallow) score -= PEN_DEPTH;
  trackError('tricep_dip.dip_lower', tooShallow, errorTracker, feedback);

  // ── Cotovelos assimétricos ────────────────────────────────────────────────
  const elbowAsym = Math.abs(angles.leftElbow - angles.rightElbow) > ELBOW_ASYM_THR;
  if (elbowAsym) score -= PEN_ASYM;
  trackError('tricep_dip.align_elbows', elbowAsym, errorTracker, feedback);

  // ── Quadril muito à frente ────────────────────────────────────────────────
  const avgShoulderX = (landmarks[LANDMARKS.LEFT_SHOULDER].x + landmarks[LANDMARKS.RIGHT_SHOULDER].x) / 2;
  const avgHipX      = (landmarks[LANDMARKS.LEFT_HIP].x      + landmarks[LANDMARKS.RIGHT_HIP].x)      / 2;
  const hipForward   = Math.abs(avgHipX - avgShoulderX) > FORWARD_THR;
  if (hipForward) score -= PEN_FORWARD;
  trackError('tricep_dip.keep_hips_close', hipForward, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
