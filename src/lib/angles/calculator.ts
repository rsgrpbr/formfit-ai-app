import type { NormalizedLandmark } from '../mediapipe/landmarks';

/** Converte radianos para graus */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/** Calcula o ângulo em graus entre três pontos (A–B–C) usando vetores 3D, onde B é o vértice */
export function angleBetweenPoints(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
  const v2 = { x: c.x - b.x, y: c.y - b.y, z: (c.z ?? 0) - (b.z ?? 0) };
  const dot  = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2 + v1.z ** 2);
  const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2 + v2.z ** 2);
  if (mag1 === 0 || mag2 === 0) return 0;
  return Math.acos(Math.min(1, Math.max(-1, dot / (mag1 * mag2)))) * (180 / Math.PI);
}

/** Distância euclidiana entre dois pontos (2D) */
export function distance2D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Retorna o ponto médio entre dois landmarks */
export function midpoint(
  a: NormalizedLandmark,
  b: NormalizedLandmark
): NormalizedLandmark {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
}

/** Normaliza um valor de [min, max] para [0, 1] */
export function normalize(value: number, min: number, max: number): number {
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}
