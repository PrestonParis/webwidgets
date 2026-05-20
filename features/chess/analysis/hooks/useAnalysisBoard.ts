'use client';

import { useState, useMemo, useCallback } from 'react';
import { Chess } from 'chess.js';
import { PieceDropHandlerArgs } from 'react-chessboard';
import { parsePgn, buildLastMoveStyles } from '@/features/chess/lib/chessUtils';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

type ParsedMove = ReturnType<typeof parsePgn>[number];
type SetMoveIndex = (index: number) => void;

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

function getInitialPgn(isControlled: boolean, storageKey?: string): string {
    if (isControlled || !storageKey || typeof window === 'undefined') return '';
    return localStorage.getItem(`${storageKey}:pgn`) ?? '';
}

function getInitialMoveIndex(
    isControlled: boolean,
    externalPgn?: string,
    storageKey?: string,
): number {
    if (isControlled) return parsePgn(externalPgn ?? '').length;
    if (!storageKey || typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem(`${storageKey}:idx`) ?? '0', 10);
}

function persistPgn(storageKey: string | undefined, newPgn: string): void {
    if (storageKey) localStorage.setItem(`${storageKey}:pgn`, newPgn);
}

function persistMoveIndex(
    storageKey: string | undefined,
    isControlled: boolean,
    index: number,
): void {
    if (storageKey && !isControlled)
        localStorage.setItem(`${storageKey}:idx`, String(index));
}

function clearPersistedBoard(storageKey: string | undefined): void {
    if (!storageKey) return;
    localStorage.removeItem(`${storageKey}:pgn`);
    localStorage.removeItem(`${storageKey}:idx`);
}

function useControlledMoveIndexSync(
    isControlled: boolean,
    externalPgn: string | undefined,
    setMoveIndex: SetMoveIndex,
): void {
    // React 18 "setState during render" pattern: sync moveIndex when external PGN changes.
    const [prevExternalPgn, setPrevExternalPgn] = useState(externalPgn);
    if (isControlled && externalPgn !== prevExternalPgn) {
        setPrevExternalPgn(externalPgn);
        setMoveIndex(parsePgn(externalPgn ?? '').length);
    }
}

export function useAnalysisBoard({
    storageKey,
    pgn: externalPgn,
    onPgnChange,
}: UseAnalysisBoardOptions = {}) {
    const isControlled = externalPgn !== undefined;

    const [internalPgn, setInternalPgn] = useState<string>(() =>
        getInitialPgn(isControlled, storageKey),
    );
    const [moveIndex, setMoveIndex] = useState<number>(() =>
        getInitialMoveIndex(isControlled, externalPgn, storageKey),
    );

    useControlledMoveIndexSync(isControlled, externalPgn, setMoveIndex);
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
                persistPgn(storageKey, newPgn);
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
            persistMoveIndex(storageKey, isControlled, result.newIndex);
            return true;
        },
        [boardFen, moveIndex, moves, setPgn, storageKey, isControlled],
    );

    const goTo = useCallback(
        (index: number) => {
            const clamped = Math.max(0, Math.min(moves.length, index));
            setMoveIndex(clamped);
            persistMoveIndex(storageKey, isControlled, clamped);
        },
        [moves.length, storageKey, isControlled],
    );

    const reset = useCallback(() => {
        setPgn('');
        setMoveIndex(0);
        if (!isControlled) clearPersistedBoard(storageKey);
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
