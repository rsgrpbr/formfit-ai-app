-- ── Expand exercises table ───────────────────────────────────────────────────
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS instructions_pt  text,
  ADD COLUMN IF NOT EXISTS instructions_en  text,
  ADD COLUMN IF NOT EXISTS muscles_primary  text[],
  ADD COLUMN IF NOT EXISTS muscles_secondary text[],
  ADD COLUMN IF NOT EXISTS equipment        text[],
  ADD COLUMN IF NOT EXISTS tips_pt          text,
  ADD COLUMN IF NOT EXISTS tips_en          text;

-- ── User favorites ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_favorites (
  user_id     uuid REFERENCES public.profiles(id)  ON DELETE CASCADE NOT NULL,
  exercise_id uuid REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, exercise_id)
);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own favorites"
  ON public.user_favorites FOR ALL
  USING (auth.uid() = user_id);

-- ── Seed — squat ─────────────────────────────────────────────────────────────
UPDATE public.exercises SET
  instructions_pt  = 'Fique em pé com os pés na largura dos ombros e os dedos ligeiramente voltados para fora.' || chr(10) ||
                     'Inicie o movimento empurrando o quadril para trás, como se fosse sentar em uma cadeira.' || chr(10) ||
                     'Mantenha o peito erguido, as costas retas e o olhar à frente.' || chr(10) ||
                     'Desça até as coxas ficarem paralelas ao chão (ou abaixo, se possível).' || chr(10) ||
                     'Empurre o chão com os pés para retornar à posição inicial, contraindo os glúteos no topo.',
  instructions_en  = 'Stand with feet shoulder-width apart, toes pointing slightly outward.' || chr(10) ||
                     'Initiate the movement by pushing your hips back, as if sitting in a chair.' || chr(10) ||
                     'Keep your chest up, back straight, and gaze forward.' || chr(10) ||
                     'Lower until your thighs are parallel to the floor or below.' || chr(10) ||
                     'Drive through your feet to return to standing, squeezing glutes at the top.',
  muscles_primary   = ARRAY['Quadríceps', 'Glúteos'],
  muscles_secondary = ARRAY['Isquiotibiais', 'Core', 'Panturrilhas'],
  equipment         = ARRAY['Sem equipamento'],
  tips_pt          = 'Joelhos alinhados com os dedos dos pés — não os deixe colabar para dentro.' || chr(10) ||
                     'Inspire ao descer, expire ao subir.' || chr(10) ||
                     'Calcanhares no chão durante todo o movimento.',
  tips_en          = 'Keep knees aligned with your toes — don''t let them cave inward.' || chr(10) ||
                     'Inhale on the way down, exhale on the way up.' || chr(10) ||
                     'Keep your heels planted throughout the movement.'
WHERE slug = 'squat';

-- ── Seed — pushup ────────────────────────────────────────────────────────────
UPDATE public.exercises SET
  instructions_pt  = 'Deite de bruços e coloque as mãos um pouco mais largas que os ombros.' || chr(10) ||
                     'Mantenha o corpo em linha reta da cabeça aos pés, com o core contraído.' || chr(10) ||
                     'Desça o peito até quase tocar o chão, mantendo os cotovelos a 45° do corpo.' || chr(10) ||
                     'Empurre o chão e estenda os braços, sem bloquear os cotovelos.' || chr(10) ||
                     'Controle a descida — ela deve ser lenta e controlada.',
  instructions_en  = 'Lie face down and place your hands slightly wider than shoulder-width.' || chr(10) ||
                     'Keep your body in a straight line from head to heels, core tight.' || chr(10) ||
                     'Lower your chest until it almost touches the floor, elbows at 45° from your body.' || chr(10) ||
                     'Push into the floor and extend your arms without locking your elbows.' || chr(10) ||
                     'Control the descent — it should be slow and deliberate.',
  muscles_primary   = ARRAY['Peitoral', 'Tríceps'],
  muscles_secondary = ARRAY['Deltóide Anterior', 'Core', 'Serrátil'],
  equipment         = ARRAY['Sem equipamento'],
  tips_pt          = 'Evite deixar o quadril subir ou afundar — mantenha o corpo rígido.' || chr(10) ||
                     'Olhe para baixo, não para frente, para proteger o pescoço.' || chr(10) ||
                     'Se necessário, faça com os joelhos no chão para começar.',
  tips_en          = 'Avoid letting your hips rise or sag — keep your body rigid.' || chr(10) ||
                     'Look downward, not forward, to protect your neck.' || chr(10) ||
                     'If needed, drop to your knees to start building strength.'
