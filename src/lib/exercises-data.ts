/**
 * Fonte única de verdade para exercícios.
 * Usado por /analyze e /exercises — sem duplicação.
 */

export type ExerciseSlug =
  | 'squat' | 'pushup' | 'plank' | 'lunge'
  | 'glute_bridge' | 'side_plank' | 'superman'
  | 'mountain_climber' | 'burpee'
  | 'jump_squat' | 'sumo_squat' | 'donkey_kick' | 'fire_hydrant'
  | 'hip_thrust' | 'wall_sit'
  | 'crunch' | 'bicycle_crunch' | 'leg_raise' | 'russian_twist'
  | 'dead_bug' | 'bird_dog' | 'flutter_kick'
  | 'pike_pushup' | 'diamond_pushup' | 'wide_pushup' | 'tricep_dip'
  | 'high_knees' | 'bear_crawl' | 'inchworm';

export type ExerciseCategory =
  | 'pernas' | 'peito' | 'core' | 'costas' | 'ombros' | 'gluteos' | 'full_body';

export interface ExerciseData {
  slug: ExerciseSlug;
  name_pt: string;
  name_en: string;
  category: ExerciseCategory;
  difficulty: 'iniciante' | 'intermediario';
  muscles_primary: string[];
  instructions_pt: string[];
  video_url: string | null;
}

/** Exercícios baseados em tempo (sem contador de reps) */
export const TIME_BASED_SLUGS: ExerciseSlug[] = [
  'plank', 'side_plank', 'superman', 'wall_sit', 'dead_bug', 'bird_dog',
];

/** Lista ordenada canônica de todos os exercícios */
export const EXERCISE_SLUGS: ExerciseSlug[] = [
  'squat', 'pushup', 'plank', 'lunge', 'glute_bridge',
  'side_plank', 'superman', 'mountain_climber', 'burpee',
  'jump_squat', 'sumo_squat', 'donkey_kick', 'fire_hydrant',
  'hip_thrust', 'wall_sit',
  'crunch', 'bicycle_crunch', 'leg_raise', 'russian_twist',
  'dead_bug', 'bird_dog', 'flutter_kick',
  'pike_pushup', 'diamond_pushup', 'wide_pushup', 'tricep_dip',
  'high_knees', 'bear_crawl', 'inchworm',
];

