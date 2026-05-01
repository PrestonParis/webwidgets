import {
    ChessGame,
    GameVariation,
    ParsedMove,
    Tab,
} from '@/features/chess/types/chess';

export interface BoardViewProps {
    white: string;
    black: string;
    boardFen: string;
    squareStyles: { [square: string]: React.CSSProperties };
    moveIndex: number;
    movesLength: number;
    showControls: boolean;
    activeVariation: GameVariation | null;
    onMoveSelect: (i: number) => void;
}

export interface GameHeaderProps {
    game: ChessGame;
    tab: Tab;
    onBack: () => void;
    onTabChange: (t: Tab) => void;
}

export interface TrainerSidebarProps {
    tab: Tab;
    moveIndex: number;
    variations: GameVariation[];
    moves: ParsedMove[];
    onMoveSelect: (i: number) => void;
    onVariationSelect: (variation: GameVariation) => void;
    onAddVariation: () => void;
    onDeleteVariation: (variationId: string) => void;
    activeVariation: GameVariation | null;
    setActiveVariation: (variation: GameVariation | null) => void;
    gameId: string;
}

export interface ReviewSidebarProps {
    variations: GameVariation[];
    activeVariation: GameVariation | null;
    onSelect: (variation: GameVariation) => void;
    onBack: () => void;
}

export interface KeyboardNavProps {
    tab: Tab;
    movesLength: number;
    onPrev: () => void;
    onNext: () => void;
    onStart: () => void;
    onEnd: () => void;
}
