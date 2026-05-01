import type { GameVariation } from '@/features/chess/types/chess';

interface Props {
    variation: GameVariation;
    onSelect: (v: GameVariation) => void;
    onDelete: (id: string) => void;
}

export function VariationCard({ variation, onSelect, onDelete }: Props) {
    return (
        <div className="bg-zinc-800 rounded-lg p-3 group">
            <div className="flex justify-between items-start mb-1">
                <button
                    onClick={() => onSelect(variation)}
                    className="text-xs font-medium text-zinc-100 hover:text-blue-400 transition-colors text-left"
                >
                    {variation.title}
                </button>
                <button
                    onClick={() => onDelete(variation.id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs"
                >
                    ✕
                </button>
            </div>

            {variation.annotation && (
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                    {variation.annotation}
                </p>
            )}

            <div className="flex gap-3 mt-2 text-[10px] text-zinc-600">
                <span>Practiced: {variation.practiced_count}×</span>
                {variation.last_practiced && (
                    <span>
                        Last:{' '}
                        {new Date(
                            variation.last_practiced,
                        ).toLocaleDateString()}
                    </span>
                )}
            </div>
        </div>
    );
}
