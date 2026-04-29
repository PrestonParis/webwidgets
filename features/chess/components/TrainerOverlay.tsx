import MoveTrainer from '@/features/chess/components/MoveTrainer';
import type { ChessVariation } from '@/types/chess';

interface TrainerOverlayProps {
    activeVariation: ChessVariation;
    otherVariations: ChessVariation[];
    onBack: () => void;
    onSelect: (v: ChessVariation) => void;
}

export function TrainerOverlay({
    activeVariation,
    otherVariations,
    onBack,
    onSelect,
}: TrainerOverlayProps) {
    return (
        <div className="absolute inset-0 bg-zinc-950 flex">
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-130">
                    <MoveTrainer variation={activeVariation} />
                </div>
            </div>
            <div className="w-72 border-l border-zinc-800 p-4 flex flex-col gap-4 overflow-y-auto">
                <button
                    onClick={onBack}
                    className="text-xs text-zinc-500 hover:text-zinc-300 self-start transition-colors"
                >
                    ← All variations
                </button>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Other Variations
                </h3>
                <div className="space-y-2">
                    {otherVariations.map((v) => (
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
            </div>
        </div>
    );
}
