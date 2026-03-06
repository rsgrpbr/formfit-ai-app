-- ── Seed descriptions + muscles for the 20 exercises added in migration 011 ────

-- jump_squat
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Quadríceps', 'Glúteos'],
  muscles_secondary = ARRAY['Isquiotibiais', 'Panturrilhas', 'Core'],
  equipment         = ARRAY['Sem equipamento'],
  instructions_pt   = 'Fique em pé com pés na largura dos ombros.' || chr(10) ||
                      'Desça em agachamento até as coxas ficarem paralelas ao chão.' || chr(10) ||
                      'Suba com impulso e salte verticalmente.' || chr(10) ||
                      'Aterrisse suavemente com joelhos levemente dobrados e repita.',
  instructions_en   = 'Stand with feet shoulder-width apart.' || chr(10) ||
                      'Lower into a squat until thighs are parallel to the floor.' || chr(10) ||
                      'Drive up explosively and jump vertically.' || chr(10) ||
                      'Land softly with knees slightly bent and repeat.',
  tips_pt           = 'Aterrisse sempre com joelhos levemente dobrados para absorver o impacto.' || chr(10) ||
                      'Mantenha o core ativo durante todo o movimento.' || chr(10) ||
                      'Controle o agachamento antes de gerar o impulso para o salto.',
  tips_en           = 'Always land with slightly bent knees to absorb impact.' || chr(10) ||
                      'Keep your core engaged throughout the movement.' || chr(10) ||
                      'Control the squat before generating power for the jump.'
WHERE slug = 'jump_squat';

-- sumo_squat
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Quadríceps', 'Adutores', 'Glúteos'],
  muscles_secondary = ARRAY['Isquiotibiais', 'Core'],
  equipment         = ARRAY['Sem equipamento'],
  instructions_pt   = 'Pés mais abertos que os ombros, dedos voltados para fora entre 45° e 60°.' || chr(10) ||
                      'Mantenha as costas retas e o tronco erguido.' || chr(10) ||
                      'Desça até as coxas ficarem paralelas ao chão.' || chr(10) ||
                      'Empurre os joelhos para fora ao subir.',
  instructions_en   = 'Stand with feet wider than shoulder-width, toes pointing out between 45° and 60°.' || chr(10) ||
                      'Keep your back straight and torso upright.' || chr(10) ||
                      'Lower until thighs are parallel to the floor.' || chr(10) ||
                      'Push knees outward as you rise.',
  tips_pt           = 'Mantenha os joelhos alinhados com os dedos dos pés — não deixe colabar para dentro.' || chr(10) ||
                      'A postura mais aberta enfatiza os adutores e glúteos.' || chr(10) ||
                      'Mantenha os calcanhares no chão durante todo o movimento.',
  tips_en           = 'Keep knees aligned with toes — don''t let them cave inward.' || chr(10) ||
                      'The wider stance emphasizes adductors and glutes.' || chr(10) ||
                      'Keep heels planted throughout the movement.'
WHERE slug = 'sumo_squat';

-- donkey_kick
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Glúteos'],
  muscles_secondary = ARRAY['Core', 'Lombar', 'Isquiotibiais'],
  equipment         = ARRAY['Sem equipamento'],
  instructions_pt   = 'Fique em 4 apoios com mãos abaixo dos ombros e joelhos abaixo do quadril.' || chr(10) ||
                      'Mantenha o core contraído e as costas neutras.' || chr(10) ||
                      'Chute uma perna para trás e para cima mantendo o joelho dobrado a 90°.' || chr(10) ||
                      'Contraia o glúteo no topo por 1 segundo.' || chr(10) ||
                      'Desça controladamente e repita. Troque de perna após completar as repetições.',
  instructions_en   = 'Get on all fours with hands below shoulders and knees under hips.' || chr(10) ||
                      'Keep your core tight and back neutral.' || chr(10) ||
                      'Kick one leg back and up, keeping the knee bent at 90°.' || chr(10) ||
                      'Squeeze your glute for 1 second at the top.' || chr(10) ||
                      'Lower with control and repeat. Switch legs after completing reps.',
  tips_pt           = 'Mantenha o quadril nivelado — não o deixe rodar para o lado.' || chr(10) ||
                      'A força vem do glúteo, não do impulso do joelho.' || chr(10) ||
                      'Contraia o abdômen para proteger a lombar.',
  tips_en           = 'Keep your hips level — don''t let them rotate to the side.' || chr(10) ||
                      'The power comes from your glute, not the knee swing.' || chr(10) ||
                      'Engage your abs to protect your lower back.'
