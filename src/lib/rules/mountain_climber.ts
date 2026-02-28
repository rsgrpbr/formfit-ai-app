import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type MountainClimberPhase = 'up' | 'down' | 'transition';

// ── Limiares tolerantes ───────────────────────────────────────────────────────
// KNEE_DRIVE_THR: joelho considerado avançado quando Y(joelho) - Y(quadril) < -THR
// (joelho acima do quadril na tela = drive para frente)
const KNEE_DRIVE_THR = 0.050;  // 0.057 × 0.87 (mais fácil de acionar o drive)

// Alinhamento do quadril na posição de prancha (ombro-quadril-tornozelo)
const HIP_HIGH_THR = 0.079;    // 0.069 × 1.15
const HIP_SAG_THR  = 0.079;    // 0.069 × 1.15

const PEN_HIP_HIGH = 22;
const PEN_HIP_SAG  = 22;

const ERROR_PERSIST_MS = 3000;

function quality(score: number): ExerciseResult['quality'] {
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

export function analyzeMountainClimber(
  _angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: MountainClimberPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const feedback: string[] = [];
  let score = 100;

  // ── Detecção de drive (joelho avançando para o peito) ─────────────────────
  const leftKneeY  = landmarks[LANDMARKS.LEFT_KNEE].y;
  const rightKneeY = landmarks[LANDMARKS.RIGHT_KNEE].y;
  const leftHipY   = landmarks[LANDMARKS.LEFT_HIP].y;
  const rightHipY  = landmarks[LANDMARKS.RIGHT_HIP].y;

  const leftDrive  = leftKneeY  - leftHipY  < -KNEE_DRIVE_THR;
  const rightDrive = rightKneeY - rightHipY < -KNEE_DRIVE_THR;
  const anyDrive   = leftDrive || rightDrive;

  // ── Fase ─────────────────────────────────────────────────────────────────
  let phase: MountainClimberPhase = prevPhase;
  if (anyDrive)  phase = 'down';
  else           phase = 'up';

  if (phase === 'down') errorTracker['_mc._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_mc._was_down'];
  if (repComplete) delete errorTracker['_mc._was_down'];

  // ── Alinhamento do quadril (posição de prancha) ───────────────────────────
  const shoulderY    = (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipY         = (landmarks[LANDMARKS.LEFT_HIP].y      + landmarks[LANDMARKS.RIGHT_HIP].y)      / 2;
  const ankleY       = (landmarks[LANDMARKS.LEFT_ANKLE].y    + landmarks[LANDMARKS.RIGHT_ANKLE].y)    / 2;
  const expectedHipY = shoulderY + (ankleY - shoulderY) * 0.5;
  const hipDev       = hipY - expectedHipY;

  // ── Quadril em pique (muito alto) ─────────────────────────────────────────
  const hipTooHigh = hipDev < -HIP_HIGH_THR;
  if (hipTooHigh) score -= PEN_HIP_HIGH;
  trackError('mountain_climber.hip_too_high', hipTooHigh, errorTracker, feedback);

  // ── Quadril caindo ────────────────────────────────────────────────────────
  const hipSagging = hipDev > HIP_SAG_THR;
  if (hipSagging) score -= PEN_HIP_SAG;
  trackError('mountain_climber.hip_sagging', hipSagging, errorTracker, feedback);

  const finalScore = Math.max(0, score);

  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
