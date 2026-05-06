import type { StudyVariationCardProps } from '@/features/chess/studies/types/studies';

export function StudyVariationCard({
    variation,
    onTrain,
    onDelete,
}: StudyVariationCardProps) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 group hover:border-zinc-700 transition-all">
            <div className="flex justify-between items-start">
                <h3 className="font-medium text-zinc-100">{variation.title}</h3>
                <button
                    onClick={() => onDelete(variation.id)}
                    className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs ml-2"
                >
                    ✕
                </button>
            </div>

            {variation.annotation && (
                <p className="text-xs text-zinc-500 leading-relaxed flex-1 italic">
                    &quot;{variation.annotation}&quot;
                </p>
            )}

            <div className="text-[10px] text-zinc-600 font-mono truncate bg-black/30 p-1.5 rounded">
                {variation.pgn.slice(0, 60)}
                {variation.pgn.length > 60 ? '...' : ''}
            </div>

            <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                    {variation.practiced_count}× practiced
                </span>
                <button
                    onClick={() => onTrain(variation)}
                    className="text-sm px-4 py-1.5 bg-zinc-800 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                    Train →
                </button>
            </div>
        </div>
    );
}
