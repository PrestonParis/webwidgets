'use client';

import type { ReadingVersion } from '@/features/reading/types/document';

interface ReadingVersionSelectorProps {
    versions: ReadingVersion[];
    activeVersionId: string | undefined;
    onSelect: (id: string) => void;
}

export function ReadingVersionSelector({
    versions,
    activeVersionId,
    onSelect,
}: ReadingVersionSelectorProps) {
    if (versions.length === 0) return null;
    return (
        <select
            value={activeVersionId ?? ''}
            onChange={(e) => onSelect(e.target.value)}
            className="text-xs font-medium bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg px-2 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#4f6ef7] cursor-pointer"
            aria-label="Select version or translation"
        >
            {versions.map((v) => (
                <option key={v.id} value={v.id}>
                    {v.abbreviation}: {v.name}
                </option>
            ))}
        </select>
    );
}
