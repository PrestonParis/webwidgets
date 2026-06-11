'use client';
import { useEffect, useState } from 'react';

interface Memory {
    id: string;
    date: string;
    title: string;
    snippet: string;
    yearsAgo: number;
}

export function OnThisDayPanel() {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/knowledge/on-this-day')
            .then((r) => r.json())
            .then(({ memories: m }: { memories: Memory[] }) =>
                setMemories(m ?? []),
            )
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading)
        return (
            <div className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
        );

    if (memories.length === 0)
        return (
            <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 p-4 text-center">
                <p className="text-xs text-zinc-500">
                    No memories for this day yet.
                </p>
                <p className="text-[10px] text-zinc-400 mt-1">
                    Journal entries from today in past years will appear here.
                </p>
            </div>
        );

    return (
        <div className="space-y-2">
            {memories.map((m) => (
                <div
                    key={m.id}
                    className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3"
                >
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {m.title}
                        </p>
                        <span className="text-[10px] text-zinc-400">
                            {m.yearsAgo} year{m.yearsAgo !== 1 ? 's' : ''} ago
                        </span>
                    </div>
                    {m.snippet && (
                        <p className="text-[11px] text-zinc-500 line-clamp-2">
                            {m.snippet}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}
