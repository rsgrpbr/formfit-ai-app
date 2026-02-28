-- Add voice coach preference to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS voice_coach_enabled boolean NOT NULL DEFAULT true;
