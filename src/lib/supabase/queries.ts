import { createClient } from './client';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  locale: string;
  gender: 'male' | 'female';
  plan: 'free' | 'pro' | 'personal' | 'annual';
  streak_days: number;
  total_reps: number;
  objective: string | null;
  level: string | null;
  days_per_week: number | null;
  location: string | null;
  voice_coach_enabled: boolean;
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
  // Added in migration 009
  instructions_pt: string | null;
  instructions_en: string | null;
  muscles_primary: string[] | null;
  muscles_secondary: string[] | null;
  equipment: string[] | null;
  tips_pt: string | null;
  tips_en: string | null;
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
  updates: Partial<Pick<Profile, 'full_name' | 'avatar_url' | 'locale' | 'gender' | 'objective' | 'level' | 'days_per_week' | 'location' | 'voice_coach_enabled'>>
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

export interface SessionWithExercise {
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
  exercise: { slug: string; name_pt: string } | null;
}

export async function getRecentSessionsWithExercise(
  userId: string,
  limit = 50
): Promise<SessionWithExercise[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('*, exercise:exercises(slug, name_pt)')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('[getRecentSessionsWithExercise]', error.message); return []; }
  return (data ?? []) as SessionWithExercise[];
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

// ── Training Plans ─────────────────────────────────────────

export interface TrainingPlan {
  id: string;
  user_id: string;
  name: string;
  objective: string | null;
  level: string | null;
  days_per_week: number | null;
  is_active: boolean;
  created_at: string;
}

export interface PlanDay {
  id: string;
  plan_id: string;
  day_number: number;
  name: string;
  is_rest: boolean;
}

export interface PlanExercise {
  id: string;
  day_id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  order_index: number;
  exercise?: { slug: string; name_pt: string; name_en: string } | null;
}

export async function getActivePlan(userId: string): Promise<TrainingPlan | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('training_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data as TrainingPlan | null;
}

export async function getPlanDays(planId: string): Promise<PlanDay[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('plan_days')
    .select('*')
    .eq('plan_id', planId)
    .order('day_number', { ascending: true });
  if (error) { console.error('[getPlanDays]', error.message); return []; }
  return data as PlanDay[];
}

export async function getPlanExercises(dayId: string): Promise<PlanExercise[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('plan_exercises')
    .select('*, exercise:exercises(slug, name_pt, name_en)')
    .eq('day_id', dayId)
    .order('order_index', { ascending: true });
  if (error) { console.error('[getPlanExercises]', error.message); return []; }
  return (data ?? []) as PlanExercise[];
}

// ── Workout Templates ──────────────────────────────────────

export interface WorkoutExercise {
  slug: string;
  sets: number;
  reps: number;
  rest_seconds: number;
}

export interface WorkoutTemplate {
  id: string;
  name_pt: string;
  name_en: string;
  name_es: string | null;
  name_fr: string | null;
  objective: string;
  level: string;
  duration_minutes: number;
  location: string;
  description_pt: string | null;
  exercises: WorkoutExercise[];
}

export async function getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workout_templates')
    .select('*')
    .order('objective', { ascending: true });
  if (error) { console.error('[getWorkoutTemplates]', error.message); return []; }
  return (data ?? []) as WorkoutTemplate[];
}

export async function getWorkoutTemplate(id: string): Promise<WorkoutTemplate | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workout_templates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as WorkoutTemplate;
}

// ── Favorites ──────────────────────────────────────────────

export async function getUserFavorites(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_favorites')
    .select('exercise_id')
    .eq('user_id', userId);
  if (error) return [];
  return (data ?? []).map((r: { exercise_id: string }) => r.exercise_id);
}

export async function toggleFavorite(
  userId: string,
  exerciseId: string,
  isFavorited: boolean,
): Promise<boolean> {
  const supabase = createClient();
  if (isFavorited) {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId);
    return !error;
  }
  const { error } = await supabase
    .from('user_favorites')
    .insert({ user_id: userId, exercise_id: exerciseId });
  return !error;
}

export async function getUserExerciseSessions(
  userId: string,
  exerciseId: string,
  limit = 20,
): Promise<Session[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data as Session[];
}
