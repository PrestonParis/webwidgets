export interface ChessGame {
    id: string;
    user_id: string;
    white: string;
    black: string;
    result: string | null;
    event: string | null;
    site: string | null;
    played_at: string | null;
    pgn: string;
    current_move_index: number;
    last_viewed_at: string | null;
    created_at: string;
    updated_at: string;
}

/** A parsed move with the FEN after it was played */
export interface ChessMove {
    san: string; // "e4", "Nf3", "O-O", etc.
    from: string; // "e2"
    to: string; // "e4"
    fenAfter: string;
}

export interface ChessStudy {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    // Joined count (not in DB, computed client-side or via view)
    variation_count?: number;
}

export interface ChessVariation {
    id: string;
    user_id: string;
    game_id: string | null;
    study_id: string | null;
    title: string;
    start_fen: string;
    branch_move_index: number | null;
    pgn: string;
    annotation: string | null;
    practiced_count: number;
    last_practiced: string | null;
    created_at: string;
    updated_at: string;
}

/** Parsed move with from/to squares and resulting FEN */
export interface ParsedMove {
    san: string; // e.g. "e4"
    from: string; // e.g. "e2"
    to: string; // e.g. "e4"
    fen: string; // FEN after this move
}

/** Result of the move trainer for a single session */
export type TrainerResult = 'correct' | 'incorrect' | 'hint';

export type Tab = 'review' | 'trainer' | 'studies';

export interface KeyboardNavProps {
    tab: Tab;
    movesLength: number;
    onPrev: () => void;
    onNext: () => void;
    onStart: () => void;
    onEnd: () => void;
}

export interface GameHeaderProps {
    game: ChessGame;
    tab: Tab;
    onBack: () => void;
    onTabChange: (t: Tab) => void;
}
export type SquareStyles = {
    [square: string]: React.CSSProperties;
};
export interface BoardViewProps {
    white: string;
    black: string;
    boardFen: string;
    squareStyles: SquareStyles;
    moveIndex: number;
    movesLength: number;
    showControls: boolean;
    activeVariation: ChessVariation | null;
    onMoveSelect: (i: number) => void;
}
