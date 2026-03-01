import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type BirdDogPhase = 'up' | 'down' | 'transition';

// Isometric: on all fours, extend opposite arm and leg.
// repComplete is always false — focus on stability.
const HIP_ROT_THR  = 0.055; // hip Y asymmetry (rotation = error)
const SPINE_MIN    = 155;   // spine should remain neutral/flat (> 155°)

const PEN_ROT   = 20;
const PEN_SPINE = 15;

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

export function analyzeBirdDog(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  _prevPhase: BirdDogPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const feedback: string[] = [];
  let score = 100;

  const phase: BirdDogPhase = 'up'; // isometric — no phase cycling

  // ── Rotação do quadril ────────────────────────────────────────────────────
  const hipRot = Math.abs(landmarks[LANDMARKS.LEFT_HIP].y - landmarks[LANDMARKS.RIGHT_HIP].y) > HIP_ROT_THR;
  if (hipRot) score -= PEN_ROT;
  trackError('bird_dog.keep_hips_level', hipRot, errorTracker, feedback);

  // ── Coluna arqueada ───────────────────────────────────────────────────────
  const spineArched = angles.spine < SPINE_MIN;
  if (spineArched) score -= PEN_SPINE;
  trackError('bird_dog.keep_back_neutral', spineArched, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  return { repComplete: false, score: finalScore, quality: quality(finalScore), feedback, phase };
}
