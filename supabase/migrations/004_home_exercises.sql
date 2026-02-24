-- =============================================
-- FormFit AI — Exercícios em casa (Agent 7C)
-- =============================================

insert into public.exercises (slug, name_pt, name_en, name_es, name_fr, category, difficulty, muscles)
values
  ('glute_bridge',     'Elevação de Quadril', 'Glute Bridge',     'Puente de glúteos',   'Pont fessier',       'lower', 'beginner',     array['glutes','hamstrings','core']),
  ('side_plank',       'Prancha Lateral',     'Side Plank',       'Plancha lateral',     'Planche latérale',   'core',  'intermediate', array['obliques','core','shoulders']),
  ('superman',         'Superman',            'Superman',         'Superman',            'Superman',           'core',  'beginner',     array['lower_back','glutes','shoulders']),
  ('mountain_climber', 'Escalada',            'Mountain Climber', 'Escalador',           'Grimpeur',           'cardio','intermediate', array['core','shoulders','hip_flexors']),
  ('burpee',           'Burpee',              'Burpee',           'Burpee',              'Burpee',             'cardio','advanced',     array['full_body','cardio','core'])
on conflict (slug) do nothing;
