import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult } from './squat';

export type LungePhase = 'up' | 'down' | 'transition';

const FRONT_KNEE_DOWN_MAX = 105;
const FRONT_KNEE_UP_MIN   = 160;

export function analyzeLunge(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: LungePhase
): ExerciseResult {
  const frontKnee = Math.min(angles.leftKnee, angles.rightKnee);
  const feedback: string[] = [];
  let score = 100;

  let phase: LungePhase = prevPhase;
  if (frontKnee < FRONT_KNEE_DOWN_MAX)    phase = 'down';
  else if (frontKnee > FRONT_KNEE_UP_MIN) phase = 'up';
  else                                     phase = 'transition';

  const repComplete = prevPhase === 'down' && phase === 'up';

  // Joelho da frente alinhado com o dedo do pé
  const frontIsLeft = angles.leftKnee < angles.rightKnee;
  const kneeX = frontIsLeft ? landmarks[LANDMARKS.LEFT_KNEE].x       : landmarks[LANDMARKS.RIGHT_KNEE].x;
  const toeX  = frontIsLeft ? landmarks[LANDMARKS.LEFT_FOOT_INDEX].x : landmarks[LANDMARKS.RIGHT_FOOT_INDEX].x;

  if (Math.abs(kneeX - toeX) > 0.1) {
    feedback.push('lunge.knee_over_toe');
    score -= 20;
  }

  // Tronco ereto
  if (angles.spine < 140) {
    feedback.push('lunge.keep_torso_upright');
    score -= 20;
  }

  // Profundidade
  if (phase === 'down' && frontKnee > 115) {
    feedback.push('lunge.go_deeper');
    score -= 15;
  }

  return { repComplete, score: Math.max(0, score), feedback, phase };
}
