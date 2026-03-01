import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type FlutterKickPhase = 'up' | 'down' | 'transition';

// Lying on back, small alternating flutter kicks with legs slightly raised.
// Detect phase via avg ankle height relative to hips.
const LIFTED_THR  = 0.040; // avgAnkleY < avgHipY - THR → legs raised ("down")
const RESTING_THR = 0.020; // avgAnkleY > avgHipY + THR → legs at floor ("up")
const ARCH_THR    = 0.065; // back arching (hip deviation)

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

export function analyzeFlutterKick(
  _angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: FlutterKickPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const avgAnkleY = (landmarks[LANDMARKS.LEFT_ANKLE].y + landmarks[LANDMARKS.RIGHT_ANKLE].y) / 2;
  const avgHipY   = (landmarks[LANDMARKS.LEFT_HIP].y   + landmarks[LANDMARKS.RIGHT_HIP].y)   / 2;
  const feedback: string[] = [];
  let score = 100;

  let phase: FlutterKickPhase = prevPhase;
  if (avgAnkleY < avgHipY - LIFTED_THR)   phase = 'down'; // legs up
  else if (avgAnkleY > avgHipY + RESTING_THR) phase = 'up'; // legs down
  else                                         phase = 'transition';

  if (phase === 'down') errorTracker['_flutter_kick._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_flutter_kick._was_down'];
  if (repComplete) delete errorTracker['_flutter_kick._was_down'];

  // ── Costas arqueadas ──────────────────────────────────────────────────────
  const shoulderY    = (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const ankleY       = (landmarks[LANDMARKS.LEFT_ANKLE].y    + landmarks[LANDMARKS.RIGHT_ANKLE].y)    / 2;
  const expectedHipY = shoulderY + (ankleY - shoulderY) * 0.5;
  const archedBack   = (avgHipY - expectedHipY) > ARCH_THR;
  if (archedBack) score -= PEN_ARCH;
  trackError('flutter_kick.keep_back_flat', archedBack, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
