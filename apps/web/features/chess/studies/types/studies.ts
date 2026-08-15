import { ChessStudy } from '@/features/chess/types/chess';
import { StudyVariation } from '@/features/chess/types/variation';

export interface StudyVariationCardProps {
    variation: StudyVariation;
    onTrain: (v: StudyVariation) => void;
    onDelete: (id: string) => void;
}

export interface StudiesHeaderProps {
    onCreateClick: () => void;
}

export interface StudiesListProps {
    studies: ChessStudy[];
    onDelete: (id: string) => void;
}

export interface StudyCardProps {
    study: ChessStudy;
    onDelete: (id: string) => void;
}
