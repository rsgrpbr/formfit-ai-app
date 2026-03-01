import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult, ErrorTracker } from './squat';

export type SumoSquatPhase = 'up' | 'down' | 'transition';

const KNEE_DOWN_MAX    = 130;
const KNEE_UP_MIN      = 155;
const DEPTH_THR        = 125;
const NARROW_STANCE_THR = 1.3;  // ankleSpread / hipSpread — wide stance needed
const KNEE_CAVE_THR    = 0.055; // knee X inside ankle X = caving inward

const PEN_SHALLOW  = 15;
const PEN_NARROW   = 18;
const PEN_CAVE     = 18;

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

export function analyzeSumoSquat(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: SumoSquatPhase,
  errorTracker: ErrorTracker = {}
): ExerciseResult {
  const avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
  const feedback: string[] = [];
  let score = 100;

  let phase: SumoSquatPhase = prevPhase;
  if (avgKnee < KNEE_DOWN_MAX)    phase = 'down';
  else if (avgKnee > KNEE_UP_MIN) phase = 'up';
  else                             phase = 'transition';

  if (phase === 'down') errorTracker['_sumo_squat._was_down'] = 1;
  const repComplete = prevPhase !== 'up' && phase === 'up' && !!errorTracker['_sumo_squat._was_down'];
  if (repComplete) delete errorTracker['_sumo_squat._was_down'];

  // ── Profundidade insuficiente ─────────────────────────────────────────────
  const tooShallow = phase === 'down' && avgKnee > DEPTH_THR;
  if (tooShallow) score -= PEN_SHALLOW;
  trackError('sumo_squat.go_deeper', tooShallow, errorTracker, feedback);

  // ── Base muito estreita ───────────────────────────────────────────────────
  const ankleSpread = Math.abs(landmarks[LANDMARKS.LEFT_ANKLE].x - landmarks[LANDMARKS.RIGHT_ANKLE].x);
  const hipSpread   = Math.abs(landmarks[LANDMARKS.LEFT_HIP].x   - landmarks[LANDMARKS.RIGHT_HIP].x);
  const narrowStance = hipSpread > 0.01 && ankleSpread / hipSpread < NARROW_STANCE_THR;
  if (narrowStance) score -= PEN_NARROW;
  trackError('sumo_squat.widen_stance', narrowStance, errorTracker, feedback);

  // ── Joelhos caindo para dentro ────────────────────────────────────────────
  const lKneeX  = landmarks[LANDMARKS.LEFT_KNEE].x;
  const lAnkleX = landmarks[LANDMARKS.LEFT_ANKLE].x;
  const rKneeX  = landmarks[LANDMARKS.RIGHT_KNEE].x;
  const rAnkleX = landmarks[LANDMARKS.RIGHT_ANKLE].x;
  const kneeCave = (lAnkleX - lKneeX > KNEE_CAVE_THR) || (rKneeX - rAnkleX > KNEE_CAVE_THR);
  if (kneeCave) score -= PEN_CAVE;
  trackError('sumo_squat.knees_out', kneeCave, errorTracker, feedback);

  const finalScore = Math.max(0, score);
  if (repComplete && finalScore >= 80) feedback.unshift('general.perfect_form');
  else if (repComplete && finalScore >= 60) feedback.unshift('general.rep_complete');

  return { repComplete, score: finalScore, quality: quality(finalScore), feedback, phase };
}