WHERE slug = 'donkey_kick';

-- fire_hydrant
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Glúteos'],
  muscles_secondary = ARRAY['Core', 'Abdutores do Quadril'],
  equipment         = ARRAY['Sem equipamento'],
  instructions_pt   = 'Fique em 4 apoios com mãos abaixo dos ombros e joelhos abaixo do quadril.' || chr(10) ||
                      'Mantenha o core ativo e o quadril nivelado.' || chr(10) ||
                      'Abra um joelho para o lado, mantendo-o dobrado a 90°, até ficar paralelo ao chão.' || chr(10) ||
                      'Segure 1 segundo no topo.' || chr(10) ||
                      'Desça controladamente e repita. Troque de lado após completar as repetições.',
  instructions_en   = 'Start on all fours with hands below shoulders and knees under hips.' || chr(10) ||
                      'Keep core engaged and hips level.' || chr(10) ||
                      'Lift one knee out to the side with it bent at 90°, raising until parallel to the floor.' || chr(10) ||
                      'Hold for 1 second at the top.' || chr(10) ||
                      'Lower with control and repeat. Switch sides after completing reps.',
  tips_pt           = 'Não rotacione o quadril — mantenha-o estável durante todo o movimento.' || chr(10) ||
                      'Foque na contração do glúteo médio na abertura.' || chr(10) ||
                      'Respire normalmente e mantenha o ritmo constante.',
  tips_en           = 'Don''t rotate your hips — keep them stable throughout.' || chr(10) ||
                      'Focus on contracting the glute medius as you open.' || chr(10) ||
                      'Breathe normally and maintain a steady rhythm.'
WHERE slug = 'fire_hydrant';

-- hip_thrust
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Glúteos'],
  muscles_secondary = ARRAY['Isquiotibiais', 'Core', 'Quadríceps'],
  equipment         = ARRAY['Sem equipamento'],
  instructions_pt   = 'Sente no chão com as costas apoiadas em uma superfície elevada na altura das omoplatas.' || chr(10) ||
                      'Dobre os joelhos com os pés apoiados no chão na largura do quadril.' || chr(10) ||
                      'Contraia os glúteos e empurre o quadril para cima.' || chr(10) ||
                      'Segure 1-2 segundos no topo, formando linha reta dos joelhos aos ombros.' || chr(10) ||
                      'Desça lentamente e repita.',
  instructions_en   = 'Sit on the floor with your upper back resting against an elevated surface at shoulder blade height.' || chr(10) ||
                      'Bend knees with feet flat on the floor, hip-width apart.' || chr(10) ||
                      'Squeeze your glutes and drive your hips upward.' || chr(10) ||
                      'Hold 1-2 seconds at the top, body forming a straight line from knees to shoulders.' || chr(10) ||
                      'Lower with control and repeat.',
  tips_pt           = 'Empurre com os calcanhares, não com os dedos dos pés.' || chr(10) ||
                      'Não hiperextenda a lombar — pare quando o corpo estiver em linha reta.' || chr(10) ||
                      'Adicione uma faixa ou peso sobre os quadris para aumentar a intensidade.',
  tips_en           = 'Drive through your heels, not your toes.' || chr(10) ||
                      'Don''t hyperextend your lower back — stop when your body is in a straight line.' || chr(10) ||
                      'Add a band or weight across your hips to increase intensity.'
WHERE slug = 'hip_thrust';

