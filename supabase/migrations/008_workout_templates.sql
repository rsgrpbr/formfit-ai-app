-- workout_templates
CREATE TABLE IF NOT EXISTS public.workout_templates (
  id               uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name_pt          text NOT NULL,
  name_en          text NOT NULL,
  name_es          text,
  name_fr          text,
  objective        text NOT NULL,   -- emagrecer | ganhar_massa | definir | condicionamento
  level            text NOT NULL,   -- iniciante | intermediario | avancado
  duration_minutes int  NOT NULL,
  location         text NOT NULL DEFAULT 'casa',  -- casa | academia
  description_pt   text,
  exercises        jsonb NOT NULL DEFAULT '[]'
  -- exercises: [{"slug":"squat","sets":3,"reps":12,"rest_seconds":60}, ...]
);

ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_templates_public_read" ON public.workout_templates
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_workout_templates_objective ON public.workout_templates(objective);
CREATE INDEX IF NOT EXISTS idx_workout_templates_level     ON public.workout_templates(level);

-- ── Seed: 12 treinos prontos ───────────────────────────────────────────────────

INSERT INTO public.workout_templates
  (name_pt, name_en, name_es, name_fr, objective, level, duration_minutes, location, description_pt, exercises)
VALUES

-- ── Emagrecer ─────────────────────────────────────────────────────────────────
(
  'Queima Rápida',
  'Quick Burn',
  'Quema Rápida',
  'Brûlure Rapide',
  'emagrecer', 'iniciante', 20, 'casa',
  'Circuito cardiovascular para iniciantes. Eleve a frequência cardíaca e queime calorias com movimentos simples.',
  '[{"slug":"mountain_climber","sets":3,"reps":15,"rest_seconds":45},{"slug":"squat","sets":3,"reps":15,"rest_seconds":45},{"slug":"lunge","sets":3,"reps":12,"rest_seconds":45},{"slug":"burpee","sets":3,"reps":8,"rest_seconds":60}]'
),
(
  'Cardio Intenso',
  'Intense Cardio',
  'Cardio Intenso',
  'Cardio Intense',
  'emagrecer', 'intermediario', 30, 'casa',
  'Treino de alta intensidade para acelerar o metabolismo e maximizar a queima de gordura.',
  '[{"slug":"burpee","sets":4,"reps":10,"rest_seconds":60},{"slug":"mountain_climber","sets":4,"reps":20,"rest_seconds":45},{"slug":"squat","sets":4,"reps":15,"rest_seconds":45},{"slug":"pushup","sets":3,"reps":12,"rest_seconds":60},{"slug":"lunge","sets":3,"reps":15,"rest_seconds":45}]'
),
(
  'Fat Burner Total',
  'Total Fat Burner',
  'Quema Total de Grasa',
  'Brûlure Totale',
  'emagrecer', 'avancado', 40, 'academia',
  'Protocolo avançado de emagrecimento com alta densidade de treino e mínimo descanso.',
  '[{"slug":"burpee","sets":5,"reps":15,"rest_seconds":60},{"slug":"mountain_climber","sets":5,"reps":25,"rest_seconds":45},{"slug":"squat","sets":4,"reps":20,"rest_seconds":45},{"slug":"lunge","sets":4,"reps":20,"rest_seconds":45},{"slug":"pushup","sets":4,"reps":15,"rest_seconds":60},{"slug":"plank","sets":3,"reps":45,"rest_seconds":30}]'
),

-- ── Ganhar Massa ──────────────────────────────────────────────────────────────
(
  'Força Base',
  'Base Strength',
  'Fuerza Base',
  'Force de Base',
  'ganhar_massa', 'iniciante', 25, 'academia',
  'Fundamentos de hipertrofia para iniciantes. Foco em movimentos compostos e boa técnica.',
  '[{"slug":"squat","sets":3,"reps":12,"rest_seconds":90},{"slug":"pushup","sets":3,"reps":10,"rest_seconds":90},{"slug":"lunge","sets":3,"reps":10,"rest_seconds":90},{"slug":"glute_bridge","sets":3,"reps":12,"rest_seconds":60}]'
),
(
  'Hipertrofia',
  'Hypertrophy',
  'Hipertrofia',
  'Hypertrophie',
  'ganhar_massa', 'intermediario', 35, 'academia',
  'Treino de volume moderado para estimular o crescimento muscular em múltiplos grupos.',
  '[{"slug":"squat","sets":4,"reps":12,"rest_seconds":90},{"slug":"pushup","sets":4,"reps":12,"rest_seconds":90},{"slug":"lunge","sets":4,"reps":12,"rest_seconds":90},{"slug":"glute_bridge","sets":4,"reps":15,"rest_seconds":60},{"slug":"superman","sets":3,"reps":15,"rest_seconds":60}]'
),
(
  'Força Máxima',
  'Maximum Strength',
  'Fuerza Máxima',
  'Force Maximale',
  'ganhar_massa', 'avancado', 45, 'academia',
  'Protocolo avançado de ganho de massa com alta carga, baixas repetições e descanso completo.',
  '[{"slug":"squat","sets":5,"reps":10,"rest_seconds":120},{"slug":"pushup","sets":5,"reps":15,"rest_seconds":90},{"slug":"lunge","sets":4,"reps":15,"rest_seconds":90},{"slug":"glute_bridge","sets":4,"reps":20,"rest_seconds":60},{"slug":"superman","sets":3,"reps":20,"rest_seconds":60},{"slug":"plank","sets":3,"reps":60,"rest_seconds":45}]'
),

