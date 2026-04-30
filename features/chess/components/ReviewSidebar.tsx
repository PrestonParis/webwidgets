'use client';

import MoveList from '@/features/chess/components/MoveList';
import { VariationPanel } from '@/features/chess/components/VariationPanel';
import type { GameVariation, ParsedMove } from '@/types/chess';

export function ReviewSidebar({
    variations,
    moveIndex,
    moves,
    onMoveSelect,
    onSelectVariation,
    onAdd,
    onDelete,
}: {
    variations: GameVariation[];
    moveIndex: number;
    moves: ParsedMove[];
    onMoveSelect: (i: number) => void;
    onSelectVariation: (v: GameVariation) => void;
    onAdd: () => void;
    onDelete: (id: string) => void;
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
                />
            </div>
        </div>
    );
}
