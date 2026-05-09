'use client';

import { useState, useMemo, useCallback } from 'react';
import { Chess } from 'chess.js';
import { PieceDropHandlerArgs } from 'react-chessboard';
import { parsePgn, buildLastMoveStyles } from '@/features/chess/lib/chessUtils';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

type ParsedMove = ReturnType<typeof parsePgn>[number];

interface UseAnalysisBoardOptions {
    storageKey?: string | undefined;
    pgn?: string | undefined;
    onPgnChange?: ((pgn: string) => void) | undefined;
}

function applyDrop(
    boardFen: string,
    moveIndex: number,
    moves: ParsedMove[],
    sourceSquare: string,
    targetSquare: string,
): { pgn: string; newIndex: number } | null {
    try {
        const chess = new Chess(boardFen);
        const move = chess.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q',
        });
        if (!move) return null;
        const builder = new Chess();
        for (let i = 0; i < moveIndex && i < moves.length; i++) {
            const m = moves[i];
            if (m) builder.move(m.san);
        }
        builder.move(move.san);
        return { pgn: builder.pgn(), newIndex: moveIndex + 1 };
    } catch {
        return null;
    }
}

export function useAnalysisBoard({
    storageKey,
    pgn: externalPgn,
    onPgnChange,
}: UseAnalysisBoardOptions = {}) {
    const isControlled = externalPgn !== undefined;

    const [internalPgn, setInternalPgn] = useState<string>(() =>
        !isControlled && storageKey && typeof window !== 'undefined'
            ? (localStorage.getItem(`${storageKey}:pgn`) ?? '')
            : '',
    );
    const [moveIndex, setMoveIndex] = useState<number>(() =>
        isControlled
            ? parsePgn(externalPgn ?? '').length
            : storageKey && typeof window !== 'undefined'
              ? parseInt(localStorage.getItem(`${storageKey}:idx`) ?? '0', 10)
              : 0,
    );

    // React 18 "setState during render" pattern: sync moveIndex when external PGN changes.
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
                if (storageKey)
                    localStorage.setItem(`${storageKey}:pgn`, newPgn);
            }
        },
        [isControlled, onPgnChange, storageKey],
    );

    const handlePieceDrop = useCallback(
        ({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
            if (!sourceSquare || !targetSquare) return false;
            const result = applyDrop(
                boardFen,
                moveIndex,
                moves,
                sourceSquare,
                targetSquare,
            );
            if (!result) return false;
            setPgn(result.pgn);
            setMoveIndex(result.newIndex);
            if (storageKey && !isControlled)
                localStorage.setItem(
                    `${storageKey}:idx`,
                    String(result.newIndex),
                );
            return true;
        },
        [boardFen, moveIndex, moves, setPgn, storageKey, isControlled],
    );

    const goTo = useCallback(
        (index: number) => {
            const clamped = Math.max(0, Math.min(moves.length, index));
            setMoveIndex(clamped);
            if (storageKey && !isControlled)
                localStorage.setItem(`${storageKey}:idx`, String(clamped));
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
