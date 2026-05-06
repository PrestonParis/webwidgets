'use client';

import { useParams, useRouter } from 'next/navigation';
import { useChessGame } from '@/features/chess/review/hooks/useChessGame';
import { useKeyboardNav } from '@/features/chess/review/hooks/useKeyboardNav';
import { GameHeader } from '@/features/chess/review/components/GameHeader';
import { BoardView } from '@/features/chess/review/components/BoardView';
import { TrainerOverlay } from '@/features/chess/review/components/TrainerOverlay';
import { AddVariationModal } from '@/features/chess/components/AddVariationModal';
import LoadingState from '@/features/ui/components/LoadingState';
import { NoGame } from '@/features/chess/review/components/NoGame';
import { useChessGameController } from '@/features/chess/review/hooks/useChessGameController';
import { ChessSidebar } from '@/features/chess/review/components/ChessSidebar';
import { ChessGame } from '@/features/chess/types/chess';
import { GameVariation } from '@/features/chess/types/variation';

type Controller = ReturnType<typeof useChessGameController>;

function ChessPageBody({
    game,
    id,
    controller,
    variations,
    updateVariationAnnotation,
    onBack,
    onTitleChange,
    onDeleteVariation,
    onAddVariation,
}: {
    game: ChessGame;
    id: string;
    controller: Controller;
    variations: GameVariation[];
    updateVariationAnnotation: (
        id: string,
        annotation: string,
    ) => Promise<void>;
    onBack: () => void;
    onTitleChange: (t: string) => void;
    onDeleteVariation: (id: string) => void;
    onAddVariation: (v: GameVariation) => void;
}) {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            <GameHeader
                game={game}
                tab={controller.tab}
                onBack={onBack}
                onTabChange={controller.setTab}
                onTitleChange={onTitleChange}
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
                    onPieceDrop={
                        controller.tab === 'review'
                            ? controller.handleBoardDrop
                            : undefined
                    }
                />
                <ChessSidebar
                    tab={controller.tab}
                    moves={controller.moves}
                    variations={variations}
                    moveIndex={controller.moveIndex}
                    onMoveSelect={controller.handleMoveSelect}
                    onVariationSelect={(v) => {
                        controller.setActiveVariation(v);
                        controller.setTab('trainer');
                    }}
                    onAddVariation={() => controller.setShowAddModal(true)}
                    onDeleteVariation={(vid) => {
                        void onDeleteVariation(vid);
                    }}
                    onUpdateAnnotation={(varId, ann) => {
                        void updateVariationAnnotation(varId, ann);
                    }}
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
                    onSaved={onAddVariation}
                />
            )}
        </div>
    );
}

export default function ChessGamePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const {
        game,
        variations,
        loading,
        persistMoveIndex,
        updateGamePgn,
        updateGameTitle,
        deleteVariation,
        addVariation,
        createVariationFromMove,
        updateVariationAnnotation,
    } = useChessGame(id);

    const controller = useChessGameController(game, {
        persistMoveIndex: (index) => {
            void persistMoveIndex(index);
        },
        updateGamePgn,
        createVariationFromMove,
    });

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
        <ChessPageBody
            game={game}
            id={id}
            controller={controller}
            variations={variations}
            updateVariationAnnotation={updateVariationAnnotation}
            onBack={() => router.push('/chess')}
            onTitleChange={(title) => {
                void updateGameTitle(title);
            }}
            onDeleteVariation={(vid) => {
                void deleteVariation(vid);
            }}
            onAddVariation={addVariation}
        />
    );
}