-- ── Definição ─────────────────────────────────────────────────────────────────
(
  'Tonificação Base',
  'Base Toning',
  'Tonificación Base',
  'Tonification de Base',
  'definir', 'iniciante', 20, 'casa',
  'Introdução ao treino de definição muscular com foco em isometria e estabilidade do core.',
  '[{"slug":"plank","sets":3,"reps":30,"rest_seconds":45},{"slug":"side_plank","sets":3,"reps":20,"rest_seconds":45},{"slug":"superman","sets":3,"reps":12,"rest_seconds":45},{"slug":"glute_bridge","sets":3,"reps":15,"rest_seconds":45}]'
),
(
  'Corpo Definido',
  'Defined Body',
  'Cuerpo Definido',
  'Corps Défini',
  'definir', 'intermediario', 30, 'casa',
  'Combinação de exercícios isométricos e funcionais para definição muscular completa.',
  '[{"slug":"plank","sets":4,"reps":45,"rest_seconds":45},{"slug":"side_plank","sets":4,"reps":30,"rest_seconds":45},{"slug":"squat","sets":3,"reps":15,"rest_seconds":60},{"slug":"pushup","sets":3,"reps":12,"rest_seconds":60},{"slug":"glute_bridge","sets":3,"reps":15,"rest_seconds":45}]'
),
(
  'Definição Total',
  'Total Definition',
  'Definición Total',
  'Définition Totale',
  'definir', 'avancado', 40, 'academia',
  'Protocolo avançado de definição que combina isometria intensa com exercícios explosivos.',
  '[{"slug":"plank","sets":4,"reps":60,"rest_seconds":45},{"slug":"side_plank","sets":4,"reps":45,"rest_seconds":45},{"slug":"superman","sets":3,"reps":20,"rest_seconds":45},{"slug":"squat","sets":4,"reps":15,"rest_seconds":60},{"slug":"pushup","sets":4,"reps":15,"rest_seconds":60},{"slug":"burpee","sets":3,"reps":10,"rest_seconds":90}]'
),

-- ── Condicionamento ───────────────────────────────────────────────────────────
(
  'Circuito Iniciante',
  'Beginner Circuit',
  'Circuito Principiante',
  'Circuit Débutant',
  'condicionamento', 'iniciante', 20, 'casa',
  'Circuito funcional para iniciantes melhorarem resistência, coordenação e condicionamento geral.',
  '[{"slug":"mountain_climber","sets":3,"reps":15,"rest_seconds":60},{"slug":"squat","sets":3,"reps":15,"rest_seconds":60},{"slug":"pushup","sets":3,"reps":10,"rest_seconds":60}]'
),
(
  'HIIT Funcional',
  'Functional HIIT',
  'HIIT Funcional',
  'HIIT Fonctionnel',
  'condicionamento', 'intermediario', 30, 'casa',
  'Treino intervalado de alta intensidade com exercícios funcionais para máximo condicionamento.',
  '[{"slug":"mountain_climber","sets":4,"reps":20,"rest_seconds":45},{"slug":"burpee","sets":3,"reps":10,"rest_seconds":60},{"slug":"squat","sets":4,"reps":15,"rest_seconds":60},{"slug":"pushup","sets":3,"reps":12,"rest_seconds":60},{"slug":"lunge","sets":3,"reps":12,"rest_seconds":60}]'
),
(
  'Performance Elite',
  'Elite Performance',
  'Rendimiento Élite',
  'Performance Élite',
  'condicionamento', 'avancado', 45, 'academia',
  'Protocolo de condicionamento de elite para atletas avançados. Alta intensidade, volume total e mínimo descanso.',
  '[{"slug":"mountain_climber","sets":5,"reps":25,"rest_seconds":45},{"slug":"burpee","sets":4,"reps":15,"rest_seconds":60},{"slug":"squat","sets":4,"reps":20,"rest_seconds":45},{"slug":"pushup","sets":4,"reps":20,"rest_seconds":60},{"slug":"lunge","sets":4,"reps":20,"rest_seconds":45},{"slug":"plank","sets":3,"reps":60,"rest_seconds":30}]'
);
