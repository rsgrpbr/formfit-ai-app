import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ExerciseResult } from './squat';

export type PushupPhase = 'up' | 'down' | 'transition';

const ELBOW_DOWN_MAX = 95;
const ELBOW_UP_MIN   = 155;

export function analyzePushup(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  prevPhase: PushupPhase
): ExerciseResult {
  const elbow = (angles.leftElbow + angles.rightElbow) / 2;
  const feedback: string[] = [];
  let score = 100;

  let phase: PushupPhase = prevPhase;
  if (elbow < ELBOW_DOWN_MAX)    phase = 'down';
  else if (elbow > ELBOW_UP_MIN) phase = 'up';
  else                            phase = 'transition';

  const repComplete = prevPhase === 'down' && phase === 'up';

  // Alinhamento do corpo
  const shoulderY = (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipY      = (landmarks[LANDMARKS.LEFT_HIP].y      + landmarks[LANDMARKS.RIGHT_HIP].y)      / 2;
  const ankleY    = (landmarks[LANDMARKS.LEFT_ANKLE].y    + landmarks[LANDMARKS.RIGHT_ANKLE].y)    / 2;

  const expectedHipY = shoulderY + (ankleY - shoulderY) * 0.5;
  if (Math.abs(hipY - expectedHipY) > 0.08) {
    feedback.push('pushup.keep_body_straight');
    score -= 25;
  }

  // Amplitude incompleta
  if (phase === 'down' && elbow > 110) {
    feedback.push('pushup.go_lower');
    score -= 15;
  }

  // Cotovelos assimétricos
  if (Math.abs(angles.leftElbow - angles.rightElbow) > 20) {
    feedback.push('pushup.align_elbows');
    score -= 10;
  }

  return { repComplete, score: Math.max(0, score), feedback, phase };
}
