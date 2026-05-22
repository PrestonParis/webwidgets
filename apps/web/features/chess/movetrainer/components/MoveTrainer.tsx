'use client';

import { useMemo } from 'react';
import { useMoveTrainer } from '@/features/chess/movetrainer/hooks/useMoveTrainer';
import { MoveTrainerProps } from '@/features/chess/movetrainer/types/movetrainer';
import { TrainerBoard } from './TrainerBoard';
import { TrainerControls } from './TrainerControls';

export default function MoveTrainer({
    variation,
    layout = 'compact',
    onBack,
}: MoveTrainerProps) {
    const {
        moves,
        index,
        result,
        done,
        fen,
        squareStyles,
        handleMove,
        reset,
        showHint,
    } = useMoveTrainer(variation);

    const hintStyles = useMemo(() => {
        if (result !== 'hint' || !moves[index]) return {};
        return {
            [moves[index].from]: { backgroundColor: 'rgba(59, 130, 246, 0.5)' },
        };
    }, [result, index, moves]);

    const isExpanded = layout === 'expanded';

    return (
        <div
            className={`flex ${isExpanded ? 'flex-col lg:flex-row gap-8' : 'flex-col gap-4'} items-start`}
        >
            <TrainerBoard
                fen={fen}
                boardOrientation={
                    variation.side_to_move === 'black' ? 'black' : 'white'
                }
                squareStyles={{ ...squareStyles, ...hintStyles }}
                moves={moves}
                index={index}
                onPieceDrop={handleMove}
            />
            <TrainerControls
                variation={variation}
                result={result}
                done={done}
                index={index}
                moves={moves}
                isExpanded={isExpanded}
                onBack={onBack}
                showHint={showHint}
                reset={reset}
            />
        </div>
    );
}