WHERE slug = 'pushup';

-- ── Seed — plank ─────────────────────────────────────────────────────────────
UPDATE public.exercises SET
  instructions_pt  = 'Deite de bruços e apoie-se nos antebraços e pontas dos pés.' || chr(10) ||
                     'Eleve o quadril até o corpo formar uma linha reta dos calcanhares à cabeça.' || chr(10) ||
                     'Contraia o abdômen e os glúteos; mantenha a respiração controlada.' || chr(10) ||
                     'Mantenha o olhar para baixo, sem tensionar o pescoço.' || chr(10) ||
                     'Segure a posição pelo tempo determinado.',
  instructions_en  = 'Lie face down and support yourself on your forearms and toes.' || chr(10) ||
                     'Raise your hips until your body forms a straight line from heels to head.' || chr(10) ||
                     'Squeeze your abs and glutes and keep your breathing controlled.' || chr(10) ||
                     'Look downward without tensioning your neck.' || chr(10) ||
                     'Hold the position for the prescribed time.',
  muscles_primary   = ARRAY['Core', 'Abdômen'],
  muscles_secondary = ARRAY['Glúteos', 'Ombros', 'Isquiotibiais'],
  equipment         = ARRAY['Sem equipamento'],
  tips_pt          = 'Não deixe o quadril subir demais nem afundar — linha reta é a chave.' || chr(10) ||
                     'Respire normalmente durante a prancha, não prenda o ar.' || chr(10) ||
                     'Se sentir dor lombar, reduza o tempo e fortaleça o core progressivamente.',
  tips_en          = 'Don''t let your hips rise too high or sag — straight line is key.' || chr(10) ||
                     'Breathe normally during the plank, don''t hold your breath.' || chr(10) ||
                     'If you feel lower back pain, reduce the time and build core strength gradually.'
WHERE slug = 'plank';

-- ── Seed — lunge ─────────────────────────────────────────────────────────────
UPDATE public.exercises SET
  instructions_pt  = 'Fique em pé com os pés juntos e as mãos na cintura ou ao longo do corpo.' || chr(10) ||
                     'Dê um passo largo à frente com uma perna.' || chr(10) ||
                     'Desça o joelho traseiro em direção ao chão, mantendo o tronco ereto.' || chr(10) ||
                     'O joelho da frente deve ficar acima do tornozelo, não ultrapassando a ponta do pé.' || chr(10) ||
                     'Empurre o chão com o pé da frente para retornar e alterne as pernas.',
  instructions_en  = 'Stand with feet together and hands on hips or at your sides.' || chr(10) ||
                     'Step forward with one leg, taking a wide stride.' || chr(10) ||
                     'Lower your rear knee toward the ground, keeping your torso upright.' || chr(10) ||
                     'Your front knee should stay above your ankle, not past your toes.' || chr(10) ||
                     'Push through your front foot to return and alternate legs.',
  muscles_primary   = ARRAY['Quadríceps', 'Glúteos'],
  muscles_secondary = ARRAY['Isquiotibiais', 'Core', 'Panturrilhas'],
  equipment         = ARRAY['Sem equipamento'],
  tips_pt          = 'Mantenha o tronco ereto — não se incline para frente.' || chr(10) ||
                     'O joelho traseiro quase toca o chão, mas não bate.' || chr(10) ||
                     'Olhe para frente para ajudar no equilíbrio.',
  tips_en          = 'Keep your torso upright — don''t lean forward.' || chr(10) ||
                     'The rear knee almost touches the floor but doesn''t slam down.' || chr(10) ||
                     'Look straight ahead to help with balance.'
WHERE slug = 'lunge';

