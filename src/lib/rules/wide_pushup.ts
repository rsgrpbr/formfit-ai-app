import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type WidePushupPhase = 'up' | 'down' | 'transition';

// Wide-grip pushup, targets chest more than standard.
const ELBOW_DOWN_MAX = 95;
const ELBOW_UP_MIN   = 155;
const BODY_ALIGN_THR = 0.106;
const DEPTH_THR      = 148;
const ELBOW_ASYM_THR = 26;

const PEN_BODY   = 18;
const PEN_DEPTH  = 12;
const PEN_ASYM   = 8;

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

export function analyzeWidePushup(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: WidePushupPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const elbow = (angles.leftElbow + angles.rightElbow) / 2;
  const feedback: string[] = [];
  let score = 100;

  let phase: WidePushupPhase = prevPhase;
  if (elbow < ELBOW_DOWN_MAX)    phase = 'down';
  else if (elbow > ELBOW_UP_MIN) phase = 'up';
  else                            phase = 'transition';

  if (phase === 'down') errorTracker['_wide_pushup._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_wide_pushup._was_down'];
  if (repComplete) delete errorTracker['_wide_pushup._was_down'];

  // ── Alinhamento do corpo ──────────────────────────────────────────────────
  const shoulderY    = (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipY         = (landmarks[LANDMARKS.LEFT_HIP].y      + landmarks[LANDMARKS.RIGHT_HIP].y)      / 2;
  const ankleY       = (landmarks[LANDMARKS.LEFT_ANKLE].y    + landmarks[LANDMARKS.RIGHT_ANKLE].y)    / 2;
  const expectedHipY = shoulderY + (ankleY - shoulderY) * 0.5;
  const bodyMisaligned = Math.abs(hipY - expectedHipY) > BODY_ALIGN_THR;
  if (bodyMisaligned) score -= PEN_BODY;
  trackError('wide_pushup.keep_body_straight', bodyMisaligned, errorTracker, feedback);

  // ── Amplitude insuficiente ────────────────────────────────────────────────
  const tooShallow = phase === 'down' && elbow > DEPTH_THR;
  if (tooShallow) score -= PEN_DEPTH;
  trackError('wide_pushup.go_lower', tooShallow, errorTracker, feedback);

  // ── Cotovelos assimétricos ────────────────────────────────────────────────
  const elbowAsym = Math.abs(angles.leftElbow - angles.rightElbow) > ELBOW_ASYM_THR;
  if (elbowAsym) score -= PEN_ASYM;
  trackError('wide_pushup.align_elbows', elbowAsym, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
