import dynamic from 'next/dynamic';
import type { ExerciseSlug } from './MuscleAvatarClient';

export type { ExerciseSlug };

interface MuscleAvatarProps {
  slug: ExerciseSlug;
  highlightColor?: string;
  size?: number;
}

const MuscleAvatarClient = dynamic(() => import('./MuscleAvatarClient'), { ssr: false });

export default function MuscleAvatar(props: MuscleAvatarProps) {
  return <MuscleAvatarClient {...props} />;
}
