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

export interface BaseVariation {
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
    kind: 'game';
    game_id: string;
    study_id?: never;
    branch_move_index: number;
}

export interface StudyVariation extends BaseVariation {
    kind: 'study';
    study_id: string;
    game_id?: never;
    branch_move_index?: never;
}

export type Variation = GameVariation | StudyVariation;

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
    activeVariation: GameVariation | null;
    onMoveSelect: (i: number) => void;
}

export interface MoveTrainerProps {
    variation: GameVariation;
    layout?: 'compact' | 'expanded';
    onBack?: () => void;
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

export interface StudiesSidebarProps {
    gameId: string;
}

export interface ReviewSidebarProps {
    variations: GameVariation[];
    activeVariation: GameVariation | null;
    onSelect: (variation: GameVariation) => void;
    onBack: () => void;
}

export type AddVariationModalProps =
    | {
          studyId: string;
          onClose: () => void;
          onSaved: (variation: StudyVariation) => void;
      }
    | {
          gameId: string;
          branchIndex: number;
          startFen: string;
          onClose: () => void;
          onSaved: (variation: GameVariation) => void;
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
