interface ChessGame {
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
interface ChessStudy {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    created_at: string;
    updated_at: string; // Joined count (not in DB, computed client-side or via view)
    variation_count?: number;
}

type SideToMove = 'white' | 'black';

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
interface GameVariation extends BaseVariation {
    kind: 'game';
    game_id: string;
    study_id?: never;
    branch_move_index: number;
}

interface StudyVariation extends BaseVariation {
    kind: 'study';
    study_id: string;
    game_id?: never;
    branch_move_index?: never;
}

type Variation = GameVariation | StudyVariation;

type NewVariation = Omit<
    BaseVariation,
    'id' | 'created_at' | 'updated_at' | 'practiced_count'
>;

interface ParsedMove {
    san: string; // e.g. "e4"
    from: string; // e.g. "e2"
    to: string; // e.g. "e4"
    fen: string; // FEN after this move
}

type Tab = 'review' | 'trainer' | 'studies';

type AddVariationModalProps =
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

type VariationInsert = {
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

export type {
    AddVariationModalProps,
    BaseVariation,
    ChessGame,
    ChessStudy,
    GameVariation,
    NewVariation,
    ParsedMove,
    SideToMove,
    StudyVariation,
    Tab,
    Variation,
    VariationInsert,
};
