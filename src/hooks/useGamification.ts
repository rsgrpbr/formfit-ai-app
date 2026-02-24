'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from './useSession';
import {
  getUserXp,
  getUserBadges,
  getStreak,
  computeLevel,
  xpToNextLevel,
} from '@/lib/supabase/gamification';
import { processGamification } from '@/lib/gamification/processGamification';
import type {
  UserXp,
  UserBadge,
  Streak,
  GamificationLevel,
  GamificationResult,
  SessionGamificationInput,
} from '@/types/gamification';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface UseGamificationReturn {
  totalXp: number;
  level: GamificationLevel;
  nextLevel: GamificationLevel | null;
  xpToNext: number;
  badges: UserBadge[];
  recentBadge: UserBadge | null;
  streak: Streak | null;
  loading: boolean;
  triggerGamification: (input: SessionGamificationInput) => Promise<GamificationResult | null>;
}

const LEVEL_ORDER: GamificationLevel[] = [
  'Iniciante',
  'Intermediário',
  'Avançado',
  'Elite',
];

function nextLevelFor(level: GamificationLevel): GamificationLevel | null {
  const idx = LEVEL_ORDER.indexOf(level);
  return idx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[idx + 1] : null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useGamification(): UseGamificationReturn {
  const { user } = useSession();
  const [xpRow,       setXpRow]       = useState<UserXp | null>(null);
  const [badges,      setBadges]      = useState<UserBadge[]>([]);
  const [streak,      setStreak]      = useState<Streak | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [recentBadge, setRecentBadge] = useState<UserBadge | null>(null);

  const refreshAll = useCallback(
    async (uid: string) => {
      const [xp, ub, str] = await Promise.all([
        getUserXp(uid),
        getUserBadges(uid),
        getStreak(uid),
      ]);
      setXpRow(xp);
      setBadges(ub);
      setStreak(str);
      const sorted = [...ub].sort(
        (a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime(),
      );
      setRecentBadge(sorted[0] ?? null);
    },
    [],
  );

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    refreshAll(user.id).finally(() => setLoading(false));
  }, [user, refreshAll]);

  const triggerGamification = useCallback(
    async (input: SessionGamificationInput): Promise<GamificationResult | null> => {
      if (!user) return null;
      const result = await processGamification(input);
      await refreshAll(user.id);
      return result;
    },
    [user, refreshAll],
  );

  const totalXp  = xpRow?.total_xp ?? 0;
  const level    = computeLevel(totalXp);
  const nextLevel = nextLevelFor(level);
  const xpToNext = xpToNextLevel(totalXp);

  return {
    totalXp,
    level,
    nextLevel,
    xpToNext,
    badges,
    recentBadge,
    streak,
    loading,
    triggerGamification,
  };
}