-- wall_sit
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Quadríceps'],
  muscles_secondary = ARRAY['Glúteos', 'Isquiotibiais', 'Core'],
  equipment         = ARRAY['Sem equipamento', 'Parede'],
  instructions_pt   = 'Encoste as costas em uma parede plana.' || chr(10) ||
                      'Deslize para baixo até os joelhos formarem 90° e as coxas ficarem paralelas ao chão.' || chr(10) ||
                      'Mantenha as costas completamente apoiadas na parede.' || chr(10) ||
                      'Costas sempre em contato com a parede.' || chr(10) ||
                      'Segure a posição pelo tempo determinado respirando normalmente.',
  instructions_en   = 'Lean your back against a flat wall.' || chr(10) ||
                      'Slide down until knees are at 90° and thighs are parallel to the floor.' || chr(10) ||
                      'Keep your back fully pressed against the wall.' || chr(10) ||
                      'Keep your back in contact with the wall at all times.' || chr(10) ||
                      'Hold for the prescribed time, breathing normally.',
  tips_pt           = 'Os joelhos devem estar diretamente acima dos tornozelos.' || chr(10) ||
                      'Não apoie as mãos nas coxas — mantenha-as ao longo do corpo.' || chr(10) ||
                      'Respire devagar e constante para aguentar mais tempo.',
  tips_en           = 'Knees should be directly above your ankles.' || chr(10) ||
                      'Don''t rest your hands on your thighs — keep them at your sides.' || chr(10) ||
                      'Breathe slow and steady to hold the position longer.'
WHERE slug = 'wall_sit';

-- crunch
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Abdômen'],
  muscles_secondary = ARRAY['Core', 'Oblíquos'],
  equipment         = ARRAY['Sem equipamento'],
  instructions_pt   = 'Deite de costas com joelhos dobrados e pés apoiados no chão.' || chr(10) ||
                      'Coloque as mãos atrás da cabeça, sem puxar o pescoço.' || chr(10) ||
                      'Contraia o abdômen para elevar os ombros do chão.' || chr(10) ||
                      'Eleve apenas o suficiente para sentir a contração no abdômen.' || chr(10) ||
                      'Desça lentamente sem encostar a cabeça no chão.',
  instructions_en   = 'Lie on your back with knees bent and feet flat on the floor.' || chr(10) ||
                      'Place hands behind your head without pulling your neck.' || chr(10) ||
                      'Contract your abs to lift your shoulders off the floor.' || chr(10) ||
                      'Raise only enough to feel the contraction in your abs.' || chr(10) ||
                      'Lower slowly without resting your head on the floor.',
  tips_pt           = 'Não puxe o pescoço com as mãos — a força vem do abdômen.' || chr(10) ||
                      'Expire ao subir, inspire ao descer.' || chr(10) ||
                      'Mantenha a lombar em contato com o chão durante todo o movimento.',
  tips_en           = 'Don''t pull your neck with your hands — the power comes from your abs.' || chr(10) ||
                      'Exhale on the way up, inhale on the way down.' || chr(10) ||
                      'Keep your lower back in contact with the floor throughout.'
WHERE slug = 'crunch';

-- bicycle_crunch
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Abdômen', 'Oblíquos'],
  muscles_secondary = ARRAY['Core', 'Flexores do Quadril'],
  equipment         = ARRAY['Sem equipamento'],
  instructions_pt   = 'Deite de costas com mãos atrás da cabeça e pernas elevadas a 45°.' || chr(10) ||
                      'Contraia o abdômen e gire o tronco levando o cotovelo direito ao joelho esquerdo.' || chr(10) ||
                      'Simultaneamente estenda a perna direita.' || chr(10) ||
                      'Alterne os lados em movimento de pedalada.' || chr(10) ||
                      'Mantenha o abdômen contraído e o movimento lento e controlado.',
  instructions_en   = 'Lie on your back with hands behind your head and legs raised at 45°.' || chr(10) ||
                      'Contract your abs and rotate your torso, bringing your right elbow to your left knee.' || chr(10) ||
                      'Simultaneously extend your right leg.' || chr(10) ||
                      'Alternate sides in a pedaling motion.' || chr(10) ||
                      'Keep abs engaged and the movement slow and controlled.',
  tips_pt           = 'Foque na rotação real do tronco — não apenas mova o cotovelo.' || chr(10) ||
                      'Movimentos lentos são mais eficazes que rápidos.' || chr(10) ||
                      'Mantenha a lombar pressionada no chão.',
  tips_en           = 'Focus on real torso rotation — don''t just move the elbow.' || chr(10) ||
                      'Slow movements are more effective than fast ones.' || chr(10) ||
                      'Keep your lower back pressed into the floor.'
