-- =============================================
-- FormFit AI — Schema inicial
-- =============================================

create extension if not exists "uuid-ossp";

-- =============================================
-- TABELA: profiles
-- =============================================
create table if not exists public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  email        text unique not null,
  full_name    text,
  avatar_url   text,
  locale       text default 'pt',
  plan         text default 'free' check (plan in ('free','pro','annual')),
  streak_days  int default 0,
  total_reps   int default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- =============================================
-- TABELA: exercises
-- =============================================
create table if not exists public.exercises (
  id          uuid default uuid_generate_v4() primary key,
  slug        text unique not null,
  name_pt     text not null,
  name_en     text not null,
  name_es     text,
  name_fr     text,
  category    text check (category in ('lower','upper','core','cardio')),
  difficulty  text check (difficulty in ('beginner','intermediate','advanced')),
  muscles     text[],
  created_at  timestamptz default now()
);

alter table public.exercises enable row level security;

create policy "Everyone can read exercises"
  on public.exercises for select
  using (true);

insert into public.exercises (slug, name_pt, name_en, name_es, name_fr, category, difficulty, muscles)
values
  ('squat',  'Agachamento', 'Squat',    'Sentadilla',        'Squat',  'lower',  'beginner',     array['quadriceps','glutes','hamstrings']),
  ('pushup', 'Flexão',      'Push-up',  'Flexión de brazos', 'Pompe',  'upper',  'beginner',     array['chest','triceps','shoulders']),
  ('plank',  'Prancha',     'Plank',    'Plancha',           'Planche','core',   'beginner',     array['core','shoulders','glutes']),
  ('lunge',  'Afundo',      'Lunge',    'Zancada',           'Fente',  'lower',  'intermediate', array['quadriceps','glutes','hamstrings'])
on conflict (slug) do nothing;

-- =============================================
-- TABELA: sessions
-- =============================================
create table if not exists public.sessions (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  exercise_id     uuid references public.exercises(id) not null,
  started_at      timestamptz default now(),
  ended_at        timestamptz,
  total_reps      int default 0,
  good_reps       int default 0,
  bad_reps        int default 0,
  avg_score       numeric(5,2) default 0,
  feedback_json   jsonb,
  device          text
);

alter table public.sessions enable row level security;

create policy "Users can view own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.sessions for update
  using (auth.uid() = user_id);

-- =============================================
-- TABELA: subscriptions
-- =============================================
create table if not exists public.subscriptions (
  id                  uuid default uuid_generate_v4() primary key,
  user_id             uuid references public.profiles(id) on delete cascade not null,
  stripe_customer_id  text unique,
  stripe_sub_id       text unique,
  plan                text default 'free' check (plan in ('free','pro','annual')),
  status              text check (status in ('active','canceled','past_due','trialing','incomplete')),
  current_period_end  timestamptz,
  cancel_at           timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role can manage subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role');

-- =============================================
-- FUNÇÃO: auto-criar profile ao signup
-- =============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- ÍNDICES
-- =============================================
create index if not exists idx_sessions_user_id     on public.sessions(user_id);
create index if not exists idx_sessions_exercise_id on public.sessions(exercise_id);
create index if not exists idx_sessions_started_at  on public.sessions(started_at desc);
create index if not exists idx_subscriptions_user   on public.subscriptions(user_id);
