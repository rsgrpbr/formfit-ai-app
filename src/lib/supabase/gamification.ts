import { createClient } from './client';
import type {
  UserXp,
  Badge,
  UserBadge,
  Streak,
  WeeklyChallenge,
  UserChallenge,
  LeaderboardEntry,
  GamificationLevel,
} from '@/types/gamification';

// ── Utilitários de nível (puros) ─────────────────────────────────────────────

export function computeLevel(totalXp: number): GamificationLevel {
  if (totalXp >= 3000) return 'Elite';
  if (totalXp >= 1500) return 'Avançado';
  if (totalXp >= 500)  return 'Intermediário';
  return 'Iniciante';
}

export function xpToNextLevel(totalXp: number): number {
  if (totalXp >= 3000) return 0;
  if (totalXp >= 1500) return 3000 - totalXp;
  if (totalXp >= 500)  return 1500 - totalXp;
  return 500 - totalXp;
}

// ── user_xp ──────────────────────────────────────────────────────────────────

export async function getUserXp(userId: string): Promise<UserXp | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_xp')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) {
    if (error.code !== 'PGRST116') console.error('[getUserXp]', error.message);
    return null;
  }
  return data as UserXp;
}

export async function upsertUserXp(
  userId: string,
  xpDelta: number,
): Promise<UserXp | null> {
  const supabase = createClient();
  const current = await getUserXp(userId);
  const newTotalXp = (current?.total_xp ?? 0) + xpDelta;
  const newLevel = computeLevel(newTotalXp);

  const { data, error } = await supabase
    .from('user_xp')
    .upsert(
      { user_id: userId, total_xp: newTotalXp, level: newLevel, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
    .select()
    .single();

  if (error) { console.error('[upsertUserXp]', error.message); return null; }
  return data as UserXp;
}

// ── streaks ──────────────────────────────────────────────────────────────────

export async function getStreak(userId: string): Promise<Streak | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) {
    if (error.code !== 'PGRST116') console.error('[getStreak]', error.message);
    return null;
  }
  return data as Streak;
}

export async function updateStreak(
  userId: string,
): Promise<{ currentStreak: number; streakMaintained: boolean }> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const current = await getStreak(userId);

  if (current?.last_training_date === today) {
    return { currentStreak: current.current_streak, streakMaintained: true };
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streakMaintained = current?.last_training_date === yesterday;
  const newStreak = streakMaintained ? (current?.current_streak ?? 0) + 1 : 1;
  const longestStreak = Math.max(newStreak, current?.longest_streak ?? 0);

  const { error } = await supabase
    .from('streaks')
    .upsert(
      { user_id: userId, current_streak: newStreak, longest_streak: longestStreak, last_training_date: today },
      { onConflict: 'user_id' },
    );

  if (error) console.error('[updateStreak]', error.message);
  return { currentStreak: newStreak, streakMaintained };
}

// ── badges ───────────────────────────────────────────────────────────────────

export async function getAllBadges(): Promise<Badge[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('badges').select('*');
  if (error) { console.error('[getAllBadges]', error.message); return []; }
  return data as Badge[];
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_badges')
    .select('*, badge:badges(*)')
    .eq('user_id', userId);
  if (error) { console.error('[getUserBadges]', error.message); return []; }
  return data as UserBadge[];
}

export async function awardBadges(
  userId: string,
  badgeIds: string[],
): Promise<void> {
  if (badgeIds.length === 0) return;
  const supabase = createClient();
  const rows = badgeIds.map(badge_id => ({
    user_id: userId,
    badge_id,
    earned_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from('user_badges')
    .upsert(rows, { onConflict: 'user_id,badge_id', ignoreDuplicates: true });
  if (error) console.error('[awardBadges]', error.message);
}

// ── weekly challenges ────────────────────────────────────────────────────────

export async function getActiveWeeklyChallenges(): Promise<WeeklyChallenge[]> {
  const supabase = createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('weekly_challenges')
    .select('*')
    .lte('starts_at', now)
    .gte('ends_at', now);
  if (error) { console.error('[getActiveWeeklyChallenges]', error.message); return []; }
  return data as WeeklyChallenge[];
}

export async function getUserChallenges(userId: string): Promise<UserChallenge[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('user_id', userId);
  if (error) { console.error('[getUserChallenges]', error.message); return []; }
  return data as UserChallenge[];
}

export async function upsertUserChallenge(
  userId: string,
  challengeId: string,
  progressDelta: number,
  targetValue: number,
): Promise<UserChallenge | null> {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from('user_challenges')
    .select('progress, completed_at')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .single();

  const currentProgress = (existing as { progress: number } | null)?.progress ?? 0;
  const newProgress = currentProgress + progressDelta;
  const alreadyCompleted = (existing as { completed_at: string | null } | null)?.completed_at != null;
  const justCompleted = !alreadyCompleted && newProgress >= targetValue;

  const { data, error } = await supabase
    .from('user_challenges')
    .upsert(
      {
        user_id: userId,
        challenge_id: challengeId,
        progress: newProgress,
        completed_at: justCompleted
          ? new Date().toISOString()
          : ((existing as { completed_at: string | null } | null)?.completed_at ?? null),
      },
      { onConflict: 'user_id,challenge_id' },
    )
    .select()
    .single();

  if (error) { console.error('[upsertUserChallenge]', error.message); return null; }
  return data as UserChallenge;
}

// ── leaderboard ──────────────────────────────────────────────────────────────

export async function getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_xp')
    .select('user_id, total_xp, level, profiles!inner(full_name, avatar_url)')
    .order('total_xp', { ascending: false })
    .limit(limit);
  if (error) { console.error('[getLeaderboard]', error.message); return []; }
  return (data ?? []).map((row) => {
    const profile = row.profiles as unknown as { full_name: string | null; avatar_url: string | null };
    return {
      user_id:    row.user_id as string,
      total_xp:   row.total_xp as number,
      level:      row.level as GamificationLevel,
      full_name:  profile.full_name,
      avatar_url: profile.avatar_url,
    };
  });
}
