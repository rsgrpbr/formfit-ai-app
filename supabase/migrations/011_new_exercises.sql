-- ── Drop restrictive CHECK constraints so we can use extended category / difficulty values
ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS exercises_category_check;
ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS exercises_difficulty_check;

-- ── Insert 21 new exercises ───────────────────────────────────────────────────
INSERT INTO public.exercises (slug, name_pt, name_en, category, difficulty)
VALUES
  ('jump_squat',     'Agachamento Explosivo', 'Jump Squat',      'pernas',    'intermediario'),
  ('sumo_squat',     'Agachamento Sumô',      'Sumo Squat',      'pernas',    'iniciante'),
  ('donkey_kick',    'Donkey Kick',           'Donkey Kick',     'gluteos',   'iniciante'),
  ('fire_hydrant',   'Fire Hydrant',          'Fire Hydrant',    'gluteos',   'iniciante'),
  ('hip_thrust',     'Hip Thrust',            'Hip Thrust',      'gluteos',   'iniciante'),
  ('wall_sit',       'Wall Sit',              'Wall Sit',        'pernas',    'intermediario'),
  ('crunch',         'Abdominal',             'Crunch',          'core',      'iniciante'),
  ('bicycle_crunch', 'Abdominal Bicicleta',   'Bicycle Crunch',  'core',      'iniciante'),
  ('leg_raise',      'Elevação de Pernas',    'Leg Raise',       'core',      'iniciante'),
  ('russian_twist',  'Russian Twist',         'Russian Twist',   'core',      'intermediario'),
  ('dead_bug',       'Dead Bug',              'Dead Bug',        'core',      'iniciante'),
  ('bird_dog',       'Bird Dog',              'Bird Dog',        'core',      'iniciante'),
  ('flutter_kick',   'Flutter Kick',          'Flutter Kick',    'core',      'iniciante'),
  ('pike_pushup',    'Flexão Pike',           'Pike Push-up',    'ombros',    'intermediario'),
  ('diamond_pushup', 'Flexão Diamante',       'Diamond Push-up', 'peito',     'intermediario'),
  ('wide_pushup',    'Flexão Aberta',         'Wide Push-up',    'peito',     'iniciante'),
  ('tricep_dip',     'Tríceps Dip',           'Tricep Dip',      'triceps',   'iniciante'),
  ('high_knees',     'High Knees',            'High Knees',      'cardio',    'iniciante'),
  ('bear_crawl',     'Bear Crawl',            'Bear Crawl',      'full_body', 'intermediario'),
  ('inchworm',       'Inchworm',              'Inchworm',        'full_body', 'intermediario')
ON CONFLICT (slug) DO NOTHING;
