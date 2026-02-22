import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';

export interface ExerciseResult {
  repComplete: boolean;
  score: number;        // 0–100
  feedback: string[];   // chaves de i18n
  phase: 'up' | 'down' | 'transition';
}

export type SquatPhase = 'up' | 'down' | 'transition';

const KNEE_DOWN_MAX  = 100;
const KNEE_UP_MIN    = 160;
const BACK_TILT_MAX  = 45;

export function analyzeSquat(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: SquatPhase
): ExerciseResult {
  const knee = (angles.leftKnee + angles.rightKnee) / 2;
  const feedback: string[] = [];
  let score = 100;

  let phase: SquatPhase = prevPhase;
  if (knee < KNEE_DOWN_MAX)    phase = 'down';
  else if (knee > KNEE_UP_MIN) phase = 'up';
  else                          phase = 'transition';

  const repComplete = prevPhase === 'down' && phase === 'up';

  // Joelhos passando os pés
  const lKneeX = landmarks[LANDMARKS.LEFT_KNEE].x;
  const lToeX  = landmarks[LANDMARKS.LEFT_FOOT_INDEX].x;
  if (Math.abs(lKneeX - lToeX) > 0.08) {
    feedback.push('squat.knees_over_toes');
    score -= 20;
  }

  // Profundidade insuficiente
  if (phase === 'down' && knee > 110) {
    feedback.push('squat.go_deeper');
    score -= 15;
  }

  // Costas inclinadas demais
  if (angles.spine < (180 - BACK_TILT_MAX)) {
    feedback.push('squat.keep_back_straight');
    score -= 20;
  }

  return { repComplete, score: Math.max(0, score), feedback, phase };
}