-- ── Seed — glute_bridge ──────────────────────────────────────────────────────
UPDATE public.exercises SET
  instructions_pt  = 'Deite de costas com os joelhos dobrados e os pés apoiados no chão, na largura do quadril.' || chr(10) ||
                     'Posicione os braços ao longo do corpo com as palmas viradas para baixo.' || chr(10) ||
                     'Contraia os glúteos e o core, então eleve o quadril até o corpo formar uma linha reta dos joelhos aos ombros.' || chr(10) ||
                     'Segure por 1–2 segundos no topo, apertando os glúteos ao máximo.' || chr(10) ||
                     'Desça lentamente até quase tocar o chão e repita.',
  instructions_en  = 'Lie on your back with knees bent and feet flat on the floor, hip-width apart.' || chr(10) ||
                     'Position arms along your sides with palms facing down.' || chr(10) ||
                     'Squeeze your glutes and core, then raise your hips until your body forms a straight line from knees to shoulders.' || chr(10) ||
                     'Hold for 1–2 seconds at the top, squeezing your glutes hard.' || chr(10) ||
                     'Lower slowly until almost touching the floor and repeat.',
  muscles_primary   = ARRAY['Glúteos', 'Isquiotibiais'],
  muscles_secondary = ARRAY['Core', 'Lombar', 'Quadríceps'],
  equipment         = ARRAY['Sem equipamento'],
  tips_pt          = 'Empurre com os calcanhares, não com os dedos dos pés.' || chr(10) ||
                     'Não hiperextenda a lombar — pare quando o corpo estiver em linha reta.' || chr(10) ||
                     'Segure no topo por 2 segundos para maximizar a ativação glútea.',
  tips_en          = 'Drive through your heels, not your toes.' || chr(10) ||
                     'Don''t hyperextend your lower back — stop when your body is in a straight line.' || chr(10) ||
                     'Hold at the top for 2 seconds to maximize glute activation.'
WHERE slug = 'glute_bridge';

-- ── Seed — side_plank ────────────────────────────────────────────────────────
UPDATE public.exercises SET
  instructions_pt  = 'Deite de lado com o corpo em linha reta e apoie-se no antebraço, cotovelo abaixo do ombro.' || chr(10) ||
                     'Eleve o quadril até o corpo formar uma linha reta da cabeça aos pés.' || chr(10) ||
                     'O braço livre pode ficar ao longo do corpo ou estendido para cima.' || chr(10) ||
                     'Mantenha os quadris empilhados — não deixe o de cima tombar para frente.' || chr(10) ||
                     'Segure pelo tempo determinado e troque de lado.',
  instructions_en  = 'Lie on your side in a straight line and prop yourself on your forearm, elbow directly below your shoulder.' || chr(10) ||
                     'Raise your hips until your body forms a straight line from head to feet.' || chr(10) ||
                     'Your free arm can rest along your body or extend upward.' || chr(10) ||
                     'Keep your hips stacked — don''t let the top hip roll forward.' || chr(10) ||
                     'Hold for the prescribed time, then switch sides.',
  muscles_primary   = ARRAY['Oblíquos', 'Core'],
  muscles_secondary = ARRAY['Glúteos', 'Ombros', 'Quadríceps'],
  equipment         = ARRAY['Sem equipamento'],
  tips_pt          = 'Não deixe o quadril afundar — force-o ativamente para cima.' || chr(10) ||
                     'Respire normalmente e mantenha o pescoço neutro, alinhado com a coluna.' || chr(10) ||
                     'Para progredir, levante a perna de cima durante a prancha.',
  tips_en          = 'Don''t let your hip sag — actively push it upward.' || chr(10) ||
                     'Breathe normally and keep your neck neutral, aligned with your spine.' || chr(10) ||
                     'To progress, lift your top leg during the hold.'
WHERE slug = 'side_plank';

-- ── Seed — superman ──────────────────────────────────────────────────────────
UPDATE public.exercises SET
  instructions_pt  = 'Deite de bruços com os braços estendidos à frente e as pernas unidas.' || chr(10) ||
                     'Contraia a lombar e os glúteos para elevar simultaneamente os braços e as pernas do chão.' || chr(10) ||
                     'Segure a posição por 2–3 segundos no ponto mais alto.' || chr(10) ||
                     'Desça lentamente sem bater no chão e repita.' || chr(10) ||
                     'Mantenha o olhar para baixo durante todo o exercício.',
  instructions_en  = 'Lie face down with arms extended overhead and legs together.' || chr(10) ||
                     'Squeeze your lower back and glutes to simultaneously raise your arms and legs off the floor.' || chr(10) ||
                     'Hold the position for 2–3 seconds at the highest point.' || chr(10) ||
                     'Lower slowly without slamming and repeat.' || chr(10) ||
                     'Keep your gaze downward throughout the exercise.',
  muscles_primary   = ARRAY['Lombar', 'Glúteos'],
  muscles_secondary = ARRAY['Deltóide Posterior', 'Isquiotibiais', 'Rombóides'],
  equipment         = ARRAY['Sem equipamento'],
  tips_pt          = 'Não force o pescoço para cima — olhe para o chão.' || chr(10) ||
                     'A elevação não precisa ser grande — qualidade importa mais que altura.' || chr(10) ||
                     'Expire ao descer, segure brevemente o ar no topo.',
  tips_en          = 'Don''t strain your neck upward — keep your gaze down.' || chr(10) ||
                     'The lift doesn''t need to be high — quality matters more than height.' || chr(10) ||
                     'Exhale on the way down, hold briefly at the top.'
