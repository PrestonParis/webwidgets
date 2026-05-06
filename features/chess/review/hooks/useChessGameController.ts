import { useState, useMemo, useCallback } from 'react';
import { Chess } from 'chess.js';
import type { PieceDropHandlerArgs } from 'react-chessboard';
import {
    parsePgn,
    fenAtIndex,
    buildLastMoveStyles,
    extendPgn,
} from '@/features/chess/lib/chessUtils';
import { ChessGame } from '@/features/chess/types/chess';
import { GameVariation } from '@/features/chess/types/variation';

interface ControllerCallbacks {
    persistMoveIndex: (index: number) => void;
    updateGamePgn: (pgn: string) => Promise<void>;
    createVariationFromMove: (
        branchIndex: number,
        pgn: string,
        startFen: string,
        title: string,
    ) => Promise<GameVariation | null>;
}

export function useChessGameController(
    game: ChessGame | null,
    callbacks: ControllerCallbacks,
) {
    const { persistMoveIndex, updateGamePgn, createVariationFromMove } =
        callbacks;

    const [tab, setTab] = useState<'review' | 'trainer' | 'studies'>('review');
    const [moveIndex, setMoveIndex] = useState(0);
    const [activeVariation, setActiveVariation] =
        useState<GameVariation | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    // Local pgn so we can extend the main line without waiting for a DB round-trip.
    // Lazy-init from game.pgn and use setState-during-render to sync on prop changes.
    const [localPgn, setLocalPgn] = useState(() => game?.pgn ?? '');
    const [prevGamePgn, setPrevGamePgn] = useState(game?.pgn);
    if (game?.pgn !== prevGamePgn) {
        setPrevGamePgn(game?.pgn);
        if (game?.pgn) setLocalPgn(game.pgn);
    }

    const moves = useMemo(() => parsePgn(localPgn), [localPgn]);

    const boardFen = useMemo(
        () => fenAtIndex(moves, moveIndex),
        [moves, moveIndex],
    );

    const squareStyles = useMemo(
        () => buildLastMoveStyles(moves, moveIndex),
        [moves, moveIndex],
    );

    const handleMoveSelect = useCallback(
        (i: number) => {
            setMoveIndex(i);
            persistMoveIndex(i);
        },
        [persistMoveIndex],
    );

    const handleBoardDrop = useCallback(
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

                // Follows the main line?
                const nextMove = moves[moveIndex];
                if (
                    nextMove &&
                    nextMove.from === move.from &&
                    nextMove.to === move.to
                ) {
                    handleMoveSelect(moveIndex + 1);
                    return true;
                }

                // Past the end of the main line → extend game pgn
                if (moveIndex === moves.length) {
                    const newPgn = extendPgn(moves, moveIndex, move.san);
                    if (!newPgn) return false;
                    setLocalPgn(newPgn);
                    const newIndex = moveIndex + 1;
                    setMoveIndex(newIndex);
                    void updateGamePgn(newPgn);
                    void persistMoveIndex(newIndex);
                    return true;
                }

                // Diverging move → auto-create variation from this point
                void createVariationFromMove(
                    moveIndex,
                    move.san,
                    boardFen,
                    move.san,
                );
                return false; // snap piece back; variation appears in sidebar
            } catch {
                return false;
            }
        },
        [
            boardFen,
            moves,
            moveIndex,
            handleMoveSelect,
            updateGamePgn,
            persistMoveIndex,
            createVariationFromMove,
        ],
    );

    return {
        tab,
        setTab,
        moveIndex,
        setMoveIndex,
        activeVariation,
        setActiveVariation,
        showAddModal,
        setShowAddModal,
        moves,
        boardFen,
        squareStyles,
        handleMoveSelect,
        handleBoardDrop,
    };
}
