export interface ChessGame {
    id: string;
    user_id: string;
    title: string | null;
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

export interface StudyChapter {
    id: string;
    study_id: string;
    user_id: string;
    title: string;
    pgn: string;
    position: number;
    created_at: string;
    updated_at: string;
}
export interface ChessStudy {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    variation_count?: number;
}

export type SideToMove = 'white' | 'black';

export interface ParsedMove {
    san: string;
    from: string;
    to: string;
    fen: string;
}

export type Tab = 'review' | 'trainer' | 'studies';

export type SquareStyles = Record<string, React.CSSProperties>;
