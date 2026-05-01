import { Variation } from '@/features/chess/types/chess';

export type TrainerResult = 'correct' | 'incorrect' | 'hint';

export interface MoveTrainerProps {
    variation: Variation;
    layout?: 'compact' | 'expanded';
    onBack?: () => void;
}
