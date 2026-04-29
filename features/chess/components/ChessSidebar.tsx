import { TrainerSidebar } from '@/features/chess/components/TrainerSidebar';
import { ReviewSidebar } from '@/features/chess/components/ReviewSidebar';
import { StudiesSidebar } from '@/features/chess/components/StudiesSidebar';

export function ChessSidebar(props) {
    const {
        tab,
        variations,
        moveIndex,
        moves,
        onMoveSelect,
        onVariationSelect,
        onAddVariation,
        onDeleteVariation,
        activeVariation,
        setActiveVariation,
        gameId,
    } = props;

    if (tab === 'studies') {
        return <StudiesSidebar gameId={gameId} />;
    }

    if (tab === 'trainer') {
        return (
            <TrainerSidebar
                variations={variations}
                activeVariation={activeVariation}
                onSelect={onVariationSelect}
                onBack={() => setActiveVariation(null)}
            />
        );
    }

    return (
        <ReviewSidebar
            variations={variations}
            moveIndex={moveIndex}
            moves={moves} // ✅ FIX
            onMoveSelect={onMoveSelect}
            onSelectVariation={onVariationSelect}
            onAdd={onAddVariation}
            onDelete={onDeleteVariation}
        />
    );
}
