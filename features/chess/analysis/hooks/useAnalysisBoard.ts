'use client';

import { useState, useMemo, useCallback } from 'react';
import { Chess } from 'chess.js';
import { PieceDropHandlerArgs } from 'react-chessboard';
import { parsePgn, buildLastMoveStyles } from '@/features/chess/lib/chessUtils';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

interface UseAnalysisBoardOptions {
    storageKey?: string | undefined;
    pgn?: string | undefined;
    onPgnChange?: ((pgn: string) => void) | undefined;
}

export function useAnalysisBoard({
    storageKey,
    pgn: externalPgn,
    onPgnChange,
}: UseAnalysisBoardOptions = {}) {
    const isControlled = externalPgn !== undefined;

    // Lazy-initialize from localStorage so no setState-in-effect is needed.
    const [internalPgn, setInternalPgn] = useState(() => {
        if (isControlled || !storageKey || typeof window === 'undefined')
            return '';
        return localStorage.getItem(`${storageKey}:pgn`) ?? '';
    });

    const [moveIndex, setMoveIndex] = useState(() => {
        if (isControlled) return parsePgn(externalPgn ?? '').length;
        if (!storageKey || typeof window === 'undefined') return 0;
        return parseInt(localStorage.getItem(`${storageKey}:idx`) ?? '0', 10);
    });

    // React 18 "setState during render" pattern: reset moveIndex when the external PGN
    // changes. React discards the current render and immediately re-renders with new state.
    const [prevExternalPgn, setPrevExternalPgn] = useState(externalPgn);
    if (isControlled && externalPgn !== prevExternalPgn) {
        setPrevExternalPgn(externalPgn);
        setMoveIndex(parsePgn(externalPgn ?? '').length);
    }

    const pgn = isControlled ? (externalPgn ?? '') : internalPgn;

    const moves = useMemo(() => parsePgn(pgn), [pgn]);

    const boardFen = useMemo(() => {
        if (moveIndex === 0 || moves.length === 0) return STARTING_FEN;
        return (
            moves[Math.min(moveIndex, moves.length) - 1]?.fen ?? STARTING_FEN
        );
    }, [moves, moveIndex]);

    const squareStyles = useMemo(
        () => buildLastMoveStyles(moves, moveIndex),
        [moves, moveIndex],
    );

    const setPgn = useCallback(
        (newPgn: string) => {
            if (isControlled) {
                onPgnChange?.(newPgn);
            } else {
                setInternalPgn(newPgn);
                if (storageKey) {
                    localStorage.setItem(`${storageKey}:pgn`, newPgn);
                }
            }
        },
        [isControlled, onPgnChange, storageKey],
    );

    const handlePieceDrop = useCallback(
        ({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
            if (!sourceSquare || !targetSquare) return false;
            try {
                const chess = new Chess(boardFen);
                const move = chess.move({
                    from: sourceSquare,
                    to: targetSquare,
                    promotion: 'q',
                });
                if (!move) return false;

                const builder = new Chess();
                for (let i = 0; i < moveIndex && i < moves.length; i++) {
                    const move = moves[i];
                    if (move) builder.move(move.san);
                }
                builder.move(move.san);

                const newPgn = builder.pgn();
                const newIndex = moveIndex + 1;
                setPgn(newPgn);
                setMoveIndex(newIndex);
                if (storageKey && !isControlled) {
                    localStorage.setItem(`${storageKey}:idx`, String(newIndex));
                }
                return true;
            } catch {
                return false;
            }
        },
        [boardFen, moveIndex, moves, setPgn, storageKey, isControlled],
    );

    const goTo = useCallback(
        (index: number) => {
            const clamped = Math.max(0, Math.min(moves.length, index));
            setMoveIndex(clamped);
            if (storageKey && !isControlled) {
                localStorage.setItem(`${storageKey}:idx`, String(clamped));
            }
        },
        [moves.length, storageKey, isControlled],
    );

    const reset = useCallback(() => {
        setPgn('');
        setMoveIndex(0);
        if (storageKey && !isControlled) {
            localStorage.removeItem(`${storageKey}:pgn`);
            localStorage.removeItem(`${storageKey}:idx`);
        }
    }, [setPgn, storageKey, isControlled]);

    return {
        pgn,
        moves,
        moveIndex,
        boardFen,
        squareStyles,
        handlePieceDrop,
        goTo,
        reset,
    };
}
