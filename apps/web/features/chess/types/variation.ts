type SideToMove = 'white' | 'black';

export interface BaseVariation {
    id: string;
    user_id: string;
    title: string;
    start_fen: string;
    pgn: string;
    annotation: string | null;
    practiced_count: number;
    last_practiced: string | null;
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

export type VariationFormFieldProps = {
    title: string;
    onTitleChange: (v: string) => void;
    pgn: string;
    onPgnChange: (v: string) => void;
    annotation: string;
    onAnnotationChange: (v: string) => void;
    isStudyMode: boolean;
    editableStartFen: string;
    onStartFenChange: (v: string) => void;
};