WHERE slug = 'bicycle_crunch';

-- leg_raise
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Abdômen'],
  muscles_secondary = ARRAY['Core', 'Flexores do Quadril', 'Oblíquos'],
  equipment         = ARRAY['Sem equipamento'],
  instructions_pt   = 'Deite de costas com pernas estendidas e mãos sob os glúteos.' || chr(10) ||
                      'Pressione a lombar contra o chão contraindo o abdômen.' || chr(10) ||
                      'Levante as pernas juntas até 90° do chão, mantendo-as retas.' || chr(10) ||
                      'Desça lentamente sem encostar no chão.' || chr(10) ||
                      'Mantenha o abdômen contraído durante todo o movimento.',
  instructions_en   = 'Lie on your back with legs extended and hands under your glutes.' || chr(10) ||
                      'Press your lower back into the floor by contracting your abs.' || chr(10) ||
                      'Raise both legs together to 90°, keeping them straight.' || chr(10) ||
                      'Lower slowly without touching the floor.' || chr(10) ||
                      'Keep your abs engaged throughout the movement.',
  tips_pt           = 'Não deixe a lombar sair do chão — é o sinal de que o core perdeu o controle.' || chr(10) ||
                      'Mantenha as pernas o mais retas possível.' || chr(10) ||
                      'Inspire ao descer, expire ao subir.',
  tips_en           = 'Don''t let your lower back lift off the floor — that''s the sign your core lost control.' || chr(10) ||
                      'Keep your legs as straight as possible.' || chr(10) ||
                      'Inhale on the way down, exhale on the way up.'
WHERE slug = 'leg_raise';

-- russian_twist
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Oblíquos', 'Core'],
  muscles_secondary = ARRAY['Abdômen', 'Flexores do Quadril'],
  equipment         = ARRAY['Sem equipamento'],
  instructions_pt   = 'Sente no chão com joelhos dobrados e pés levantados do chão.' || chr(10) ||
                      'Incline o tronco a cerca de 45° para trás, mantendo as costas retas.' || chr(10) ||
                      'Junte as mãos à frente do peito.' || chr(10) ||
                      'Gire o tronco para a direita, levando as mãos ao lado do quadril.' || chr(10) ||
                      'Retorne ao centro e gire para a esquerda. Mantenha o abdômen contraído.',
  instructions_en   = 'Sit on the floor with knees bent and feet lifted off the ground.' || chr(10) ||
                      'Lean your torso back about 45°, keeping your back straight.' || chr(10) ||
                      'Clasp hands in front of your chest.' || chr(10) ||
                      'Rotate your torso to the right, bringing your hands to the side of your hip.' || chr(10) ||
                      'Return to center and rotate left. Keep abs engaged.',
  tips_pt           = 'Mantenha a coluna reta — não curve as costas ao inclinar.' || chr(10) ||
                      'Segure um peso para aumentar a intensidade.' || chr(10) ||
                      'Movimentos lentos e controlados maximizam a ativação dos oblíquos.',
  tips_en           = 'Keep your spine straight — don''t round your back when leaning.' || chr(10) ||
                      'Hold a weight to increase intensity.' || chr(10) ||
                      'Slow, controlled movements maximize oblique activation.'
WHERE slug = 'russian_twist';

