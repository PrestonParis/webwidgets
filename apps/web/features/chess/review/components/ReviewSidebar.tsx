'use client';

import MoveList from '@/features/chess/review/components/MoveList';
import { VariationPanel } from '@/features/chess/review/components/VariationPanel';
import type { ParsedMove } from '@/features/chess/types/chess';
import type { GameVariation } from '@/features/chess/types/variation';

export function ReviewSidebar({
    variations,
    moveIndex,
    moves,
    onMoveSelect,
    onSelectVariation,
    onAdd,
    onDelete,
    onUpdateAnnotation,
}: {
    variations: GameVariation[];
    moveIndex: number;
    moves: ParsedMove[];
    onMoveSelect: (i: number) => void;
    onSelectVariation: (v: GameVariation) => void;
    onAdd: () => void;
    onDelete: (id: string) => void;
    onUpdateAnnotation?: ((id: string, annotation: string) => void) | undefined;
}) {
    return (
        <div className="flex flex-col h-full p-4 gap-4">
            <MoveList
                moves={moves}
                currentIndex={moveIndex}
                onSelect={onMoveSelect}
            />

            <div className="border-t border-zinc-800 pt-4">
                <VariationPanel
                    variations={variations}
                    currentMoveIndex={moveIndex}
                    onSelect={onSelectVariation}
                    onAdd={onAdd}
                    onDelete={onDelete}
                    onUpdateAnnotation={onUpdateAnnotation}
                />
            </div>
        </div>
    );
}
