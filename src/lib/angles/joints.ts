import { angleBetweenPoints } from './calculator';
import { AngleBuffer } from './smoothing';
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

export const angleBuffer = new AngleBuffer();

export function computeJointAngles(lm: PoseLandmarks): JointAngles {
  const L = LANDMARKS;
  const a = (key: string, ...pts: Parameters<typeof angleBetweenPoints>) =>
    angleBuffer.smooth(key, angleBetweenPoints(...pts));
  return {
    leftKnee:      a('leftKnee',      lm[L.LEFT_HIP],       lm[L.LEFT_KNEE],     lm[L.LEFT_ANKLE]),
    rightKnee:     a('rightKnee',     lm[L.RIGHT_HIP],      lm[L.RIGHT_KNEE],    lm[L.RIGHT_ANKLE]),
    leftHip:       a('leftHip',       lm[L.LEFT_SHOULDER],  lm[L.LEFT_HIP],      lm[L.LEFT_KNEE]),
    rightHip:      a('rightHip',      lm[L.RIGHT_SHOULDER], lm[L.RIGHT_HIP],     lm[L.RIGHT_KNEE]),
    leftElbow:     a('leftElbow',     lm[L.LEFT_SHOULDER],  lm[L.LEFT_ELBOW],    lm[L.LEFT_WRIST]),
    rightElbow:    a('rightElbow',    lm[L.RIGHT_SHOULDER], lm[L.RIGHT_ELBOW],   lm[L.RIGHT_WRIST]),
    leftShoulder:  a('leftShoulder',  lm[L.LEFT_ELBOW],     lm[L.LEFT_SHOULDER], lm[L.LEFT_HIP]),
    rightShoulder: a('rightShoulder', lm[L.RIGHT_ELBOW],    lm[L.RIGHT_SHOULDER],lm[L.RIGHT_HIP]),
    leftAnkle:     a('leftAnkle',     lm[L.LEFT_KNEE],      lm[L.LEFT_ANKLE],    lm[L.LEFT_FOOT_INDEX]),
    rightAnkle:    a('rightAnkle',    lm[L.RIGHT_KNEE],     lm[L.RIGHT_ANKLE],   lm[L.RIGHT_FOOT_INDEX]),
    spine:         a('spine',         lm[L.LEFT_SHOULDER],  lm[L.LEFT_HIP],      lm[L.LEFT_KNEE]),
  };
}
