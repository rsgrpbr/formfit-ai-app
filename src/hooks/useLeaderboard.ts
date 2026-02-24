'use client';

import { useEffect, useState } from 'react';
import { useSession } from './useSession';
import { getLeaderboard } from '@/lib/supabase/gamification';
import type { LeaderboardEntry } from '@/types/gamification';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface UseLeaderboardReturn {
  rankings: LeaderboardEntry[];
  userPosition: number | null; // 1-based; null se fora do top-N
  loading: boolean;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useLeaderboard(limit = 20): UseLeaderboardReturn {
  const { user }                      = useSession();
  const [rankings, setRankings]       = useState<LeaderboardEntry[]>([]);
  const [loading,  setLoading]        = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(limit)
      .then(setRankings)
      .finally(() => setLoading(false));
  }, [limit]);

  const userPosition = user
    ? (rankings.findIndex((r) => r.user_id === user.id) + 1) || null
    : null;

  return { rankings, userPosition, loading };
}
