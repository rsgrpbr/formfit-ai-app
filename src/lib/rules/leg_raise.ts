import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type LegRaisePhase = 'up' | 'down' | 'transition';

// Lying on back, raise both legs toward ceiling.
// Y=0 is top of frame; legs raised = smaller Y than hips.
const RAISED_THR   = 0.055; // ankleY < hipY - THR → legs raised ("down" phase)
const LOWERED_THR  = 0.030; // ankleY > hipY + THR → legs at floor ("up" phase)
const ARCH_THR     = 0.069; // hip deviation from flat line (back arching)

const PEN_ARCH = 18;

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

export function analyzeLegRaise(
  _angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: LegRaisePhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const avgAnkleY = (landmarks[LANDMARKS.LEFT_ANKLE].y + landmarks[LANDMARKS.RIGHT_ANKLE].y) / 2;
  const avgHipY   = (landmarks[LANDMARKS.LEFT_HIP].y   + landmarks[LANDMARKS.RIGHT_HIP].y)   / 2;
  const feedback: string[] = [];
  let score = 100;

  let phase: LegRaisePhase = prevPhase;
  if (avgAnkleY < avgHipY - RAISED_THR)  phase = 'down'; // legs raised
  else if (avgAnkleY > avgHipY + LOWERED_THR) phase = 'up'; // legs lowered
  else                                     phase = 'transition';

  if (phase === 'down') errorTracker['_leg_raise._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_leg_raise._was_down'];
  if (repComplete) delete errorTracker['_leg_raise._was_down'];

  // ── Coluna arqueada (quadril levantando do chão) ──────────────────────────
  const shoulderY    = (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const ankleY       = (landmarks[LANDMARKS.LEFT_ANKLE].y    + landmarks[LANDMARKS.RIGHT_ANKLE].y)    / 2;
  const expectedHipY = shoulderY + (ankleY - shoulderY) * 0.5;
  const archedBack   = (avgHipY - expectedHipY) > ARCH_THR;
  if (archedBack) score -= PEN_ARCH;
  trackError('leg_raise.keep_back_flat', archedBack, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
