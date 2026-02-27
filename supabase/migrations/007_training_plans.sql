-- Extend profiles with onboarding fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS objective     text,
  ADD COLUMN IF NOT EXISTS level         text,
  ADD COLUMN IF NOT EXISTS days_per_week int,
  ADD COLUMN IF NOT EXISTS location      text;

-- training_plans
CREATE TABLE IF NOT EXISTS public.training_plans (
  id            uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name          text NOT NULL,
  objective     text,
  level         text,
  days_per_week int,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own training_plans"    ON public.training_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role training_plans" ON public.training_plans FOR ALL USING (auth.role() = 'service_role');

-- plan_days
CREATE TABLE IF NOT EXISTS public.plan_days (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  plan_id    uuid REFERENCES public.training_plans(id) ON DELETE CASCADE NOT NULL,
  day_number int NOT NULL,
  name       text NOT NULL,
  is_rest    boolean DEFAULT false
);
ALTER TABLE public.plan_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own plan_days"    ON public.plan_days FOR ALL
  USING (EXISTS (SELECT 1 FROM public.training_plans tp WHERE tp.id = plan_id AND tp.user_id = auth.uid()));
CREATE POLICY "Service role plan_days" ON public.plan_days FOR ALL USING (auth.role() = 'service_role');

-- plan_exercises
CREATE TABLE IF NOT EXISTS public.plan_exercises (
  id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  day_id       uuid REFERENCES public.plan_days(id) ON DELETE CASCADE NOT NULL,
  exercise_id  uuid REFERENCES public.exercises(id) NOT NULL,
  sets         int NOT NULL,
  reps         int NOT NULL,
  rest_seconds int NOT NULL DEFAULT 60,
  order_index  int NOT NULL DEFAULT 0
);
ALTER TABLE public.plan_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own plan_exercises"    ON public.plan_exercises FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.plan_days pd
    JOIN public.training_plans tp ON tp.id = pd.plan_id
    WHERE pd.id = day_id AND tp.user_id = auth.uid()
  ));
CREATE POLICY "Service role plan_exercises" ON public.plan_exercises FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_training_plans_user_id ON public.training_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_days_plan_id      ON public.plan_days(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_exercises_day_id  ON public.plan_exercises(day_id);
