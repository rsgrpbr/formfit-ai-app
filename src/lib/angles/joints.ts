import { angleBetweenPoints } from './calculator';
import { LANDMARKS, type PoseLandmarks } from '../mediapipe/landmarks';

export interface JointAngles {
  leftKnee: number;
  rightKnee: number;
  leftHip: number;
  rightHip: number;
  leftElbow: number;
  rightElbow: number;
  leftShoulder: number;
  rightShoulder: number;
  leftAnkle: number;
  rightAnkle: number;
  spine: number;
}

export function computeJointAngles(lm: PoseLandmarks): JointAngles {
  const L = LANDMARKS;
  return {
    leftKnee:      angleBetweenPoints(lm[L.LEFT_HIP],      lm[L.LEFT_KNEE],    lm[L.LEFT_ANKLE]),
    rightKnee:     angleBetweenPoints(lm[L.RIGHT_HIP],     lm[L.RIGHT_KNEE],   lm[L.RIGHT_ANKLE]),
    leftHip:       angleBetweenPoints(lm[L.LEFT_SHOULDER], lm[L.LEFT_HIP],     lm[L.LEFT_KNEE]),
    rightHip:      angleBetweenPoints(lm[L.RIGHT_SHOULDER],lm[L.RIGHT_HIP],    lm[L.RIGHT_KNEE]),
    leftElbow:     angleBetweenPoints(lm[L.LEFT_SHOULDER], lm[L.LEFT_ELBOW],   lm[L.LEFT_WRIST]),
    rightElbow:    angleBetweenPoints(lm[L.RIGHT_SHOULDER],lm[L.RIGHT_ELBOW],  lm[L.RIGHT_WRIST]),
    leftShoulder:  angleBetweenPoints(lm[L.LEFT_ELBOW],    lm[L.LEFT_SHOULDER],lm[L.LEFT_HIP]),
    rightShoulder: angleBetweenPoints(lm[L.RIGHT_ELBOW],   lm[L.RIGHT_SHOULDER],lm[L.RIGHT_HIP]),
    leftAnkle:     angleBetweenPoints(lm[L.LEFT_KNEE],     lm[L.LEFT_ANKLE],   lm[L.LEFT_FOOT_INDEX]),
    rightAnkle:    angleBetweenPoints(lm[L.RIGHT_KNEE],    lm[L.RIGHT_ANKLE],  lm[L.RIGHT_FOOT_INDEX]),
    spine:         angleBetweenPoints(lm[L.LEFT_SHOULDER], lm[L.LEFT_HIP],     lm[L.LEFT_KNEE]),
  };
}