-- dead_bug
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Core', 'Abdômen'],
  muscles_secondary = ARRAY['Flexores do Quadril', 'Ombros'],
  equipment         = ARRAY['Sem equipamento'],
  instructions_pt   = 'Deite de costas com braços estendidos em direção ao teto.' || chr(10) ||
                      'Pernas flexionadas a 90° com quadris e joelhos a 90°.' || chr(10) ||
                      'Pressione a lombar contra o chão e contraia o core.' || chr(10) ||
                      'Estenda o braço direito atrás da cabeça e a perna esquerda em direção ao chão.' || chr(10) ||
                      'Volte à posição inicial e repita do outro lado. Lombar sempre no chão.',
  instructions_en   = 'Lie on your back with arms extended toward the ceiling.' || chr(10) ||
                      'Legs bent at 90° with hips and knees at 90°.' || chr(10) ||
                      'Press your lower back into the floor and engage your core.' || chr(10) ||
                      'Extend your right arm overhead and left leg toward the floor.' || chr(10) ||
                      'Return to start and repeat on the other side. Lower back always on the floor.',
  tips_pt           = 'Nunca deixe a lombar sair do chão — é o critério principal deste exercício.' || chr(10) ||
                      'Mova devagar — controle é mais importante que velocidade.' || chr(10) ||
                      'Expire ao estender, inspire ao retornar.',
  tips_en           = 'Never let your lower back leave the floor — that''s the main criterion for this exercise.' || chr(10) ||
                      'Move slowly — control is more important than speed.' || chr(10) ||
                      'Exhale as you extend, inhale as you return.'
WHERE slug = 'dead_bug';

-- bird_dog
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Core', 'Lombar'],
  muscles_secondary = ARRAY['Glúteos', 'Ombros', 'Isquiotibiais'],
  equipment         = ARRAY['Sem equipamento'],
  instructions_pt   = 'Fique em 4 apoios com mãos abaixo dos ombros e joelhos abaixo do quadril.' || chr(10) ||
                      'Contraia o core para estabilizar a coluna.' || chr(10) ||
                      'Estenda simultaneamente o braço direito à frente e a perna esquerda atrás.' || chr(10) ||
                      'Ambos paralelos ao chão. Segure 2-3 segundos.' || chr(10) ||
                      'Retorne e alterne para braço esquerdo e perna direita.',
  instructions_en   = 'Get on all fours with hands below shoulders and knees under hips.' || chr(10) ||
                      'Engage your core to stabilize your spine.' || chr(10) ||
                      'Simultaneously extend your right arm forward and left leg backward.' || chr(10) ||
                      'Both parallel to the floor. Hold for 2-3 seconds.' || chr(10) ||
                      'Return and alternate with left arm and right leg.',
  tips_pt           = 'Mantenha o quadril nivelado — não o deixe rodar para nenhum dos lados.' || chr(10) ||
                      'Olhe para o chão para manter a coluna neutra.' || chr(10) ||
                      'Mova com controle — velocidade reduz a eficácia.',
  tips_en           = 'Keep hips level — don''t let them rotate to either side.' || chr(10) ||
                      'Look at the floor to keep your spine neutral.' || chr(10) ||
                      'Move with control — speed reduces effectiveness.'
WHERE slug = 'bird_dog';

