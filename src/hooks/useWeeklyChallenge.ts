'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from './useSession';
import {
  getActiveWeeklyChallenges,
  getUserChallenges,
  upsertUserChallenge,
} from '@/lib/supabase/gamification';
import type { WeeklyChallenge, UserChallenge } from '@/types/gamification';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface UseWeeklyChallengeReturn {
  challenge: WeeklyChallenge | null;
  userChallenge: UserChallenge | null;
  progress: number;
  timeLeft: string;
  isCompleted: boolean;
  loading: boolean;
  updateProgress: (delta: number) => Promise<void>;
}

// ── Utilitário ───────────────────────────────────────────────────────────────

function formatTimeLeft(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Encerrado';
  const days  = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days} dia${days > 1 ? 's' : ''}`;
  return `${hours}h`;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useWeeklyChallenge(): UseWeeklyChallengeReturn {
  const { user } = useSession();
  const [challenge,     setChallenge]     = useState<WeeklyChallenge | null>(null);
  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    Promise.all([
      getActiveWeeklyChallenges(),
      getUserChallenges(user.id),
    ]).then(([active, userChallenges]) => {
      const first = active[0] ?? null;
      setChallenge(first);
      if (first) {
        const uc = userChallenges.find((c) => c.challenge_id === first.id) ?? null;
        setUserChallenge(uc);
      }
    }).finally(() => setLoading(false));
  }, [user]);

  const updateProgress = useCallback(
    async (delta: number) => {
      if (!user || !challenge) return;
      const updated = await upsertUserChallenge(
        user.id,
        challenge.id,
        delta,
        challenge.target_value,
      );
      setUserChallenge(updated);
    },
    [user, challenge],
  );

  const progress    = userChallenge?.progress ?? 0;
  const isCompleted = userChallenge?.completed_at != null;
  const timeLeft    = challenge ? formatTimeLeft(challenge.ends_at) : '';

  return {
    challenge,
    userChallenge,
    progress,
    timeLeft,
    isCompleted,
    loading,
    updateProgress,
  };
}
