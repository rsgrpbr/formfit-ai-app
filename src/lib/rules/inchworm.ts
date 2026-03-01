import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type InchwormPhase = 'up' | 'down' | 'transition';

// Walk hands out to plank, walk back to standing.
// "down" = plank position (body horizontal)
// "up"   = standing (body vertical)
const PLANK_SPREAD_MAX  = 0.15; // |shoulderY - ankleY| < 0.15 = horizontal/plank
const STAND_SPREAD_MIN  = 0.30; // |shoulderY - ankleY| > 0.30 = vertical/standing
const BODY_ALIGN_THR    = 0.100; // hip deviation in plank
const KNEE_BEND_THR     = 130;  // knees should be straight in plank

const PEN_HIPS   = 18;
const PEN_KNEES  = 12;

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

export function analyzeInchworm(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: InchwormPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const shoulderY = (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const ankleY    = (landmarks[LANDMARKS.LEFT_ANKLE].y    + landmarks[LANDMARKS.RIGHT_ANKLE].y)    / 2;
  const bodySpread = Math.abs(shoulderY - ankleY);
  const feedback: string[] = [];
  let score = 100;

  let phase: InchwormPhase = prevPhase;
  if (bodySpread < PLANK_SPREAD_MAX)      phase = 'down'; // horizontal/plank
  else if (bodySpread > STAND_SPREAD_MIN) phase = 'up';   // vertical/standing
  else                                     phase = 'transition';

  if (phase === 'down') errorTracker['_inchworm._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_inchworm._was_down'];
  if (repComplete) delete errorTracker['_inchworm._was_down'];

  // ── Quadril desalinhado na prancha ────────────────────────────────────────
  const hipY         = (landmarks[LANDMARKS.LEFT_HIP].y + landmarks[LANDMARKS.RIGHT_HIP].y) / 2;
  const expectedHipY = shoulderY + (ankleY - shoulderY) * 0.5;
  const bodyHorizontal = bodySpread < 0.20;
  const hipsOut = bodyHorizontal && Math.abs(hipY - expectedHipY) > BODY_ALIGN_THR;
  if (hipsOut) score -= PEN_HIPS;
  trackError('inchworm.keep_hips_aligned', hipsOut, errorTracker, feedback);

  // ── Joelhos dobrados na prancha ───────────────────────────────────────────
  const avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
  const kneeBent = bodyHorizontal && avgKnee < KNEE_BEND_THR;
  if (kneeBent) score -= PEN_KNEES;
  trackError('inchworm.keep_legs_straight', kneeBent, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
