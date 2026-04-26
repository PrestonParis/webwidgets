'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    parsePgn,
    fenAtIndex,
    buildLastMoveStyles,
} from '@/app/lib/utils/chess';
import type { ChessVariation, Tab } from '@/types/chess';
import { useChessGame } from '@/hooks/chess/useChessGame';
import { useKeyboardNav } from '@/hooks/chess/useKeyboardNav';
import { GameHeader } from '@/components/Chess/GameHeader';
import { BoardView } from '@/components/Chess/BoardView';
import { TrainerOverlay } from '@/components/Chess/TrainerOverlay';
import MoveList from '@/components/Chess/MoveList';
import { VariationPanel } from '@/components/Chess/VariationPanel';
import { StudiesSidebar } from '@/components/Chess/StudiesSidebar';
import { AddVariationModal } from '@/components/Chess/AddVariationModal';
import LoadingState from '@/components/Global/LoadingState';

export default function ChessGamePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const {
        game,
        variations,
        loading,
        persistMoveIndex,
        deleteVariation,
        addVariation,
    } = useChessGame(id);

    const [tab, setTab] = useState<Tab>('review');
    const [moveIndex, setMoveIndex] = useState(0);
    const [activeVariation, setActiveVariation] =
        useState<ChessVariation | null>(null);
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

    useKeyboardNav({
        tab,
        movesLength: moves.length,
        onPrev: () => setMoveIndex((i) => Math.max(0, i - 1)),
        onNext: () => setMoveIndex((i) => Math.min(moves.length, i + 1)),
        onStart: () => setMoveIndex(0),
        onEnd: () => setMoveIndex(moves.length),
    });

    const handleVariationSelect = (v: ChessVariation) => {
        setActiveVariation(v);
        setTab('trainer');
    };

    if (loading) return <LoadingState />;

    if (!game) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-400 gap-4">
                <p>Game not found.</p>
                <button
                    onClick={() => router.push('/chess')}
                    className="text-blue-500 hover:underline text-sm"
                >
                    ← Back to library
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            <GameHeader
                game={game}
                tab={tab}
                onBack={() => router.push('/chess')}
                onTabChange={setTab}
            />

            <div className="flex gap-0 h-[calc(100vh-73px)]">
                {/* Board column */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <BoardView
                        white={game.white}
                        black={game.black}
                        boardFen={boardFen}
                        squareStyles={squareStyles}
                        moveIndex={moveIndex}
                        movesLength={moves.length}
                        showControls={tab === 'review'}
                        activeVariation={
                            tab === 'trainer' ? activeVariation : null
                        }
                        onMoveSelect={handleMoveSelect}
                    />
                </div>

                {/* Sidebar */}
                <div className="w-72 border-l border-zinc-800 flex flex-col">
                    {tab === 'review' && (
                        <div className="flex flex-col h-full p-4 gap-4">
                            <MoveList
                                moves={moves}
                                currentIndex={moveIndex}
                                onSelect={handleMoveSelect}
                            />
                            <div className="border-t border-zinc-800 pt-4">
                                <VariationPanel
                                    variations={variations}
                                    currentMoveIndex={moveIndex}
                                    onSelect={handleVariationSelect}
                                    onAdd={() => setShowAddModal(true)}
                                    onDelete={deleteVariation}
                                />
                            </div>
                        </div>
                    )}

                    {tab === 'trainer' && (
                        <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
                            {activeVariation ? (
                                <button
                                    onClick={() => setActiveVariation(null)}
                                    className="text-xs text-zinc-500 hover:text-zinc-300 self-start transition-colors"
                                >
                                    ← All variations
                                </button>
                            ) : (
                                <>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                        Choose a Variation to Train
                                    </h3>
                                    {variations.length === 0 ? (
                                        <p className="text-xs text-zinc-600 italic">
                                            No variations yet. Add some in the
                                            Review tab.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {variations.map((v) => (
                                                <button
                                                    key={v.id}
                                                    onClick={() =>
                                                        handleVariationSelect(v)
                                                    }
                                                    className="w-full text-left bg-zinc-800 hover:bg-zinc-700 rounded-lg p-3 transition-colors"
                                                >
                                                    <div className="text-sm font-medium text-zinc-100">
                                                        {v.title}
                                                    </div>
                                                    <div className="text-xs text-zinc-500 mt-0.5">
                                                        From move{' '}
                                                        {v.branch_move_index} ·{' '}
                                                        {v.practiced_count}×
                                                        practiced
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {tab === 'studies' && <StudiesSidebar gameId={id} />}
                </div>
            </div>

            {tab === 'trainer' && activeVariation && (
                <TrainerOverlay
                    activeVariation={activeVariation}
                    otherVariations={variations.filter(
                        (v) => v.id !== activeVariation.id,
                    )}
                    onBack={() => setActiveVariation(null)}
                    onSelect={handleVariationSelect}
                />
            )}

            {showAddModal && (
                <AddVariationModal
                    gameId={id}
                    branchIndex={moveIndex}
                    startFen={boardFen}
                    onClose={() => setShowAddModal(false)}
                    onSaved={addVariation}
                />
            )}
        </div>
    );
}
