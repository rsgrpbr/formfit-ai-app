import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type DiamondPushupPhase = 'up' | 'down' | 'transition';

// Narrow diamond-grip pushup targeting triceps.
const ELBOW_DOWN_MAX  = 95;   // arms bent at bottom
const ELBOW_UP_MIN    = 155;  // arms extended
const BODY_ALIGN_THR  = 0.106;
const DEPTH_THR       = 148;  // must reach ≤ 148° at elbows for good depth
const WIDE_WRIST_THR  = 0.28; // wrist spread too wide (should be narrow/diamond)

const PEN_BODY   = 18;
const PEN_DEPTH  = 12;
const PEN_WIDTH  = 15;

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

export function analyzeDiamondPushup(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: DiamondPushupPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const elbow = (angles.leftElbow + angles.rightElbow) / 2;
  const feedback: string[] = [];
  let score = 100;

  let phase: DiamondPushupPhase = prevPhase;
  if (elbow < ELBOW_DOWN_MAX)    phase = 'down';
  else if (elbow > ELBOW_UP_MIN) phase = 'up';
  else                            phase = 'transition';

  if (phase === 'down') errorTracker['_diamond_pushup._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_diamond_pushup._was_down'];
  if (repComplete) delete errorTracker['_diamond_pushup._was_down'];

  // ── Alinhamento do corpo ──────────────────────────────────────────────────
  const shoulderY    = (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipY         = (landmarks[LANDMARKS.LEFT_HIP].y      + landmarks[LANDMARKS.RIGHT_HIP].y)      / 2;
  const ankleY       = (landmarks[LANDMARKS.LEFT_ANKLE].y    + landmarks[LANDMARKS.RIGHT_ANKLE].y)    / 2;
  const expectedHipY = shoulderY + (ankleY - shoulderY) * 0.5;
  const bodyMisaligned = Math.abs(hipY - expectedHipY) > BODY_ALIGN_THR;
  if (bodyMisaligned) score -= PEN_BODY;
  trackError('diamond_pushup.keep_body_straight', bodyMisaligned, errorTracker, feedback);

  // ── Amplitude insuficiente ────────────────────────────────────────────────
  const tooShallow = phase === 'down' && elbow > DEPTH_THR;
  if (tooShallow) score -= PEN_DEPTH;
  trackError('diamond_pushup.go_lower', tooShallow, errorTracker, feedback);

  // ── Punhos afastados demais (não está em diamante) ────────────────────────
  const wristSpread = Math.abs(landmarks[LANDMARKS.LEFT_WRIST].x - landmarks[LANDMARKS.RIGHT_WRIST].x);
  const tooWide = wristSpread > WIDE_WRIST_THR;
  if (tooWide) score -= PEN_WIDTH;
  trackError('diamond_pushup.bring_hands_together', tooWide, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
