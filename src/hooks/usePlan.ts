'use client';

import { useEffect, useState } from 'react';
import { useSession } from './useSession';
import { createClient } from '@/lib/supabase/client';

export const FREE_MONTHLY_LIMIT = 5;

export interface PlanInfo {
  plan: 'free' | 'pro' | 'personal';
  canAnalyze: boolean;
  monthlyCount: number;
  loading: boolean;
}

export function usePlan(): PlanInfo {
  const { user, profile, loading: sessionLoading } = useSession();
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [counting, setCounting]         = useState(true);

  useEffect(() => {
    if (sessionLoading) return;

    // Planos pagos podem sempre analisar
    if (!user || !profile || profile.plan !== 'free') {
      setCounting(false);
      return;
    }

    // Conta sessões do mês atual para o plano free
    const supabase     = createClient();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('started_at', startOfMonth.toISOString())
      .then(({ count }) => {
        setMonthlyCount(count ?? 0);
        setCounting(false);
      });
  }, [user, profile, sessionLoading]);

  const plan       = (profile?.plan as 'free' | 'pro' | 'personal') ?? 'free';
  const canAnalyze = plan !== 'free' || monthlyCount < FREE_MONTHLY_LIMIT;

  return {
    plan,
    canAnalyze,
    monthlyCount,
    loading: sessionLoading || counting,
  };
}
