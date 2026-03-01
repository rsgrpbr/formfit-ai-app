'use client';

import Model, { type IExerciseData } from 'react-body-highlighter';

// ── Mapa de músculos por exercício ────────────────────────────────────────────

const EXERCISE_MUSCLES = {
  // ── Original 9 ────────────────────────────────────────────────────────────
  squat:            { name: 'Agachamento',     muscles: ['quadriceps', 'gluteal'] },
  pushup:           { name: 'Flexão',          muscles: ['chest', 'triceps', 'front-deltoids'] },
  plank:            { name: 'Prancha',         muscles: ['abs', 'obliques'] },
  lunge:            { name: 'Afundo',          muscles: ['quadriceps', 'gluteal'] },
  glute_bridge:     { name: 'Elev. Quadril',   muscles: ['gluteal', 'hamstring'] },
  side_plank:       { name: 'Prancha Lat.',    muscles: ['obliques'] },
  mountain_climber: { name: 'Escalada',        muscles: ['abs', 'quadriceps'] },
  superman:         { name: 'Superman',        muscles: ['lower-back', 'gluteal'] },
  burpee:           { name: 'Burpee',          muscles: ['chest', 'quadriceps', 'abs'] },
  // ── Pernas / glúteos ──────────────────────────────────────────────────────
  jump_squat:       { name: 'Agach. c/ Salto', muscles: ['quadriceps', 'calves', 'gluteal', 'hamstring'] },
  sumo_squat:       { name: 'Agach. Sumô',     muscles: ['quadriceps', 'adductor', 'gluteal'] },
  donkey_kick:      { name: 'Chute Traseiro',  muscles: ['gluteal', 'hamstring'] },
  fire_hydrant:     { name: 'Fire Hydrant',    muscles: ['adductor', 'gluteal'] },
  hip_thrust:       { name: 'Hip Thrust',      muscles: ['gluteal', 'hamstring'] },
  wall_sit:         { name: 'Cadeira Isom.',   muscles: ['quadriceps', 'gluteal'] },
  // ── Core ──────────────────────────────────────────────────────────────────
  crunch:           { name: 'Crunch',          muscles: ['abs'] },
  bicycle_crunch:   { name: 'Crunch Bicicleta',muscles: ['abs', 'obliques'] },
  leg_raise:        { name: 'Elev. de Pernas', muscles: ['abs', 'abductors'] },
  russian_twist:    { name: 'Torção Russa',    muscles: ['abs', 'obliques'] },
  dead_bug:         { name: 'Dead Bug',        muscles: ['abs', 'lower-back'] },
  bird_dog:         { name: 'Bird Dog',        muscles: ['abs', 'gluteal', 'lower-back'] },
  flutter_kick:     { name: 'Flutter Kick',    muscles: ['abs', 'abductors'] },
  // ── Push ──────────────────────────────────────────────────────────────────
  pike_pushup:      { name: 'Flexão Pike',     muscles: ['front-deltoids', 'triceps', 'upper-back'] },
  diamond_pushup:   { name: 'Flexão Diamante', muscles: ['chest', 'triceps'] },
  wide_pushup:      { name: 'Flexão Aberta',   muscles: ['chest', 'front-deltoids'] },
  tricep_dip:       { name: 'Tríceps Dip',     muscles: ['triceps', 'chest'] },
  // ── Full body ─────────────────────────────────────────────────────────────
  high_knees:       { name: 'Joelhos Altos',   muscles: ['quadriceps', 'abs', 'gluteal', 'hamstring'] },
  bear_crawl:       { name: 'Bear Crawl',      muscles: ['front-deltoids', 'abs', 'gluteal'] },
  inchworm:         { name: 'Inchworm',        muscles: ['abs', 'chest', 'hamstring', 'lower-back'] },
} as const;

export type ExerciseSlug = keyof typeof EXERCISE_MUSCLES;

// ── Props ─────────────────────────────────────────────────────────────────────

interface MuscleAvatarProps {
  slug: ExerciseSlug;
  /** Cor de destaque (padrão: índigo do design system) */
  highlightColor?: string;
  /** Tamanho do SVG em px (aplicado à largura de cada vista) */
  size?: number;
  /**
   * Gênero do avatar.
   * TODO: react-body-highlighter não possui prop nativa de sexo/gênero (v2.0.5).
   * Quando a lib adicionar suporte, passar aqui para alternar entre silhuetas.
   * Por enquanto todos os avatares renderizam o modelo masculino padrão.
   */
  gender?: 'male' | 'female';
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function MuscleAvatar({
  slug,
  highlightColor = '#6366f1',
  size = 120,
  gender = 'male',
}: MuscleAvatarProps) {
  const exercise = EXERCISE_MUSCLES[slug];
  const data: IExerciseData[] = [{ name: exercise.name, muscles: [...exercise.muscles] }];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-2 items-center justify-center">
        {/* Vista anterior (frente) */}
        <Model
          data={data}
          type="anterior"
          style={{ width: size, height: 'auto' }}
          highlightedColors={[highlightColor]}
        />

        {/* Vista posterior (costas) */}
        <Model
          data={data}
          type="posterior"
          style={{ width: size, height: 'auto' }}
          highlightedColors={[highlightColor]}
        />
      </div>

      <p className="text-xs text-gray-400 font-medium tracking-wide">
        {exercise.name}
      </p>
    </div>
  );
}
