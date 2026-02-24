import type { Badge } from '@/types/gamification';

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface BadgeCheckInput {
  allBadges: Badge[];
  earnedBadgeIds: Set<string>;
  sessionCount: number;           // sessões completas incluindo esta
  currentStreak: number;
  avgScore: number;
  totalRepsAllTime: number;       // acumulado em profiles.total_reps
  exerciseSlug: string;
  sessionHour: number;            // 0–23, para badge 'early_morning'
  highScoreSessionCount: number;  // sessões com avg_score >= 95
  exerciseSessionCounts: Record<string, number>; // slug → count
}

// ── Verificação ──────────────────────────────────────────────────────────────

export function checkNewlyEarnedBadges(input: BadgeCheckInput): Badge[] {
  const newly: Badge[] = [];

  for (const badge of input.allBadges) {
    if (input.earnedBadgeIds.has(badge.id)) continue;

    const { condition_type, condition_value } = badge;
    let earned = false;

    switch (condition_type) {
      case 'sessions':
        earned = input.sessionCount >= condition_value;
        break;
      case 'streak':
        earned = input.currentStreak >= condition_value;
        break;
      case 'score':
        earned = input.avgScore >= condition_value;
        break;
      case 'score_triple':
        earned = input.highScoreSessionCount >= 3;
        break;
      case 'total_reps':
        earned = input.totalRepsAllTime >= condition_value;
        break;
      case 'early_morning':
        earned = input.sessionHour < 8;
        break;
      case 'exercise_squat':
        earned = (input.exerciseSessionCounts['squat'] ?? 0) >= condition_value;
        break;
      case 'exercise_plank':
        earned = (input.exerciseSessionCounts['plank'] ?? 0) >= condition_value;
        break;
      case 'exercise_pushup':
        earned = (input.exerciseSessionCounts['pushup'] ?? 0) >= condition_value;
        break;
      case 'exercise_lunge':
        earned = (input.exerciseSessionCounts['lunge'] ?? 0) >= condition_value;
        break;
    }

    if (earned) newly.push(badge);
  }

  return newly;
}
