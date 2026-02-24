// ── Constantes XP ────────────────────────────────────────────────────────────

export const XP_SESSION_BASE      = 50;
export const XP_GOOD_SCORE_BONUS  = 20;  // avg_score >= 80
export const XP_GREAT_SCORE_BONUS = 50;  // avg_score >= 95 (substitui, não acumula)
export const XP_PER_GOOD_REP      = 5;
export const XP_STREAK_BONUS      = 30;
export const XP_CHALLENGE_BONUS   = 200;

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface SessionXpInput {
  avgScore: number;
  goodReps: number;
  streakMaintained: boolean;
}

export interface SessionXpBreakdown {
  base: number;
  scoreBonus: number;
  repBonus: number;
  streakBonus: number;
  total: number;
}

// ── Cálculo ──────────────────────────────────────────────────────────────────

export function computeSessionXp(input: SessionXpInput): SessionXpBreakdown {
  const base = XP_SESSION_BASE;

  let scoreBonus = 0;
  if (input.avgScore >= 95) {
    scoreBonus = XP_GREAT_SCORE_BONUS;
  } else if (input.avgScore >= 80) {
    scoreBonus = XP_GOOD_SCORE_BONUS;
  }

  const repBonus    = input.goodReps * XP_PER_GOOD_REP;
  const streakBonus = input.streakMaintained ? XP_STREAK_BONUS : 0;

  return {
    base,
    scoreBonus,
    repBonus,
    streakBonus,
    total: base + scoreBonus + repBonus + streakBonus,
  };
}
