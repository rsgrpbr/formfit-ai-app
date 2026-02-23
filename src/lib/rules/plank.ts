import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ErrorTracker } from './squat';

export interface PlankResult {
  score: number;
  quality: 'optimal' | 'good' | 'corrective';
  feedback: string[];
  holdSeconds: number;
  phase: 'holding' | 'failed';
}

// ── Limiares +15% de tolerância ──────────────────────────────────────────────
const HIP_HIGH_THR       = 0.069;          // era 0.06  → × 1.15
const HIP_LOW_THR        = 0.069;          // era 0.06  → × 1.15
const SHOULDER_LEVEL_THR = 0.058;          // era 0.05  → × 1.15

// Deduções de pontuação (imediatas, independente do debounce)
const PEN_HIP_HIGH  = 22;
const PEN_HIP_LOW   = 22;
const PEN_SHOULDER  = 12;

const ERROR_PERSIST_MS = 3000;

function quality(score: number): PlankResult['quality'] {
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

export function analyzePlank(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  elapsed: number,
  errorTracker: ErrorTracker = {}
): PlankResult {
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
  trackError('plank.lower_hips', hipTooHigh, errorTracker, feedback);

  // ── Quadril muito baixo ───────────────────────────────────────────────────
  const hipTooLow = hipDev > HIP_LOW_THR;
  if (hipTooLow) score -= PEN_HIP_LOW;
  trackError('plank.raise_hips', hipTooLow, errorTracker, feedback);

  // ── Ombros desnivelados ───────────────────────────────────────────────────
  const shoulderDiff   = Math.abs(
    landmarks[LANDMARKS.LEFT_SHOULDER].y - landmarks[LANDMARKS.RIGHT_SHOULDER].y
  );
  const shouldersUneven = shoulderDiff > SHOULDER_LEVEL_THR;
  if (shouldersUneven) score -= PEN_SHOULDER;
  trackError('plank.level_shoulders', shouldersUneven, errorTracker, feedback);

  const finalScore = Math.max(0, score);

  return {
    score: finalScore,
    quality: quality(finalScore),
    feedback,
    holdSeconds: elapsed,
    phase: finalScore < 40 ? 'failed' : 'holding',
  };
}
