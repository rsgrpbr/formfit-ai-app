'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/supabase/queries';
import { getProfile, updateProfile } from '@/lib/supabase/queries';

interface UseSessionReturn {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Se o profile não tiver full_name mas o user_metadata tiver, sincroniza.
async function loadProfile(user: User): Promise<Profile | null> {
  const profile = await getProfile(user.id);
  if (profile && !profile.full_name) {
    const metaName = (user.user_metadata as Record<string, string | undefined>)?.full_name?.trim();
    if (metaName) {
      await updateProfile(user.id, { full_name: metaName });
      return { ...profile, full_name: metaName };
    }
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
