'use client';

import Model, { type IExerciseData } from 'react-body-highlighter';

// ── Mapa de músculos por exercício ────────────────────────────────────────────

const EXERCISE_MUSCLES = {
  squat:            { name: 'Agachamento', muscles: ['quadriceps', 'gluteal'] },
  pushup:           { name: 'Flexão',      muscles: ['chest', 'triceps', 'front-deltoids'] },
  plank:            { name: 'Prancha',     muscles: ['abs', 'obliques'] },
  lunge:            { name: 'Afundo',      muscles: ['quadriceps', 'gluteal'] },
  glute_bridge:     { name: 'Elevação',    muscles: ['gluteal', 'hamstring'] },
  side_plank:       { name: 'Prancha Lat', muscles: ['obliques'] },
  mountain_climber: { name: 'Escalada',    muscles: ['abs', 'quadriceps'] },
  superman:         { name: 'Superman',    muscles: ['lower-back', 'gluteal'] },
  burpee:           { name: 'Burpee',      muscles: ['chest', 'quadriceps', 'abs'] },
} as const;

export type ExerciseSlug = keyof typeof EXERCISE_MUSCLES;

// ── Props ─────────────────────────────────────────────────────────────────────

interface MuscleAvatarProps {
  slug: ExerciseSlug;
  /** Cor de destaque (padrão: índigo do design system) */
  highlightColor?: string;
  /** Tamanho do SVG em px (aplicado à largura de cada vista) */
  size?: number;
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function MuscleAvatar({
  slug,
  highlightColor = '#6366f1',
  size = 120,
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
