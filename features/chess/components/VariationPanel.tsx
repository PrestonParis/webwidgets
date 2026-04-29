import type { ChessVariation } from '@/types/chess';

// ─── Variation Panel ──────────────────────────────────────────────────────────
export function VariationPanel({
    variations,
    currentMoveIndex,
    onSelect,
    onAdd,
    onDelete,
}: {
    variations: ChessVariation[];
    currentMoveIndex: number;
    onSelect: (v: ChessVariation) => void;
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
                    <div
                        key={v.id}
                        className="bg-zinc-800 rounded-lg p-3 group"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <button
                                onClick={() => onSelect(v)}
                                className="text-xs font-medium text-zinc-100 hover:text-blue-400 transition-colors text-left"
                            >
                                {v.title}
                            </button>
                            <button
                                onClick={() => onDelete(v.id)}
                                className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs"
                            >
                                ✕
                            </button>
                        </div>
                        {v.annotation && (
                            <p className="text-[11px] text-zinc-500 leading-relaxed">
                                {v.annotation}
                            </p>
                        )}
                        <div className="flex gap-3 mt-2 text-[10px] text-zinc-600">
                            <span>Practiced: {v.practiced_count}×</span>
                            {v.last_practiced && (
                                <span>
                                    Last:{' '}
                                    {new Date(
                                        v.last_practiced,
                                    ).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
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
