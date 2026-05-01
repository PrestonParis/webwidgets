import { ChessStudy } from '@/features/chess/types/chess';

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

export interface StudiesSidebarProps {
    gameId: string;
}
