import { useState, useMemo } from 'react';
import {
    parsePgn,
    fenAtIndex,
    buildLastMoveStyles,
} from '@/features/chess/lib/chessUtils';
import { ChessGame, GameVariation } from '@/types/chess';

export function useChessGameController(
    game: ChessGame | null,
    persistMoveIndex: (index: number) => void,
) {
    const [tab, setTab] = useState<'review' | 'trainer' | 'studies'>('review');
    const [moveIndex, setMoveIndex] = useState(0);
    const [activeVariation, setActiveVariation] =
        useState<GameVariation | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const moves = useMemo(() => (game?.pgn ? parsePgn(game.pgn) : []), [game]);

    const boardFen = useMemo(
        () => fenAtIndex(moves, moveIndex),
        [moves, moveIndex],
    );

    const squareStyles = useMemo(
        () => buildLastMoveStyles(moves, moveIndex),
        [moves, moveIndex],
    );

    const handleMoveSelect = (i: number) => {
        setMoveIndex(i);
        persistMoveIndex(i);
    };

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
    };
}
