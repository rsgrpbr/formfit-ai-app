import type { JointAngles } from '../angles/joints';
import type { PoseLandmarks } from '../mediapipe/landmarks';
import { LANDMARKS } from '../mediapipe/landmarks';
import type { ErrorTracker } from './squat';

export interface SupermanResult {
  score: number;
  quality: 'optimal' | 'good' | 'corrective';
  feedback: string[];
  holdSeconds: number;
  phase: 'holding' | 'failed';
}

// ── Limiares +15% de tolerância ──────────────────────────────────────────────
// Em posição prona (deitado de bruços), braços/pernas levantados → pulsos/tornozelos
// sobem na tela (Y menor). Limiares medem diferença Y relativa ao ombro/quadril.
const ARM_DELTA_THR  = 0.069;  // 0.06 × 1.15 — pulso deve estar próximo ao nível do ombro
const LEG_DELTA_THR  = 0.069;  // 0.06 × 1.15 — tornozelo deve estar próximo ao nível do quadril
const HEAD_HYPER_THR = 0.046;  // 0.04 × 1.15 — hiperextensão cervical (nariz muito acima dos ombros)

const PEN_NOT_RAISED = 20;
const PEN_ONLY_ARMS  = 15;
const PEN_HEAD_HYPER = 10;

const ERROR_PERSIST_MS = 3000;

function quality(score: number): SupermanResult['quality'] {
  if (score >= 80) return 'optimal';
  if (score >= 60) return 'good';
  return 'corrective';
}

function trackError(
  key: string,
  active: boolean,
  tracker: ErrorTracker,
  feedback: string[]
): void {
  if (active) {
    if (!(key in tracker)) tracker[key] = Date.now();
    if (Date.now() - tracker[key] >= ERROR_PERSIST_MS) feedback.push(key);
  } else {
    delete tracker[key];
  }
}

export function analyzeSuperman(
  _angles: JointAngles,
  landmarks: PoseLandmarks,
  elapsed: number,
  errorTracker: ErrorTracker = {}
): SupermanResult {
  const feedback: string[] = [];
  let score = 100;

  const avgShoulderY = (landmarks[LANDMARKS.LEFT_SHOULDER].y + landmarks[LANDMARKS.RIGHT_SHOULDER].y) / 2;
  const avgWristY    = (landmarks[LANDMARKS.LEFT_WRIST].y    + landmarks[LANDMARKS.RIGHT_WRIST].y)    / 2;
  const avgHipY      = (landmarks[LANDMARKS.LEFT_HIP].y      + landmarks[LANDMARKS.RIGHT_HIP].y)      / 2;
  const avgAnkleY    = (landmarks[LANDMARKS.LEFT_ANKLE].y    + landmarks[LANDMARKS.RIGHT_ANKLE].y)    / 2;
  const noseY        = landmarks[LANDMARKS.NOSE].y;

  // Braços levantados: pulsos próximos ao nível dos ombros (delta Y pequeno)
  const armsUp = Math.abs(avgWristY - avgShoulderY) < ARM_DELTA_THR;
  // Pernas levantadas: tornozelos próximos ao nível do quadril (delta Y pequeno)
  const legsUp = Math.abs(avgAnkleY - avgHipY) < LEG_DELTA_THR;

  // ── Não está levantado ────────────────────────────────────────────────────
  const notRaised = !armsUp && !legsUp;
  if (notRaised) score -= PEN_NOT_RAISED;
  trackError('superman.hold_position', notRaised, errorTracker, feedback);

  // ── Apenas braços levantados ──────────────────────────────────────────────
  const onlyArms = armsUp && !legsUp;
  if (onlyArms) score -= PEN_ONLY_ARMS;
  trackError('superman.only_arms', onlyArms, errorTracker, feedback);

  // ── Hiperextensão cervical (cabeça levantada demais) ──────────────────────
  // Nariz significativamente acima dos ombros na tela (Y menor = mais alto)
  const headHyper = avgShoulderY - noseY > HEAD_HYPER_THR;
  if (headHyper) score -= PEN_HEAD_HYPER;
  trackError('superman.head_too_high', headHyper, errorTracker, feedback);

  const finalScore = Math.max(0, score);

  return {
    score: finalScore,
    quality: quality(finalScore),
    feedback,
    holdSeconds: elapsed,
    phase: finalScore < 40 ? 'failed' : 'holding',
  };
}
