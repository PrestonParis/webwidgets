'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReadingStructure } from '@/features/reading/types/document';
import type { ReadingPosition } from '@/features/reading/types/positions';
import { formatPosition } from '@/features/reading/lib/positionUtils';

interface ReadingNavigationProps {
    structure: ReadingStructure | null;
    position: ReadingPosition | null;
    onNavigate: (delta: -1 | 1) => void;
    onJump?: (pos: ReadingPosition) => void;
}

function ChapterJumpSelect({
    structure,
    position,
    onJump,
}: {
    structure: ReadingStructure;
    position: ReadingPosition;
    onJump: (pos: ReadingPosition) => void;
}) {
    if (!structure.books || position.type !== 'canonical') return null;
    const activeBook = structure.books.find((b) => b.name === position.book);
    return (
        <div className="flex items-center gap-1">
            <select
                value={position.book}
                onChange={(e) =>
                    onJump({
                        type: 'canonical',
                        book: e.target.value,
                        chapter: 1,
                    })
                }
                className="text-xs bg-transparent border-0 text-zinc-600 dark:text-zinc-400 focus:outline-none cursor-pointer"
                aria-label="Select book"
            >
                {structure.books.map((b) => (
                    <option key={b.id} value={b.name}>
                        {b.name}
                    </option>
                ))}
            </select>
            <select
                value={position.chapter}
                onChange={(e) =>
                    onJump({
                        type: 'canonical',
                        book: position.book,
                        chapter: parseInt(e.target.value, 10),
                    })
                }
                className="text-xs bg-transparent border-0 text-zinc-600 dark:text-zinc-400 focus:outline-none cursor-pointer w-14"
                aria-label="Select chapter"
            >
                {Array.from(
                    { length: activeBook?.totalChapters ?? 1 },
                    (_, i) => i + 1,
                ).map((ch) => (
                    <option key={ch} value={ch}>
                        {ch}
                    </option>
                ))}
            </select>
        </div>
    );
}

export function ReadingNavigation({
    structure,
    position,
    onNavigate,
    onJump,
}: ReadingNavigationProps) {
    const label = position ? formatPosition(position) : 'N/A';

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => onNavigate(-1)}
                className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Previous"
            >
                <ChevronLeft size={16} />
            </button>
            {structure && position && onJump ? (
                <ChapterJumpSelect
                    structure={structure}
                    position={position}
                    onJump={onJump}
                />
            ) : (
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 min-w-16 text-center">
                    {label}
                </span>
            )}
            <button
                onClick={() => onNavigate(1)}
                className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Next"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
}
