import { createClient } from './client';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  locale: string;
  plan: 'free' | 'pro' | 'personal' | 'annual';
  streak_days: number;
  total_reps: number;
}

export interface Session {
  id: string;
  user_id: string;
  exercise_id: string;
  started_at: string;
  ended_at: string | null;
  total_reps: number;
  good_reps: number;
  bad_reps: number;
  avg_score: number;
  feedback_json: unknown;
}

export interface Exercise {
  id: string;
  slug: string;
  name_pt: string;
  name_en: string;
  name_es: string | null;
  name_fr: string | null;
  category: string;
  difficulty: string;
  muscles: string[];
}

// ── Profile ──────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) { console.error('[getProfile]', error.message); return null; }
  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'avatar_url' | 'locale'>>
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
  return !error;
}

// ── Exercises ─────────────────────────────────────────────

export async function getExercises(): Promise<Exercise[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('exercises').select('*');
  if (error) { console.error('[getExercises]', error.message); return []; }
  return data as Exercise[];
}

export async function getExerciseBySlug(slug: string): Promise<Exercise | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return data as Exercise;
}

// ── Sessions ──────────────────────────────────────────────

export async function createSession(
  userId: string,
  exerciseId: string,
  device?: string
): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sessions')
    .insert({ user_id: userId, exercise_id: exerciseId, device })
    .select('id')
    .single();
  if (error) { console.error('[createSession]', error.message); return null; }
  return data.id;
}

export async function finishSession(
  sessionId: string,
  stats: {
    total_reps: number;
    good_reps: number;
    bad_reps: number;
    avg_score: number;
    feedback_json?: unknown;
  }
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('sessions')
    .update({ ...stats, ended_at: new Date().toISOString() })
    .eq('id', sessionId);
  return !error;
}

export async function getUserSessions(
  userId: string,
  limit = 20
): Promise<Session[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data as Session[];
}

// ── Subscription ──────────────────────────────────────────

export async function getUserSubscription(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data;
}
