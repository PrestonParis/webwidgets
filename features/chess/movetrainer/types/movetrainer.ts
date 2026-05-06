import { ParsedMove, SquareStyles } from '@/features/chess/types/chess';
import { Variation } from '@/features/chess/types/variation';
import { PieceDropHandlerArgs } from 'react-chessboard';

type TrainerResult = 'correct' | 'incorrect' | 'hint';

type MoveTrainerProps = {
    variation: Variation;
    layout?: 'compact' | 'expanded';
    onBack?: (() => void) | undefined;
};

type TrainingBoardProps = {
    fen: string;
    boardOrientation: 'white' | 'black';
    squareStyles: SquareStyles;
    moves: ParsedMove[];
    index: number;
    onPieceDrop: (args: PieceDropHandlerArgs) => boolean;
};

type TrainerControlsProps = {
    variation: Variation;
    result: TrainerResult | null;
    done: boolean;
    index: number;
    moves: ParsedMove[];
    isExpanded: boolean;
    onBack?: (() => void) | undefined;
    showHint: () => void;
    reset: () => void;
};

export type {
    TrainerResult,
    TrainerControlsProps,
    MoveTrainerProps,
    TrainingBoardProps,
};
