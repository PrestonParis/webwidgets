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
export interface ChessStudy {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    created_at: string;
    updated_at: string; // Joined count (not in DB, computed client-side or via view)
    variation_count?: number;
}

export type SideToMove = 'white' | 'black';
interface BaseVariation {
    id: string;
    user_id: string;
    title: string;
    start_fen: string;
    pgn: string;
    annotation: string | null;
    practiced_count: number;
    last_practiced: string | null; // ISO string from DB
    created_at: string;
    updated_at: string;
    side_to_move?: SideToMove;
}
export interface GameVariation extends BaseVariation {
    game_id: string;
    study_id: null;
    branch_move_index: number; // Required for games to know where it split
}

export type NewVariation = Omit<
    BaseVariation,
    'id' | 'created_at' | 'updated_at' | 'practiced_count'
>;

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
    activeVariation: BaseVariation | null;
    onMoveSelect: (i: number) => void;
}

export interface MoveTrainerProps {
    variation: BaseVariation;
    layout?: 'compact' | 'expanded';
    onBack?: () => void;
}

export interface TrainerSidebarProps {
    tab: Tab;
    moveIndex: number;
    variations: BaseVariation[];
    moves: ParsedMove[];
    onMoveSelect: (i: number) => void;
    onVariationSelect: (variation: BaseVariation) => void;
    onAddVariation: () => void;
    onDeleteVariation: (variationId: string) => void;
    activeVariation: BaseVariation | null;
    setActiveVariation: (variation: BaseVariation | null) => void;
    gameId: string;
}

export interface StudiesSidebarProps {
    gameId: string;
}

export interface ReviewSidebarProps {
    variations: BaseVariation[];
    activeVariation: BaseVariation | null;
    onSelect: (variation: BaseVariation) => void;
    onBack: () => void;
}

export type AddVariationModalProps =
    | {
          studyId: string;
          onClose: () => void;
          onSaved: (variation: BaseVariation) => void;
      }
    | {
          gameId: string;
          branchIndex: number;
          startFen: string;
          onClose: () => void;
          onSaved: (variation: BaseVariation) => void;
      };

export type VariationInsert = {
    user_id: string;
    title: string;
    pgn: string;
    annotation: string | null;
} & (
    | {
          study_id: string;
          start_fen: string;
          game_id?: never;
          branch_move_index?: never;
      }
    | {
          game_id: string;
          start_fen: string;
          branch_move_index: number;
          study_id?: never;
      }
);
