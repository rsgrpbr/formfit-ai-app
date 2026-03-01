import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type DonkeyKickPhase = 'up' | 'down' | 'transition';

// Quadruped → kick one leg back (hip extends)
// angles.leftHip / rightHip = shoulder→hip→knee (hip extension angle)
const HIP_DOWN_MIN = 148;   // leg kicked back: hip angle ≥ 148° (extended)
const HIP_UP_MAX   = 110;   // neutral quadruped: hip angle ≤ 110°
const HIP_ROT_THR  = 0.055; // hip Y asymmetry (rotation during kick)
const LIFT_THR     = 130;   // must reach at least 130° for adequate kick

const PEN_ROT   = 18;
const PEN_LIFT  = 15;

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

export function analyzeDonkeyKick(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: DonkeyKickPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const maxHip = Math.max(angles.leftHip, angles.rightHip);
  const feedback: string[] = [];
  let score = 100;

  let phase: DonkeyKickPhase = prevPhase;
  if (maxHip >= HIP_DOWN_MIN)   phase = 'down';
  else if (maxHip <= HIP_UP_MAX) phase = 'up';
  else                            phase = 'transition';

  if (phase === 'down') errorTracker['_donkey_kick._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_donkey_kick._was_down'];
  if (repComplete) delete errorTracker['_donkey_kick._was_down'];

  // ── Rotação do quadril ────────────────────────────────────────────────────
  const hipRot = Math.abs(landmarks[LANDMARKS.LEFT_HIP].y - landmarks[LANDMARKS.RIGHT_HIP].y) > HIP_ROT_THR;
  if (hipRot) score -= PEN_ROT;
  trackError('donkey_kick.keep_hips_level', hipRot, errorTracker, feedback);

  // ── Amplitude insuficiente ────────────────────────────────────────────────
  const notHighEnough = phase === 'down' && maxHip < LIFT_THR;
  if (notHighEnough) score -= PEN_LIFT;
  trackError('donkey_kick.kick_higher', notHighEnough, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
