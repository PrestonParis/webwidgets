import { useEffect, useRef } from 'react';
import type { ParsedMove } from '@/features/chess/types/chess';

// ─── Move List ────────────────────────────────────────────────────────────────
export default function MoveList({
    moves,
    currentIndex,
    onSelect,
}: {
    moves: ParsedMove[];
    currentIndex: number;
    onSelect: (i: number) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

    // Scroll active move into view
    useEffect(() => {
        const el = ref.current?.querySelector('[data-active="true"]');
        el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [currentIndex]);

    const pairs: [ParsedMove, ParsedMove | null][] = [];
    for (let i = 0; i < moves.length; i += 2) {
        pairs.push([moves[i], moves[i + 1] ?? null]);
    }

    return (
        <div
            ref={ref}
            className="overflow-y-auto flex-1 pr-1 text-sm font-mono"
        >
            {pairs.map(([white, black], pairIdx) => {
                const wi = pairIdx * 2 + 1; // 1-based index for white
                const bi = pairIdx * 2 + 2; // 1-based index for black
                return (
                    <div
                        key={pairIdx}
                        className="flex gap-1 items-baseline py-0.5"
                    >
                        <span className="text-zinc-500 w-8 shrink-0 text-right select-none">
                            {pairIdx + 1}.
                        </span>
                        <button
                            data-active={currentIndex === wi}
                            onClick={() => onSelect(wi)}
                            className={`px-2 py-0.5 rounded transition-colors ${
                                currentIndex === wi
                                    ? 'bg-blue-600 text-white'
                                    : 'text-zinc-200 hover:bg-zinc-700'
                            }`}
                        >
                            {white.san}
                        </button>
                        {black && (
                            <button
                                data-active={currentIndex === bi}
                                onClick={() => onSelect(bi)}
                                className={`px-2 py-0.5 rounded transition-colors ${
                                    currentIndex === bi
                                        ? 'bg-blue-600 text-white'
                                        : 'text-zinc-200 hover:bg-zinc-700'
                                }`}
                            >
                                {black.san}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
