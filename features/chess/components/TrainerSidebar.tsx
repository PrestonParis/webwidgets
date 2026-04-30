'use client';

import type { GameVariation } from '@/types/chess';

export function TrainerSidebar({
    variations,
    activeVariation,
    onSelect,
    onBack,
}: {
    variations: GameVariation[];
    activeVariation: GameVariation | null;
    onSelect: (v: GameVariation) => void;
    onBack: () => void;
}) {
    return (
        <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
            {activeVariation ? (
                <button
                    onClick={onBack}
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
                            No variations yet. Add some in the Review tab.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {variations.map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => onSelect(v)}
                                    className="w-full text-left bg-zinc-800 hover:bg-zinc-700 rounded-lg p-3 transition-colors"
                                >
                                    <div className="text-sm font-medium text-zinc-100">
                                        {v.title}
                                    </div>
                                    <div className="text-xs text-zinc-500 mt-0.5">
                                        From move {v.branch_move_index} ·{' '}
                                        {v.practiced_count}× practiced
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
