import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type WallSitPhase = 'up' | 'down' | 'transition';

// Isometric hold: knees at ~90°, back against wall.
// repComplete is always false — duration tracked externally.
const KNEE_MIN      = 75;   // too deep (below 75° = problematic)
const KNEE_MAX      = 108;  // not deep enough (above 108° = too shallow)
const SPINE_MIN_DEG = 140;  // back should be upright (spine angle > 140°)

const PEN_ANGLE  = 15;
const PEN_POSTURE = 12;

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

export function analyzeWallSit(
  angles: JointAngles,
  _landmarks: PoseLandmarks,
  _prevPhase: WallSitPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
  const feedback: string[] = [];
  let score = 100;

  // Isometric — no phase cycling
  const phase: WallSitPhase = 'up';

  // ── Ângulo do joelho fora da zona alvo (75–108°) ──────────────────────────
  const kneeOutOfRange = avgKnee < KNEE_MIN || avgKnee > KNEE_MAX;
  if (kneeOutOfRange) score -= PEN_ANGLE;
  trackError('wall_sit.adjust_knee_angle', kneeOutOfRange, errorTracker, feedback);

  // ── Postura: costas não retas ─────────────────────────────────────────────
  const backNotStraight = angles.spine < SPINE_MIN_DEG;
  if (backNotStraight) score -= PEN_POSTURE;
  trackError('wall_sit.keep_back_straight', backNotStraight, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  return { repComplete: false, score: finalScore, quality: quality(finalScore), feedback, phase };
}
