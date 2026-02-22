import type { NormalizedLandmark } from '../mediapipe/landmarks';

/** Converte radianos para graus */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/** Calcula o ângulo em graus entre três pontos (A–B–C), onde B é o vértice */
export function angleBetweenPoints(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number {
  const ax = a.x - b.x;
  const ay = a.y - b.y;
  const cx = c.x - b.x;
  const cy = c.y - b.y;

  const dot = ax * cx + ay * cy;
  const magA = Math.sqrt(ax * ax + ay * ay);
  const magC = Math.sqrt(cx * cx + cy * cy);

  if (magA === 0 || magC === 0) return 0;

  const cosAngle = Math.min(1, Math.max(-1, dot / (magA * magC)));
  return toDegrees(Math.acos(cosAngle));
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
