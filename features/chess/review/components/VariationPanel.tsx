import type { GameVariation } from '@/features/chess/types/chess';
import { VariationCard } from './VariationCard';

export function VariationPanel({
    variations,
    currentMoveIndex,
    onSelect,
    onAdd,
    onDelete,
}: {
    variations: GameVariation[];
    currentMoveIndex: number;
    onSelect: (v: GameVariation) => void;
    onAdd: () => void;
    onDelete: (id: string) => void;
}) {
    const relevant = variations.filter(
        (v) => v.branch_move_index === currentMoveIndex,
    );
    const others = variations.filter(
        (v) => v.branch_move_index !== currentMoveIndex,
    );

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Variations
                </h3>
                <button
                    onClick={onAdd}
                    className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                >
                    + Add here
                </button>
            </div>

            {relevant.length === 0 && (
                <p className="text-xs text-zinc-600 italic">
                    No variations at move {currentMoveIndex}.
                </p>
            )}

            <div className="space-y-2">
                {relevant.map((v) => (
                    <VariationCard
                        key={v.id}
                        variation={v}
                        onSelect={onSelect}
                        onDelete={onDelete}
                    />
                ))}
            </div>

            {others.length > 0 && (
                <details className="text-xs text-zinc-600">
                    <summary className="cursor-pointer hover:text-zinc-400">
                        {others.length} other variation
                        {others.length !== 1 ? 's' : ''} in this game
                    </summary>
                    <div className="mt-2 space-y-1 pl-2 border-l border-zinc-800">
                        {others.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => onSelect(v)}
                                className="block text-left hover:text-zinc-300 transition-colors"
                            >
                                Move {v.branch_move_index}: {v.title}
                            </button>
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
}
