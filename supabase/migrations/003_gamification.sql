-- =============================================
-- FormFit AI — Gamificação
-- =============================================

-- ── user_xp ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_xp (
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  total_xp   integer NOT NULL DEFAULT 0,
  level      text NOT NULL DEFAULT 'Iniciante',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read user_xp"
  ON public.user_xp FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own xp"
  ON public.user_xp FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own xp"
  ON public.user_xp FOR UPDATE
  USING (auth.uid() = user_id);

-- ── badges ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.badges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text NOT NULL,
  icon            text NOT NULL,
  xp_reward       integer NOT NULL DEFAULT 0,
  condition_type  text NOT NULL,
  condition_value integer NOT NULL,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read badges"
  ON public.badges FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── user_badges ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id  uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── streaks ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.streaks (
  user_id            uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  current_streak     integer NOT NULL DEFAULT 0,
  longest_streak     integer NOT NULL DEFAULT 0,
  last_training_date date
);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read streaks"
  ON public.streaks FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own streak"
  ON public.streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON public.streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- ── weekly_challenges ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  description  text NOT NULL,
  xp_reward    integer NOT NULL DEFAULT 0,
  exercise_id  uuid REFERENCES public.exercises(id),
  target_value integer NOT NULL,
  starts_at    timestamptz NOT NULL,
  ends_at      timestamptz NOT NULL
);

ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read weekly_challenges"
  ON public.weekly_challenges FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── user_challenges ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_challenges (
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  progress     integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  PRIMARY KEY (user_id, challenge_id)
);

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own challenges"
  ON public.user_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges"
  ON public.user_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges"
  ON public.user_challenges FOR UPDATE
  USING (auth.uid() = user_id);

-- ── Índices ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_user_xp_total        ON public.user_xp(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user     ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON public.user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_end ON public.weekly_challenges(ends_at);

-- ── Seed: 20 badges ───────────────────────────────────────────────────────────

INSERT INTO public.badges (name, description, icon, xp_reward, condition_type, condition_value) VALUES
  ('Primeira Sessão',    'Complete sua primeira sessão de treino',           '🎯', 100,  'sessions',       1),
  ('Semana Completa',    'Mantenha uma sequência de 7 dias de treino',       '🔥', 300,  'streak',         7),
  ('Forma Perfeita',     'Alcance pontuação >= 95 em uma sessão',            '⭐', 200,  'score',          95),
  ('10 Sessões',         'Complete 10 sessões de treino',                    '💪', 250,  'sessions',       10),
  ('30 Sessões',         'Complete 30 sessões de treino',                    '🏅', 500,  'sessions',       30),
  ('Agachamento Expert', 'Complete 5 sessões de agachamento',                '🦵', 150,  'exercise_squat', 5),
  ('Prancha de Ferro',   'Complete 5 sessões de prancha',                    '🧱', 150,  'exercise_plank', 5),
  ('Madrugador',         'Treine antes das 8h da manhã',                     '🌅', 100,  'early_morning',  1),
  ('Mês Dedicado',       'Mantenha uma sequência de 30 dias de treino',      '📅', 1000, 'streak',         30),
  ('Score Perfeito 3x',  'Alcance pontuação >= 95 em 3 sessões diferentes',  '🎖', 400,  'score_triple',   95),
  ('Flexionador',        'Complete 5 sessões de flexão de braços',           '🤸', 150,  'exercise_pushup',5),
  ('Lunger Pro',         'Complete 5 sessões de afundo',                     '🏃', 150,  'exercise_lunge', 5),
  ('50 Sessões',         'Complete 50 sessões de treino',                    '🏆', 750,  'sessions',       50),
  ('Centurião',          'Complete 100 sessões de treino',                   '👑', 1500, 'sessions',       100),
  ('Invicto',            'Mantenha uma sequência de 14 dias de treino',      '⚔', 600,  'streak',         14),
  ('Monstro das Reps',   'Acumule 500 repetições totais',                    '🦾', 500,  'total_reps',     500),
  ('Nota 10',            'Alcance pontuação >= 98 em uma sessão',            '💯', 300,  'score',          98),
  ('Lendário',           'Mantenha uma sequência de 60 dias de treino',      '🌟', 2000, 'streak',         60),
  ('Guerreiro do Core',  'Complete 20 sessões de treino',                    '🎽', 350,  'sessions',       20),
  ('Determinação',       'Complete 75 sessões de treino',                    '💎', 1000, 'sessions',       75)
ON CONFLICT DO NOTHING;

-- ── Seed: 4 desafios semanais ─────────────────────────────────────────────────

INSERT INTO public.weekly_challenges (title, description, xp_reward, exercise_id, target_value, starts_at, ends_at)
SELECT
  'Semana Agachador',
  'Complete 50 agachamentos nesta semana',
  200,
  (SELECT id FROM public.exercises WHERE slug = 'squat' LIMIT 1),
  50,
  date_trunc('week', now()),
  date_trunc('week', now()) + interval '7 days'
WHERE NOT EXISTS (SELECT 1 FROM public.weekly_challenges WHERE title = 'Semana Agachador');

INSERT INTO public.weekly_challenges (title, description, xp_reward, exercise_id, target_value, starts_at, ends_at)
SELECT
  'Prancha 5 Dias',
  'Complete sessões de prancha por 5 dias esta semana',
  200,
  (SELECT id FROM public.exercises WHERE slug = 'plank' LIMIT 1),
  5,
  date_trunc('week', now()),
  date_trunc('week', now()) + interval '7 days'
WHERE NOT EXISTS (SELECT 1 FROM public.weekly_challenges WHERE title = 'Prancha 5 Dias');

INSERT INTO public.weekly_challenges (title, description, xp_reward, exercise_id, target_value, starts_at, ends_at)
SELECT
  'Score Alto',
  'Alcance pontuação >= 85 em 3 sessões esta semana',
  200,
  NULL,
  3,
  date_trunc('week', now()),
  date_trunc('week', now()) + interval '7 days'
WHERE NOT EXISTS (SELECT 1 FROM public.weekly_challenges WHERE title = 'Score Alto');

INSERT INTO public.weekly_challenges (title, description, xp_reward, exercise_id, target_value, starts_at, ends_at)
SELECT
  'Treino Total',
  'Complete 7 sessões de treino nesta semana',
  200,
  NULL,
  7,
  date_trunc('week', now()),
  date_trunc('week', now()) + interval '7 days'
WHERE NOT EXISTS (SELECT 1 FROM public.weekly_challenges WHERE title = 'Treino Total');