-- flutter_kick
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Abdômen'],
  muscles_secondary = ARRAY['Core', 'Flexores do Quadril', 'Quadríceps'],
  equipment         = ARRAY['Sem equipamento'],
  instructions_pt   = 'Deite de costas com pernas estendidas e mãos sob os glúteos.' || chr(10) ||
                      'Pressione a lombar contra o chão.' || chr(10) ||
                      'Eleve as pernas ligeiramente do chão (cerca de 15 cm).' || chr(10) ||
                      'Alterne elevando e abaixando cada perna em movimento rápido, como se estivesse nadando.' || chr(10) ||
                      'Mantenha o abdômen contraído e a lombar pressionada no chão.',
  instructions_en   = 'Lie on your back with legs extended and hands under your glutes.' || chr(10) ||
                      'Press your lower back into the floor.' || chr(10) ||
                      'Raise your legs slightly off the ground (about 15 cm).' || chr(10) ||
                      'Alternate raising and lowering each leg in a quick motion, as if swimming.' || chr(10) ||
                      'Keep your abs engaged and lower back pressed down.',
  tips_pt           = 'Não deixe a lombar arquejar — mantenha-a no chão.' || chr(10) ||
                      'Quanto mais baixas as pernas, mais difícil o exercício.' || chr(10) ||
                      'Respire normalmente, não prenda o ar.',
  tips_en           = 'Don''t let your lower back arch — keep it on the floor.' || chr(10) ||
                      'The lower your legs, the harder the exercise.' || chr(10) ||
                      'Breathe normally, don''t hold your breath.'
WHERE slug = 'flutter_kick';

-- pike_pushup
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Ombros', 'Tríceps'],
  muscles_secondary = ARRAY['Core', 'Peitoral Superior', 'Serrátil'],
  equipment         = ARRAY['Sem equipamento'],
  instructions_pt   = 'Comece na posição de prancha alta.' || chr(10) ||
                      'Eleve o quadril em direção ao teto formando um V invertido.' || chr(10) ||
                      'Dobre os cotovelos para baixar a cabeça em direção ao chão entre as mãos.' || chr(10) ||
                      'Quando a cabeça estiver quase tocando o chão, empurre de volta.' || chr(10) ||
                      'Mantenha o quadril elevado durante todo o movimento.',
  instructions_en   = 'Start in a high plank position.' || chr(10) ||
                      'Lift your hips toward the ceiling to form an inverted V shape.' || chr(10) ||
                      'Bend your elbows to lower your head toward the floor between your hands.' || chr(10) ||
                      'When your head is nearly touching the floor, push back up.' || chr(10) ||
                      'Keep hips elevated throughout the movement.',
  tips_pt           = 'Quanto mais alto o quadril, maior a ativação dos ombros.' || chr(10) ||
                      'Mantenha os cotovelos voltados para trás, não para os lados.' || chr(10) ||
                      'É um ótimo preparatório para o handstand push-up.',
  tips_en           = 'The higher your hips, the greater the shoulder activation.' || chr(10) ||
                      'Keep elbows pointing backward, not to the sides.' || chr(10) ||
                      'It''s a great preparatory exercise for handstand push-ups.'
WHERE slug = 'pike_pushup';

-- diamond_pushup
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Tríceps', 'Peitoral'],
  muscles_secondary = ARRAY['Core', 'Deltóide Anterior'],
  equipment         = ARRAY['Sem equipamento'],
  instructions_pt   = 'Coloque as mãos próximas entre si formando um diamante com polegares e indicadores.' || chr(10) ||
                      'Mãos posicionadas abaixo do esterno.' || chr(10) ||
                      'Mantenha o corpo em linha reta.' || chr(10) ||
                      'Desça o peito em direção às mãos, mantendo cotovelos próximos ao corpo.' || chr(10) ||
                      'Quando o peito quase tocar as mãos, empurre de volta.',
  instructions_en   = 'Place your hands close together forming a diamond with thumbs and index fingers.' || chr(10) ||
                      'Hands positioned below your sternum.' || chr(10) ||
                      'Keep your body in a straight line.' || chr(10) ||
                      'Lower your chest toward your hands, keeping elbows close to your body.' || chr(10) ||
                      'When your chest nearly touches your hands, push back up.',
  tips_pt           = 'Os cotovelos devem mover paralelamente ao corpo, não para os lados.' || chr(10) ||
                      'É mais difícil que a flexão normal — progrida gradualmente.' || chr(10) ||
                      'Mantenha o core ativo para não deixar o quadril cair.',
  tips_en           = 'Elbows should move parallel to your body, not flare out.' || chr(10) ||
                      'It''s harder than a regular push-up — progress gradually.' || chr(10) ||
                      'Keep your core active to prevent your hips from sagging.'
