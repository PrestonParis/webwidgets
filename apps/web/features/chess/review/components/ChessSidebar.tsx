import { TrainerSidebar } from '@/features/chess/review/components/TrainerSidebar';
import { ReviewSidebar } from '@/features/chess/review/components/ReviewSidebar';
import StudiesSidebar from '@/features/chess/studies/components/StudiesSidebar';
import { TrainerSidebarProps } from '@/features/chess/review/types/review';

export function ChessSidebar(props: TrainerSidebarProps) {
    const {
        tab,
        variations,
        moveIndex,
        moves,
        onMoveSelect,
        onVariationSelect,
        onAddVariation,
        onDeleteVariation,
        onUpdateAnnotation,
        activeVariation,
        setActiveVariation,
    } = props;

    if (tab === 'studies') {
        return <StudiesSidebar />;
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
            moves={moves}
            onMoveSelect={onMoveSelect}
            onSelectVariation={onVariationSelect}
            onAdd={onAddVariation}
            onDelete={onDeleteVariation}
            onUpdateAnnotation={onUpdateAnnotation}
        />
    );
}
