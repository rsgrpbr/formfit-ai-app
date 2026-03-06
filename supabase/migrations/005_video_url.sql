-- =============================================
-- FormFit AI — Adiciona video_url aos exercícios
-- =============================================

alter table public.exercises
  add column if not exists video_url text;
