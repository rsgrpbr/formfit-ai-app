'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/supabase/queries';
import { getProfile, updateProfile } from '@/lib/supabase/queries';
import { detectLocale } from '@/lib/detectLocale';

interface UseSessionReturn {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Carrega o profile e aplica sincronizações automáticas:
//   1. locale vazio → detecta pelo navigator.language e salva
//   2. full_name vazio mas presente no user_metadata → sincroniza
async function loadProfile(user: User): Promise<Profile | null> {
  const profile = await getProfile(user.id);
  if (!profile) return null;

  const updates: Partial<Pick<Profile, 'full_name' | 'locale'>> = {};

  // 1. Auto-detect locale se o profile não tiver idioma definido
  if (!profile.locale) {
    updates.locale = detectLocale(
      typeof navigator !== 'undefined' ? (navigator.language ?? 'en') : 'en'
    );
  }

  // 2. Sincroniza full_name do user_metadata
  if (!profile.full_name) {
    const metaName = (user.user_metadata as Record<string, string | undefined>)?.full_name?.trim();
    if (metaName) updates.full_name = metaName;
  }

  if (Object.keys(updates).length > 0) {
    await updateProfile(user.id, updates);
    return { ...profile, ...updates };
  }

  return profile;
}

export function useSession(): UseSessionReturn {
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user).then(setProfile);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user).then(setProfile);
      else setProfile(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  }, []);

  return { user, profile, loading, signOut };
}
