import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type DeadBugPhase = 'up' | 'down' | 'transition';

// Isometric/controlled: lying on back, extend opposite arm/leg while keeping back flat.
// repComplete is always false — duration and control are what matter.
const HIP_ARCH_THR = 0.065; // hip deviation from flat alignment (back arching)
const HIP_ASYM_THR = 0.055; // hip Y asymmetry (rotation during movement)

const PEN_ARCH = 20;
const PEN_ASYM = 15;

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

export function analyzeDeadBug(
  _angles: JointAngles,
  landmarks: PoseLandmarks,
  _prevPhase: DeadBugPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const feedback: string[] = [];
  let score = 100;

  const phase: DeadBugPhase = 'up'; // isometric — no phase cycling

  // ── Costas arqueadas ──────────────────────────────────────────────────────
  const shoulderY    = (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipY         = (landmarks[LANDMARKS.LEFT_HIP].y      + landmarks[LANDMARKS.RIGHT_HIP].y)      / 2;
  const ankleY       = (landmarks[LANDMARKS.LEFT_ANKLE].y    + landmarks[LANDMARKS.RIGHT_ANKLE].y)    / 2;
  const expectedHipY = shoulderY + (ankleY - shoulderY) * 0.5;
  const archedBack   = Math.abs(hipY - expectedHipY) > HIP_ARCH_THR;
  if (archedBack) score -= PEN_ARCH;
  trackError('dead_bug.keep_back_flat', archedBack, errorTracker, feedback);

  // ── Rotação do quadril ────────────────────────────────────────────────────
  const hipAsym = Math.abs(landmarks[LANDMARKS.LEFT_HIP].y - landmarks[LANDMARKS.RIGHT_HIP].y) > HIP_ASYM_THR;
  if (hipAsym) score -= PEN_ASYM;
  trackError('dead_bug.keep_hips_level', hipAsym, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  return { repComplete: false, score: finalScore, quality: quality(finalScore), feedback, phase };
}