WHERE slug = 'superman';

-- ── Seed — mountain_climber ──────────────────────────────────────────────────
UPDATE public.exercises SET
  instructions_pt  = 'Em posição de prancha alta (mãos abaixo dos ombros, corpo em linha reta), estabilize o core.' || chr(10) ||
                     'Traga o joelho direito em direção ao peito em movimento rápido e controlado.' || chr(10) ||
                     'Retorne à posição inicial e imediatamente leve o joelho esquerdo ao peito.' || chr(10) ||
                     'Alterne as pernas num ritmo contínuo, como se estivesse correndo no lugar.' || chr(10) ||
                     'Mantenha o quadril nivelado — não o levante nem abaixe durante o exercício.',
  instructions_en  = 'Start in a high plank position (hands under shoulders, body straight), core braced.' || chr(10) ||
                     'Drive your right knee toward your chest in a quick, controlled motion.' || chr(10) ||
                     'Return to start and immediately bring your left knee to your chest.' || chr(10) ||
                     'Alternate legs in a continuous rhythm, as if running in place.' || chr(10) ||
                     'Keep your hips level — don''t let them rise or drop during the movement.',
  muscles_primary   = ARRAY['Core', 'Ombros'],
  muscles_secondary = ARRAY['Flexores do Quadril', 'Peitoral', 'Glúteos'],
  equipment         = ARRAY['Sem equipamento'],
  tips_pt          = 'Mantenha os ombros acima dos pulsos — não deixe o corpo recuar.' || chr(10) ||
                     'Para iniciantes, desacelere e foque na forma antes de aumentar o ritmo.' || chr(10) ||
                     'Respire ritmicamente — não prenda o ar.',
  tips_en          = 'Keep shoulders directly above your wrists — don''t let your body shift backward.' || chr(10) ||
                     'For beginners, slow down and focus on form before increasing speed.' || chr(10) ||
                     'Breathe rhythmically — don''t hold your breath.'
WHERE slug = 'mountain_climber';

-- ── Seed — burpee ────────────────────────────────────────────────────────────
UPDATE public.exercises SET
  instructions_pt  = 'Em pé com os pés na largura dos ombros, agache e coloque as mãos no chão.' || chr(10) ||
                     'Com um salto ou passo, jogue os pés para trás até a posição de prancha.' || chr(10) ||
                     'Realize uma flexão (opcional para iniciantes).' || chr(10) ||
                     'Salte os pés de volta para as mãos até a posição de agachamento.' || chr(10) ||
                     'Salte verticalmente com os braços acima da cabeça e aterrise suavemente. Repita.',
  instructions_en  = 'Stand with feet shoulder-width apart, squat and place hands on the floor.' || chr(10) ||
                     'Jump or step your feet back into a plank position.' || chr(10) ||
                     'Perform a push-up (optional for beginners).' || chr(10) ||
                     'Jump or step your feet back to your hands into a squat position.' || chr(10) ||
                     'Jump vertically with arms overhead and land softly. Repeat.',
  muscles_primary   = ARRAY['Corpo Inteiro', 'Core'],
  muscles_secondary = ARRAY['Glúteos', 'Peitoral', 'Cardiorrespiratório'],
  equipment         = ARRAY['Sem equipamento'],
  tips_pt          = 'Aterrise sempre com os joelhos levemente dobrados para absorver o impacto.' || chr(10) ||
                     'Iniciantes podem omitir a flexão ou substituir o salto por um passo.' || chr(10) ||
                     'É de alta intensidade — descanse se necessário entre as repetições.',
  tips_en          = 'Always land with slightly bent knees to absorb impact.' || chr(10) ||
                     'Beginners can skip the push-up or replace the jump with a step.' || chr(10) ||
                     'This is high-intensity — rest between reps if needed.'
WHERE slug = 'burpee';
