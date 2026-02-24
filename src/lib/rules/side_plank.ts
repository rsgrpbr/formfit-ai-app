import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ErrorTracker } from './squat';

export interface SidePlankResult {
  score: number;
  quality: 'optimal' | 'good' | 'corrective';
  feedback: string[];
  holdSeconds: number;
  phase: 'holding' | 'failed';
}

// ── Limiares +15% de tolerância ──────────────────────────────────────────────
const HIP_HIGH_THR  = 0.069;   // 0.06 × 1.15 — quadril muito alto
const HIP_LOW_THR   = 0.069;   // 0.06 × 1.15 — quadril muito baixo (caindo)
const NECK_DROP_THR = 0.046;   // 0.04 × 1.15 — cabeça caindo

const PEN_HIP_HIGH = 22;
const PEN_HIP_LOW  = 22;
const PEN_NECK     = 12;

const ERROR_PERSIST_MS = 3000;

function quality(score: number): SidePlankResult['quality'] {
  if (score >= 80) return 'optimal';
  if (score >= 60) return 'good';
  return 'corrective';
}

function trackError(
  key: string,
  active: boolean,
  tracker: ErrorTracker,
  feedback: string[]
): void {
  if (active) {
    if (!(key in tracker)) tracker[key] = Date.now();
    if (Date.now() - tracker[key] >= ERROR_PERSIST_MS) feedback.push(key);
  } else {
    delete tracker[key];
  }
}

export function analyzeSidePlank(
  _angles: JointAngles,
  landmarks: PoseLandmarks,
  elapsed: number,
  errorTracker: ErrorTracker = {}
): SidePlankResult {
  const feedback: string[] = [];
  let score = 100;

  const shoulderY    = (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipY         = (landmarks[LANDMARKS.LEFT_HIP].y      + landmarks[LANDMARKS.RIGHT_HIP].y)      / 2;
  const ankleY       = (landmarks[LANDMARKS.LEFT_ANKLE].y    + landmarks[LANDMARKS.RIGHT_ANKLE].y)    / 2;
  const expectedHipY = shoulderY + (ankleY - shoulderY) * 0.5;
  const hipDev       = hipY - expectedHipY;

  // ── Quadril muito alto ────────────────────────────────────────────────────
  const hipTooHigh = hipDev < -HIP_HIGH_THR;
  if (hipTooHigh) score -= PEN_HIP_HIGH;
  trackError('side_plank.hip_too_high', hipTooHigh, errorTracker, feedback);

  // ── Quadril caindo ────────────────────────────────────────────────────────
  const hipDropping = hipDev > HIP_LOW_THR;
  if (hipDropping) score -= PEN_HIP_LOW;
  trackError('side_plank.hip_dropping', hipDropping, errorTracker, feedback);

  // ── Cabeça caindo (pescoço fletido) ───────────────────────────────────────
  const noseY      = landmarks[LANDMARKS.NOSE].y;
  const neckDropped = noseY - shoulderY > NECK_DROP_THR;
  if (neckDropped) score -= PEN_NECK;
  trackError('side_plank.neck_dropped', neckDropped, errorTracker, feedback);

  const finalScore = Math.max(0, score);

  return {
    score: finalScore,
    quality: quality(finalScore),
    feedback,
    holdSeconds: elapsed,
    phase: finalScore < 40 ? 'failed' : 'holding',
  };
}