WHERE slug = 'diamond_pushup';

-- wide_pushup
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Peitoral'],
  muscles_secondary = ARRAY['Tríceps', 'Deltóide Anterior', 'Core', 'Serrátil'],
  equipment         = ARRAY['Sem equipamento'],
  instructions_pt   = 'Comece na posição de prancha alta com mãos mais largas que os ombros.' || chr(10) ||
                      'Dedos apontam levemente para fora.' || chr(10) ||
                      'Mantenha o corpo em linha reta com o core contraído.' || chr(10) ||
                      'Desça o peito em direção ao chão, cotovelos apontados para fora.' || chr(10) ||
                      'Quando o peito estiver próximo ao chão, empurre de volta.',
  instructions_en   = 'Start in a high plank with hands wider than shoulder-width.' || chr(10) ||
                      'Fingers point slightly outward.' || chr(10) ||
                      'Keep your body in a straight line with core tight.' || chr(10) ||
                      'Lower your chest toward the floor, elbows pointing outward.' || chr(10) ||
                      'When your chest is close to the floor, push back up.',
  tips_pt           = 'A postura mais aberta enfatiza mais o peitoral que a flexão padrão.' || chr(10) ||
                      'Não deixe os cotovelos ultrapassar 90° para proteger os ombros.' || chr(10) ||
                      'Mantenha o core ativo durante todo o movimento.',
  tips_en           = 'The wider stance emphasizes the chest more than a standard push-up.' || chr(10) ||
                      'Don''t let elbows go past 90° to protect your shoulders.' || chr(10) ||
                      'Keep your core active throughout the movement.'
WHERE slug = 'wide_pushup';

-- tricep_dip
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Tríceps'],
  muscles_secondary = ARRAY['Peitoral', 'Deltóide Anterior', 'Core'],
  equipment         = ARRAY['Cadeira', 'Banco'],
  instructions_pt   = 'Sente na borda de uma cadeira ou banco com mãos ao lado do quadril.' || chr(10) ||
                      'Dedos apontam para a frente.' || chr(10) ||
                      'Deslize os quadris para fora da superfície.' || chr(10) ||
                      'Dobre os cotovelos para baixar o corpo, mantendo-os paralelos ao tronco.' || chr(10) ||
                      'Desça até os cotovelos formarem 90°. Empurre de volta.',
  instructions_en   = 'Sit on the edge of a chair or bench with hands beside your hips.' || chr(10) ||
                      'Fingers point forward.' || chr(10) ||
                      'Slide your hips off the surface.' || chr(10) ||
                      'Bend your elbows to lower your body, keeping them parallel to your torso.' || chr(10) ||
                      'Lower until elbows reach 90°. Push back up.',
  tips_pt           = 'Mantenha os quadris próximos à superfície — não os afaste demais.' || chr(10) ||
                      'Cotovelos para trás, não para os lados.' || chr(10) ||
                      'Pernas dobradas é mais fácil; estendidas é mais difícil.',
  tips_en           = 'Keep your hips close to the surface — don''t move them too far out.' || chr(10) ||
                      'Elbows point backward, not to the sides.' || chr(10) ||
                      'Bent legs is easier; extended legs is harder.'
WHERE slug = 'tricep_dip';

