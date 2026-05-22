import { useState, useMemo, useCallback } from 'react';
import { PieceDropHandlerArgs } from 'react-chessboard';
import {
    parsePgnFromFen,
    isCorrectMove,
} from '@/features/chess/lib/chessUtils';
import type { Variation } from '@/features/chess/types/variation';
import type { TrainerResult } from '@/features/chess/movetrainer/types/movetrainer';

export function useMoveTrainer(variation: Variation) {
    // 1. Parse the moves from the PGN
    const moves = useMemo(
        () => parsePgnFromFen(variation.pgn, variation.start_fen),
        [variation],
    );

    const [index, setIndex] = useState(0);
    const [result, setResult] = useState<TrainerResult | null>(null);
    const [done, setDone] = useState(false);

    // 2. Derive the current FEN
    // If we are at the start (index 0), use the variation's start_fen.
    // Otherwise, use the .fen property from the PREVIOUS move in the array.
    const currentFen = useMemo(() => {
        if (index === 0) return variation.start_fen;
        return moves[index - 1]?.fen || variation.start_fen;
    }, [index, moves, variation.start_fen]);

    // 3. Logic for the hint system (highlighting the 'from' square)
    const squareStyles = useMemo(() => {
        // You can add logic here to highlight the last move or errors
        return {};
    }, []);

    const handleDrop = useCallback(
        ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
            if (done) return false;

            // 1. Guard against null values
            if (!sourceSquare || !targetSquare) return false;

            // 2. TypeScript now knows these are strings
            const correct = isCorrectMove(
                moves,
                index,
                sourceSquare,
                targetSquare,
            );

            if (correct) {
                setResult('correct');
                setTimeout(() => {
                    setResult(null);
                    if (index + 1 >= moves.length) setDone(true);
                    else setIndex((i) => i + 1);
                }, 700);
            } else {
                setResult('incorrect');
                setTimeout(() => setResult(null), 900);
            }
            return correct;
        },
        [done, index, moves],
    );

    // 3. Add helper functions that the UI component expects
    const reset = () => {
        setIndex(0);
        setResult(null);
        setDone(false);
    };

    const showHint = () => {
        setResult('hint');
    };

    return {
        index,
        result,
        done,
        moves,
        fen: currentFen,
        squareStyles,
        handleMove: handleDrop, // Rename for component compatibility
        reset,
        showHint,
    };
}
