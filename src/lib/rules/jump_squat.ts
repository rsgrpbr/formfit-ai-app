import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type JumpSquatPhase = 'up' | 'down' | 'transition';

const KNEE_DOWN_MAX = 130;   // deeper than regular squat
const KNEE_UP_MIN   = 158;   // fully extended (landing / standing)
const DEPTH_THR     = 120;   // must reach ≤ 120° for full depth
const ASYM_THR      = 22;    // knee angle asymmetry on landing

const PEN_DEPTH = 15;
const PEN_ASYM  = 12;

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

export function analyzeJumpSquat(
  angles: JointAngles,
  _landmarks: PoseLandmarks,
  prevPhase: JumpSquatPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
  const feedback: string[] = [];
  let score = 100;

  let phase: JumpSquatPhase = prevPhase;
  if (avgKnee < KNEE_DOWN_MAX)    phase = 'down';
  else if (avgKnee > KNEE_UP_MIN) phase = 'up';
  else                             phase = 'transition';

  if (phase === 'down') errorTracker['_jump_squat._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_jump_squat._was_down'];
  if (repComplete) delete errorTracker['_jump_squat._was_down'];

  // ── Profundidade insuficiente ─────────────────────────────────────────────
  const tooShallow = phase === 'down' && avgKnee > DEPTH_THR;
  if (tooShallow) score -= PEN_DEPTH;
  trackError('jump_squat.go_deeper', tooShallow, errorTracker, feedback);

  // ── Aterrissagem assimétrica ──────────────────────────────────────────────
  const landingAsym = Math.abs(angles.leftKnee - angles.rightKnee) > ASYM_THR;
  if (landingAsym) score -= PEN_ASYM;
  trackError('jump_squat.land_evenly', landingAsym, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
