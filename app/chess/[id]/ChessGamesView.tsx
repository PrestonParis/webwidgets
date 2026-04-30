'use client';

import { useParams, useRouter } from 'next/navigation';
import { useChessGame } from '@/features/chess/hooks/useChessGame';
import { useKeyboardNav } from '@/features/chess/hooks/useKeyboardNav';
import { GameHeader } from '@/features/chess/components/GameHeader';
import { BoardView } from '@/features/chess/components/BoardView';
import { TrainerOverlay } from '@/features/chess/components/TrainerOverlay';
import { AddVariationModal } from '@/features/chess/components/AddVariationModal';
import LoadingState from '@/components/global/LoadingState';
import { NoGame } from '@/features/chess/components/NoGame';
import { useChessGameController } from '@/features/chess/hooks/useChessGameController';
import { ChessSidebar } from '@/features/chess/components/ChessSidebar';
import { GameVariation } from '@/types/chess';

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

    const controller = useChessGameController(game, persistMoveIndex);

    useKeyboardNav({
        tab: controller.tab,
        movesLength: controller.moves.length,
        onPrev: () => controller.setMoveIndex((i) => Math.max(0, i - 1)),
        onNext: () =>
            controller.setMoveIndex((i) =>
                Math.min(controller.moves.length, i + 1),
            ),
        onStart: () => controller.setMoveIndex(0),
        onEnd: () => controller.setMoveIndex(controller.moves.length),
    });

    if (loading) return <LoadingState />;
    if (!game) return <NoGame />;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            <GameHeader
                game={game}
                tab={controller.tab}
                onBack={() => router.push('/chess')}
                onTabChange={controller.setTab}
            />

            <div className="flex h-[calc(100vh-73px)]">
                <BoardView
                    white={game.white}
                    black={game.black}
                    boardFen={controller.boardFen}
                    squareStyles={controller.squareStyles}
                    moveIndex={controller.moveIndex}
                    movesLength={controller.moves.length}
                    showControls={controller.tab === 'review'}
                    activeVariation={
                        controller.tab === 'trainer'
                            ? controller.activeVariation
                            : null
                    }
                    onMoveSelect={controller.handleMoveSelect}
                />

                <ChessSidebar
                    tab={controller.tab}
                    moves={controller.moves}
                    variations={variations}
                    moveIndex={controller.moveIndex}
                    onMoveSelect={controller.handleMoveSelect}
                    onVariationSelect={(v: GameVariation) => {
                        controller.setActiveVariation(v);
                        controller.setTab('trainer');
                    }}
                    onAddVariation={() => controller.setShowAddModal(true)}
                    onDeleteVariation={deleteVariation}
                    activeVariation={controller.activeVariation}
                    setActiveVariation={controller.setActiveVariation}
                    gameId={id}
                />
            </div>

            {controller.tab === 'trainer' && controller.activeVariation && (
                <TrainerOverlay
                    activeVariation={controller.activeVariation}
                    otherVariations={variations.filter(
                        (v) => v.id !== controller.activeVariation?.id,
                    )}
                    onBack={() => controller.setActiveVariation(null)}
                    onSelect={(v) => controller.setActiveVariation(v)}
                />
            )}

            {controller.showAddModal && (
                <AddVariationModal
                    gameId={id}
                    branchIndex={controller.moveIndex}
                    startFen={controller.boardFen}
                    onClose={() => controller.setShowAddModal(false)}
                    onSaved={addVariation}
                />
            )}
        </div>
    );
}