export const EXERCISES_DATA: Record<ExerciseSlug, ExerciseData> = {
  squat: {
    slug: 'squat',
    name_pt: 'Agachamento',
    name_en: 'Squat',
    category: 'pernas',
    difficulty: 'iniciante',
    muscles_primary: ['Quadríceps', 'Glúteos'],
    instructions_pt: [
      'Fique em pé com os pés na largura dos ombros',
      'Empurre o quadril para trás como se fosse sentar em uma cadeira',
      'Desça até as coxas ficarem paralelas ao chão',
      'Mantenha as costas retas e o peito erguido',
      'Empurre o chão com os pés para retornar, contraindo os glúteos no topo',
    ],
    video_url: 'https://res.cloudinary.com/dp7xulqkf/video/upload/v1772419065/Agachamento_r2b9pi.mp4',
  },
  pushup: {
    slug: 'pushup',
    name_pt: 'Flexão de Braços',
    name_en: 'Push-up',
    category: 'peito',
    difficulty: 'iniciante',
    muscles_primary: ['Peitoral', 'Tríceps'],
    instructions_pt: [
      'Deite de bruços com mãos levemente mais largas que os ombros',
      'Mantenha o corpo em linha reta da cabeça aos pés com o core contraído',
      'Desça o peito até quase tocar o chão',
      'Mantenha os cotovelos a 45° do corpo',
      'Empurre o chão e estenda os braços para retornar',
    ],
    video_url: null,
  },
  plank: {
    slug: 'plank',
    name_pt: 'Prancha',
    name_en: 'Plank',
    category: 'core',
    difficulty: 'iniciante',
    muscles_primary: ['Core', 'Abdômen'],
    instructions_pt: [
      'Apoie-se nos antebraços e pontas dos pés',
      'Eleve o quadril até o corpo formar uma linha reta',
      'Contraia o abdômen e os glúteos',
      'Mantenha o olhar para baixo sem tensionar o pescoço',
      'Segure a posição pelo tempo determinado',
    ],
    video_url: 'https://res.cloudinary.com/dp7xulqkf/video/upload/v1772419065/prancha_h2uoth.mp4',
  },
  lunge: {
    slug: 'lunge',
    name_pt: 'Afundo',
    name_en: 'Lunge',
    category: 'pernas',
    difficulty: 'iniciante',
    muscles_primary: ['Quadríceps', 'Glúteos'],
    instructions_pt: [
      'Fique em pé com os pés juntos',
      'Dê um passo largo à frente com uma perna',
      'Desça o joelho traseiro em direção ao chão mantendo o tronco ereto',
      'O joelho da frente deve ficar acima do tornozelo',
      'Empurre o chão com o pé da frente e alterne as pernas',
    ],
    video_url: 'https://res.cloudinary.com/dp7xulqkf/video/upload/v1772419065/Afundo_szybf4.mp4',
  },
  glute_bridge: {
    slug: 'glute_bridge',
    name_pt: 'Elevação de Quadril',
    name_en: 'Glute Bridge',
    category: 'gluteos',
    difficulty: 'iniciante',
    muscles_primary: ['Glúteos', 'Isquiotibiais'],
    instructions_pt: [
      'Deite de costas com joelhos dobrados e pés no chão na largura do quadril',
      'Contraia os glúteos e eleve o quadril',
      'Forme uma linha reta dos joelhos aos ombros',
      'Segure 1-2 segundos no topo apertando os glúteos',
      'Desça lentamente e repita',
    ],
    video_url: 'https://res.cloudinary.com/dp7xulqkf/video/upload/v1772419065/Eleva%C3%A7%C3%A3o_de_quadril_tvjpdx.mp4',
  },
  side_plank: {
    slug: 'side_plank',
    name_pt: 'Prancha Lateral',
    name_en: 'Side Plank',
    category: 'core',
    difficulty: 'intermediario',
    muscles_primary: ['Oblíquos', 'Core'],
    instructions_pt: [
      'Deite de lado apoiando-se no antebraço com cotovelo abaixo do ombro',
      'Eleve o quadril até o corpo formar uma linha reta da cabeça aos pés',
      'Mantenha os quadris empilhados sem tombar para frente',
      'Segure pelo tempo determinado',
      'Troque de lado',
    ],
    video_url: 'https://res.cloudinary.com/dp7xulqkf/video/upload/v1772419065/Prancha_lateral_vsps2z.mp4',
  },
  superman: {
    slug: 'superman',
    name_pt: 'Superman',
    name_en: 'Superman',
    category: 'costas',
    difficulty: 'iniciante',
    muscles_primary: ['Lombar', 'Glúteos'],
    instructions_pt: [
      'Deite de bruços com braços estendidos à frente e pernas unidas',
      'Contraia a lombar e os glúteos',
      'Eleve simultaneamente braços e pernas do chão',
      'Segure 2-3 segundos no ponto mais alto',
      'Desça lentamente sem bater no chão e repita',
    ],
    video_url: 'https://res.cloudinary.com/dp7xulqkf/video/upload/v1772419065/Superman_anyx24.mp4',
  },
  mountain_climber: {
    slug: 'mountain_climber',
    name_pt: 'Escalada',
    name_en: 'Mountain Climber',
    category: 'core',
    difficulty: 'intermediario',
    muscles_primary: ['Core', 'Ombros'],
    instructions_pt: [
      'Comece na posição de prancha alta com mãos abaixo dos ombros',
      'Traga o joelho direito em direção ao peito em movimento rápido',
      'Retorne e imediatamente leve o joelho esquerdo ao peito',
      'Alterne as pernas num ritmo contínuo como se estivesse correndo no lugar',
      'Mantenha o quadril nivelado durante todo o exercício',
    ],
    video_url: null,
  },
  burpee: {
    slug: 'burpee',
    name_pt: 'Burpee',
    name_en: 'Burpee',
    category: 'full_body',
    difficulty: 'intermediario',
    muscles_primary: ['Corpo Inteiro', 'Core'],
    instructions_pt: [
      'Em pé, agache e coloque as mãos no chão',
      'Jogue os pés para trás até a posição de prancha',
      'Realize uma flexão (opcional para iniciantes)',
      'Salte os pés de volta para as mãos',
      'Salte verticalmente com os braços acima da cabeça e aterrise suavemente',
    ],
    video_url: null,
  },
  jump_squat: {
    slug: 'jump_squat',
    name_pt: 'Agachamento Explosivo',
    name_en: 'Jump Squat',
    category: 'pernas',
    difficulty: 'intermediario',
    muscles_primary: ['Quadríceps', 'Glúteos'],
    instructions_pt: [
      'Fique em pé com pés na largura dos ombros',
      'Desça em agachamento',
      'Suba com impulso e salte',
      'Aterrisse suavemente e repita',
    ],
    video_url: null,
  },
  sumo_squat: {
    slug: 'sumo_squat',
    name_pt: 'Agachamento Sumô',
    name_en: 'Sumo Squat',
    category: 'pernas',
    difficulty: 'iniciante',
    muscles_primary: ['Quadríceps', 'Adutores', 'Glúteos'],
    instructions_pt: [
      'Pés mais abertos que os ombros, dedos voltados para fora',
      'Mantenha as costas retas',
      'Desça até as coxas paralelas ao chão',
      'Empurre os joelhos para fora ao subir',
    ],
    video_url: null,
  },
  donkey_kick: {
    slug: 'donkey_kick',
    name_pt: 'Donkey Kick',
    name_en: 'Donkey Kick',
    category: 'gluteos',
    difficulty: 'iniciante',
    muscles_primary: ['Glúteos'],
    instructions_pt: [
      'Fique em 4 apoios, costas retas',
      'Chute uma perna para trás e para cima',
      'Mantenha o joelho dobrado a 90°',
      'Contraia o glúteo no topo e repita',
    ],
    video_url: null,
  },
  fire_hydrant: {
    slug: 'fire_hydrant',
    name_pt: 'Fire Hydrant',
    name_en: 'Fire Hydrant',
    category: 'gluteos',
    difficulty: 'iniciante',
    muscles_primary: ['Glúteos'],
    instructions_pt: [
      'Fique em 4 apoios',
      'Levante um joelho para o lado como um cachorro',
      'Mantenha o joelho dobrado a 90°',
      'Contraia o glúteo e volte',
    ],
    video_url: null,
  },
  hip_thrust: {
    slug: 'hip_thrust',
    name_pt: 'Hip Thrust',
    name_en: 'Hip Thrust',
    category: 'gluteos',
    difficulty: 'iniciante',
    muscles_primary: ['Glúteos'],
    instructions_pt: [
      'Deite com ombros no chão e joelhos dobrados',
      'Empurre o quadril para cima contraindo os glúteos',
      'Segure 1 segundo no topo',
      'Desça lentamente',
    ],
    video_url: null,
  },
  wall_sit: {
    slug: 'wall_sit',
    name_pt: 'Wall Sit',
    name_en: 'Wall Sit',
    category: 'pernas',
    difficulty: 'intermediario',
    muscles_primary: ['Quadríceps'],
    instructions_pt: [
      'Encoste as costas na parede',
      'Deslize até os joelhos formarem 90°',
      'Mantenha a posição pelo tempo determinado',
      'Costas sempre em contato com a parede',
    ],
    video_url: null,
  },
  crunch: {
    slug: 'crunch',
    name_pt: 'Abdominal',
    name_en: 'Crunch',
    category: 'core',
    difficulty: 'iniciante',
    muscles_primary: ['Abdômen'],
    instructions_pt: [
      'Deite de costas com joelhos dobrados',
      'Coloque as mãos atrás da cabeça',
      'Levante o tronco contraindo o abdômen',
      'Desça lentamente sem encostar a cabeça',
    ],
    video_url: null,
  },
  bicycle_crunch: {
    slug: 'bicycle_crunch',
    name_pt: 'Abdominal Bicicleta',
    name_en: 'Bicycle Crunch',
    category: 'core',
    difficulty: 'iniciante',
    muscles_primary: ['Abdômen', 'Oblíquos'],
    instructions_pt: [
      'Deite de costas com mãos atrás da cabeça',
      'Leve o cotovelo direito ao joelho esquerdo',
      'Alterne os lados em movimento de pedalada',
      'Mantenha o abdômen contraído',
    ],
    video_url: null,
  },
  leg_raise: {
    slug: 'leg_raise',
    name_pt: 'Elevação de Pernas',
    name_en: 'Leg Raise',
    category: 'core',
    difficulty: 'iniciante',
    muscles_primary: ['Abdômen'],
    instructions_pt: [
      'Deite de costas com pernas estendidas',
      'Levante as pernas até 90° do chão',
      'Desça lentamente sem encostar no chão',
      'Mantenha o abdômen contraído',
    ],
    video_url: null,
  },
  russian_twist: {
    slug: 'russian_twist',
    name_pt: 'Russian Twist',
    name_en: 'Russian Twist',
    category: 'core',
    difficulty: 'intermediario',
    muscles_primary: ['Oblíquos', 'Core'],
    instructions_pt: [
      'Sente com joelhos dobrados e tronco inclinado',
      'Junte as mãos à frente',
      'Gire o tronco para um lado depois para o outro',
      'Mantenha o abdômen contraído',
    ],
    video_url: null,
  },
  dead_bug: {
    slug: 'dead_bug',
    name_pt: 'Dead Bug',
    name_en: 'Dead Bug',
    category: 'core',
    difficulty: 'iniciante',
    muscles_primary: ['Core', 'Abdômen'],
    instructions_pt: [
      'Deite de costas com braços estendidos para cima',
      'Joelhos dobrados a 90° no ar',
      'Estenda braço direito e perna esquerda',
      'Alterne os lados mantendo lombar no chão',
    ],
    video_url: null,
  },
  bird_dog: {
    slug: 'bird_dog',
    name_pt: 'Bird Dog',
    name_en: 'Bird Dog',
    category: 'core',
    difficulty: 'iniciante',
    muscles_primary: ['Core', 'Lombar'],
    instructions_pt: [
      'Fique em 4 apoios',
      'Estenda braço direito e perna esquerda simultaneamente',
      'Mantenha a posição 2 segundos',
      'Alterne os lados',
    ],
    video_url: null,
  },
  flutter_kick: {
    slug: 'flutter_kick',
    name_pt: 'Flutter Kick',
    name_en: 'Flutter Kick',
    category: 'core',
    difficulty: 'iniciante',
    muscles_primary: ['Abdômen'],
    instructions_pt: [
      'Deite de costas com pernas levemente elevadas',
      'Faça movimentos alternados de chute',
      'Mantenha o abdômen contraído',
      'Não deixe as pernas tocar o chão',
    ],
    video_url: null,
  },
  pike_pushup: {
    slug: 'pike_pushup',
    name_pt: 'Flexão Pike',
    name_en: 'Pike Push-up',
    category: 'ombros',
    difficulty: 'intermediario',
    muscles_primary: ['Ombros', 'Tríceps'],
    instructions_pt: [
      'Fique em posição de prancha com quadril elevado formando V',
      'Dobre os cotovelos levando a cabeça ao chão',
      'Empurre de volta estendendo os braços',
      'Mantenha o quadril alto',
    ],
    video_url: null,
  },
  diamond_pushup: {
    slug: 'diamond_pushup',
    name_pt: 'Flexão Diamante',
    name_en: 'Diamond Push-up',
    category: 'peito',
    difficulty: 'intermediario',
    muscles_primary: ['Tríceps', 'Peitoral'],
    instructions_pt: [
      'Coloque as mãos juntas formando um diamante',
      'Mantenha o corpo reto',
      'Desça até o peito quase tocar as mãos',
      'Empurre de volta',
    ],
    video_url: null,
  },
  wide_pushup: {
    slug: 'wide_pushup',
    name_pt: 'Flexão Aberta',
    name_en: 'Wide Push-up',
    category: 'peito',
    difficulty: 'iniciante',
    muscles_primary: ['Peitoral'],
    instructions_pt: [
      'Coloque as mãos mais largas que os ombros',
      'Mantenha o corpo reto',
      'Desça até o peito quase tocar o chão',
      'Empurre de volta',
    ],
    video_url: null,
  },
  tricep_dip: {
    slug: 'tricep_dip',
    name_pt: 'Tríceps Dip',
    name_en: 'Tricep Dip',
    category: 'peito',
    difficulty: 'iniciante',
    muscles_primary: ['Tríceps'],
    instructions_pt: [
      'Sente na borda de uma cadeira com mãos ao lado do quadril',
      'Deslize o corpo para fora',
      'Desça dobrando os cotovelos',
      'Empurre de volta estendendo os braços',
    ],
    video_url: null,
  },
  high_knees: {
    slug: 'high_knees',
    name_pt: 'High Knees',
    name_en: 'High Knees',
    category: 'full_body',
    difficulty: 'iniciante',
    muscles_primary: ['Quadríceps', 'Flexores do Quadril'],
    instructions_pt: [
      'Fique em pé com pés na largura dos ombros',
      'Corra no lugar levantando os joelhos acima do quadril',
      'Mantenha os braços em movimento',
      'Ritmo acelerado',
    ],
    video_url: null,
  },
  bear_crawl: {
    slug: 'bear_crawl',
    name_pt: 'Bear Crawl',
    name_en: 'Bear Crawl',
    category: 'full_body',
    difficulty: 'intermediario',
    muscles_primary: ['Core', 'Ombros'],
    instructions_pt: [
      'Fique em 4 apoios com joelhos levemente elevados',
      'Avance mão direita e pé esquerdo',
      'Depois mão esquerda e pé direito',
      'Mantenha o quadril baixo',
    ],
    video_url: null,
  },
  inchworm: {
    slug: 'inchworm',
    name_pt: 'Inchworm',
    name_en: 'Inchworm',
    category: 'full_body',
    difficulty: 'intermediario',
    muscles_primary: ['Core', 'Isquiotibiais'],
    instructions_pt: [
      'Fique em pé',
      'Incline para frente e coloque as mãos no chão',
      'Caminhe com as mãos até a posição de prancha',
      'Volte caminhando com as mãos até os pés',
    ],
    video_url: null,
  },
};
