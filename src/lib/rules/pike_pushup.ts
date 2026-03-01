import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type PikePushupPhase = 'up' | 'down' | 'transition';

// Inverted-V position, lower head toward floor by bending elbows.
const ELBOW_DOWN_MAX  = 100;  // arms bent at bottom
const ELBOW_UP_MIN    = 155;  // arms extended at top
const HIP_PIKE_THR    = 0.060; // hip should be above shoulder (hipY < shoulderY - THR)
const BODY_ALIGN_THR  = 0.100; // body alignment in plank-like phases

const PEN_NO_PIKE = 20;
const PEN_BODY    = 15;

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

export function analyzePikePushup(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: PikePushupPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const elbow = (angles.leftElbow + angles.rightElbow) / 2;
  const feedback: string[] = [];
  let score = 100;

  let phase: PikePushupPhase = prevPhase;
  if (elbow < ELBOW_DOWN_MAX)    phase = 'down';
  else if (elbow > ELBOW_UP_MIN) phase = 'up';
  else                            phase = 'transition';

  if (phase === 'down') errorTracker['_pike_pushup._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_pike_pushup._was_down'];
  if (repComplete) delete errorTracker['_pike_pushup._was_down'];

  // ── Quadril não piked (deve estar alto, acima dos ombros) ─────────────────
  const shoulderY = (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipY      = (landmarks[LANDMARKS.LEFT_HIP].y      + landmarks[LANDMARKS.RIGHT_HIP].y)      / 2;
  const notPiked  = hipY > shoulderY - HIP_PIKE_THR; // hip not above shoulder
  if (notPiked) score -= PEN_NO_PIKE;
  trackError('pike_pushup.raise_hips', notPiked, errorTracker, feedback);

  // ── Alinhamento do corpo na fase de descida ───────────────────────────────
  const ankleY       = (landmarks[LANDMARKS.LEFT_ANKLE].y + landmarks[LANDMARKS.RIGHT_ANKLE].y) / 2;
  const expectedHipY = shoulderY + (ankleY - shoulderY) * 0.5;
  const bodyMisaligned = Math.abs(hipY - expectedHipY) > BODY_ALIGN_THR;
  if (bodyMisaligned) score -= PEN_BODY;
  trackError('pike_pushup.keep_body_straight', bodyMisaligned, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
