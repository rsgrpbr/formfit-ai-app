import { computeSessionXp } from './xpEngine';
import { checkNewlyEarnedBadges } from './badgeEngine';
import {
  getUserXp,
  computeLevel,
  upsertUserXp,
  updateStreak,
  getAllBadges,
  getUserBadges,
  awardBadges,
} from '@/lib/supabase/gamification';
import { createClient } from '@/lib/supabase/client';
import type {
  GamificationResult,
  SessionGamificationInput,
  GamificationLevel,
} from '@/types/gamification';

const SAFE_FALLBACK: GamificationResult = {
  xpEarned:      0,
  newTotalXp:    0,
  newLevel:      'Iniciante',
  previousLevel: 'Iniciante',
  leveledUp:     false,
  earnedBadges:  [],
  streakDays:    0,
  streakBonus:   false,
};

export async function processGamification(
  input: SessionGamificationInput,
): Promise<GamificationResult> {
  const { userId, exerciseSlug, totalReps, goodReps, avgScore, sessionHour } = input;
  const supabase = createClient();

  try {
    // 1. Atualiza streak (precisa ser antes do XP para calcular streakBonus)
    const { currentStreak, streakMaintained } = await updateStreak(userId);

    // 2. Calcula XP da sessão (puro)
    const xpBreakdown = computeSessionXp({ avgScore, goodReps, streakMaintained });

    // 3. Busca paralela de dados para badge check e XP
    const [
      previousXpRow,
      allBadges,
      earnedBadgesRows,
      sessionCountResult,
      highScoreCountResult,
      exercisesResult,
      sessionExercisesResult,
      profileResult,
    ] = await Promise.all([
      getUserXp(userId),
      getAllBadges(),
      getUserBadges(userId),
      supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('ended_at', 'is', null),
      supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('avg_score', 95)
        .not('ended_at', 'is', null),
      supabase.from('exercises').select('id, slug'),
      supabase
        .from('sessions')
        .select('exercise_id')
        .eq('user_id', userId)
        .not('ended_at', 'is', null),
      supabase
        .from('profiles')
        .select('total_reps')
        .eq('id', userId)
        .single(),
    ]);

    const sessionCount        = sessionCountResult.count ?? 1;
    const highScoreCount      = highScoreCountResult.count ?? 0;
    const previousLevel: GamificationLevel = previousXpRow?.level ?? 'Iniciante';

    // Monta mapa exerciseId → slug
    const exerciseMap = new Map<string, string>();
    (exercisesResult.data ?? []).forEach((e) => {
      if (e.id && e.slug) exerciseMap.set(e.id as string, e.slug as string);
    });

    // Conta sessões por slug de exercício
    const exerciseSessionCounts: Record<string, number> = {};
    (sessionExercisesResult.data ?? []).forEach((s) => {
      const slug = exerciseMap.get(s.exercise_id as string);
      if (slug) exerciseSessionCounts[slug] = (exerciseSessionCounts[slug] ?? 0) + 1;
    });

    const profileTotalReps = (profileResult.data as { total_reps: number } | null)?.total_reps ?? 0;
    const totalRepsAllTime = profileTotalReps + totalReps;

    // 4. Identifica badges novos (antes de upsert para não contar XP do badge no check)
    const earnedBadgeIds = new Set(earnedBadgesRows.map((ub) => ub.badge_id));
    const newlyEarnedBadges = checkNewlyEarnedBadges({
      allBadges,
      earnedBadgeIds,
      sessionCount,
      currentStreak,
      avgScore,
      totalRepsAllTime,
      exerciseSlug,
      sessionHour,
      highScoreSessionCount: highScoreCount,
      exerciseSessionCounts,
    });

    // 5. Soma XP de badges + sessão
    const badgeXp = newlyEarnedBadges.reduce((sum, b) => sum + b.xp_reward, 0);
    const totalXpDelta = xpBreakdown.total + badgeXp;

    // 6. Persiste XP e rewards em paralelo
    const [newXpRow] = await Promise.all([
      upsertUserXp(userId, totalXpDelta),
      awardBadges(userId, newlyEarnedBadges.map((b) => b.id)),
      supabase
        .from('profiles')
        .update({ total_reps: totalRepsAllTime })
        .eq('id', userId),
    ]);

    const newTotalXp = newXpRow?.total_xp ?? (previousXpRow?.total_xp ?? 0) + totalXpDelta;
    const newLevel   = computeLevel(newTotalXp);
    const leveledUp  = newLevel !== previousLevel;

    return {
      xpEarned:      totalXpDelta,
      newTotalXp,
      newLevel,
      previousLevel,
      leveledUp,
      earnedBadges:  newlyEarnedBadges,
      streakDays:    currentStreak,
      streakBonus:   streakMaintained,
    };
  } catch (err) {
    console.error('[processGamification] Erro não-fatal:', err);
    return SAFE_FALLBACK;
  }
}
