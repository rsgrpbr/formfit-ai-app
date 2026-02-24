// ── Tipos centralizados de Gamificação ───────────────────────────────────────

export type GamificationLevel =
  | 'Iniciante'
  | 'Intermediário'
  | 'Avançado'
  | 'Elite';

export interface UserXp {
  user_id: string;
  total_xp: number;
  level: GamificationLevel;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  condition_type: string;
  condition_value: number;
}

export interface UserBadge {
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge: Badge;
}

export interface Streak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_training_date: string | null;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  exercise_id: string | null;
  target_value: number;
  starts_at: string;
  ends_at: string;
}

export interface UserChallenge {
  user_id: string;
  challenge_id: string;
  progress: number;
  completed_at: string | null;
}

export interface LeaderboardEntry {
  user_id: string;
  total_xp: number;
  level: GamificationLevel;
  full_name: string | null;
  avatar_url: string | null;
}

// Resultado retornado por processGamification() — usado no modal pós-sessão
export interface GamificationResult {
  xpEarned: number;
  newTotalXp: number;
  newLevel: GamificationLevel;
  previousLevel: GamificationLevel;
  leveledUp: boolean;
  earnedBadges: Badge[];
  streakDays: number;
  streakBonus: boolean;
}

// Input que handleStop coleta e passa para triggerGamification
export interface SessionGamificationInput {
  userId: string;
  exerciseSlug: string;
  totalReps: number;
  goodReps: number;
  avgScore: number;
  sessionHour: number; // new Date().getHours() no início da sessão
}
