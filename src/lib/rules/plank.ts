import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';

export interface PlankResult {
  score: number;
  feedback: string[];
  holdSeconds: number;
  phase: 'holding' | 'failed';
}

export function analyzePlank(
  angles: JointAngles,
  landmarks: PoseLandmarks,
  elapsed: number
): PlankResult {
  const feedback: string[] = [];
  let score = 100;

  const shoulderY = (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const hipY      = (landmarks[LANDMARKS.LEFT_HIP].y      + landmarks[LANDMARKS.RIGHT_HIP].y)      / 2;
  const ankleY    = (landmarks[LANDMARKS.LEFT_ANKLE].y    + landmarks[LANDMARKS.RIGHT_ANKLE].y)    / 2;

  const expectedHipY = shoulderY + (ankleY - shoulderY) * 0.5;
  const hipDev = hipY - expectedHipY;

  if (hipDev < -0.06) {
    feedback.push('plank.lower_hips');
    score -= 30;
  }
  if (hipDev > 0.06) {
    feedback.push('plank.raise_hips');
    score -= 30;
  }

  const shoulderDiff = Math.abs(
    landmarks[LANDMARKS.LEFT_SHOULDER].y - landmarks[LANDMARKS.RIGHT_SHOULDER].y
  );
  if (shoulderDiff > 0.05) {
    feedback.push('plank.level_shoulders');
    score -= 15;
  }

  return {
    score: Math.max(0, score),
    feedback,
    holdSeconds: elapsed,
    phase: score < 40 ? 'failed' : 'holding',
  };
}