-- high_knees
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Quadríceps', 'Flexores do Quadril'],
  muscles_secondary = ARRAY['Core', 'Panturrilhas', 'Glúteos'],
  equipment         = ARRAY['Sem equipamento'],
  instructions_pt   = 'Fique em pé com pés na largura dos ombros.' || chr(10) ||
                      'Corra no lugar levantando os joelhos acima do quadril.' || chr(10) ||
                      'Mantenha os braços dobrados a 90° e em movimento.' || chr(10) ||
                      'Aterrise na ponta dos pés para reduzir o impacto.' || chr(10) ||
                      'Mantenha o tronco ereto e o core ativo.',
  instructions_en   = 'Stand with feet hip-width apart.' || chr(10) ||
                      'Run in place, raising your knees to hip height or above.' || chr(10) ||
                      'Keep arms bent at 90° and swinging.' || chr(10) ||
                      'Land on your toes to reduce impact.' || chr(10) ||
                      'Keep your torso upright and core engaged.',
  tips_pt           = 'Quanto mais alto o joelho, maior a intensidade.' || chr(10) ||
                      'Mantenha o ritmo constante para maximizar o benefício cardiovascular.' || chr(10) ||
                      'Respire de forma rítmica — não prenda o ar.',
  tips_en           = 'The higher the knee, the greater the intensity.' || chr(10) ||
                      'Maintain a steady rhythm to maximize cardiovascular benefit.' || chr(10) ||
                      'Breathe rhythmically — don''t hold your breath.'
WHERE slug = 'high_knees';

-- bear_crawl
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Core', 'Ombros'],
  muscles_secondary = ARRAY['Peitoral', 'Glúteos', 'Quadríceps', 'Tríceps'],
  equipment         = ARRAY['Sem equipamento'],
  instructions_pt   = 'Fique em 4 apoios com joelhos levemente elevados do chão.' || chr(10) ||
                      'Peso apoiado nas mãos e nas pontas dos pés.' || chr(10) ||
                      'Avance simultaneamente mão direita e pé esquerdo.' || chr(10) ||
                      'Depois avance mão esquerda e pé direito.' || chr(10) ||
                      'Continue o padrão alternado mantendo o quadril baixo e alinhado.',
  instructions_en   = 'Get on all fours with knees slightly lifted off the floor.' || chr(10) ||
                      'Weight supported on hands and toes.' || chr(10) ||
                      'Move your right hand and left foot forward simultaneously.' || chr(10) ||
                      'Then move your left hand and right foot.' || chr(10) ||
                      'Continue the alternating pattern keeping hips low and level.',
  tips_pt           = 'Mantenha os joelhos apenas alguns centímetros do chão.' || chr(10) ||
                      'O quadril não deve subir — mantenha-o nivelado com os ombros.' || chr(10) ||
                      'Respire de forma constante durante o movimento.',
  tips_en           = 'Keep knees only a few centimeters off the floor.' || chr(10) ||
                      'Your hips should not rise — keep them level with your shoulders.' || chr(10) ||
                      'Breathe steadily throughout the movement.'
WHERE slug = 'bear_crawl';

-- inchworm
UPDATE public.exercises SET
  muscles_primary   = ARRAY['Core', 'Isquiotibiais'],
  muscles_secondary = ARRAY['Peitoral', 'Lombar', 'Tríceps', 'Ombros'],
  equipment         = ARRAY['Sem equipamento'],
  instructions_pt   = 'Fique em pé.' || chr(10) ||
                      'Incline para frente e coloque as mãos no chão próximo aos pés.' || chr(10) ||
                      'Caminhe com as mãos para frente até a posição de prancha alta.' || chr(10) ||
                      'Segure 1 segundo na prancha.' || chr(10) ||
                      'Caminhe as mãos de volta aos pés e erga o tronco para retornar em pé.',
  instructions_en   = 'Stand with feet together.' || chr(10) ||
                      'Bend forward and place your hands on the floor near your feet.' || chr(10) ||
                      'Walk your hands forward until you reach a high plank position.' || chr(10) ||
                      'Hold for 1 second in plank.' || chr(10) ||
                      'Walk your hands back to your feet and raise your torso to stand.',
  tips_pt           = 'Mantenha as pernas o mais retas possível ao dobrar o tronco.' || chr(10) ||
                      'Contraia o core na posição de prancha.' || chr(10) ||
                      'É um excelente exercício de aquecimento para o treino.',
  tips_en           = 'Keep your legs as straight as possible when bending forward.' || chr(10) ||
                      'Engage your core in the plank position.' || chr(10) ||
                      'It''s an excellent warm-up exercise for any workout.'
WHERE slug = 'inchworm';
