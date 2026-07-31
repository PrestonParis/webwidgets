'use client';

import { Search } from 'lucide-react';
import type { NewsCategory } from '@/features/news/types/news';
import type { NewsFeedFilters } from '@/features/news/types/news';
import { cn } from '@/lib/utils/utils';

const CATEGORIES: { id: NewsCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'politics', label: 'Politics' },
    { id: 'government', label: 'Government' },
    { id: 'economy', label: 'Economy' },
    { id: 'markets', label: 'Markets' },
    { id: 'technology', label: 'Technology' },
    { id: 'ai', label: 'AI' },
    { id: 'world', label: 'World' },
    { id: 'war', label: 'War & Security' },
    { id: 'culture', label: 'Culture' },
    { id: 'religion', label: 'Religion' },
    { id: 'courts', label: 'Courts' },
    { id: 'local', label: 'Local' },
];

export function NewsControls({
    filters,
    sources,
    onChange,
}: {
    filters: NewsFeedFilters;
    sources: string[];
    onChange: (filters: NewsFeedFilters) => void;
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {CATEGORIES.map(({ id, label }) => (
                    <button
                        key={id}
                        onClick={() =>
                            onChange({
                                ...filters,
                                category: id === 'all' ? 'all' : id,
                            })
                        }
                        className={cn(
                            'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                            filters.category === id
                                ? 'bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950'
                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800',
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex gap-3">
                <label className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
                    <Search size={15} className="shrink-0 text-zinc-400" />
                    <input
                        value={filters.query}
                        onChange={(e) =>
                            onChange({ ...filters, query: e.target.value })
                        }
                        placeholder="Search stories, topics, sources…"
                        className="w-full bg-transparent outline-none placeholder:text-zinc-400"
                    />
                </label>

                {sources.length > 1 && (
                    <select
                        value={filters.source}
                        onChange={(e) =>
                            onChange({ ...filters, source: e.target.value })
                        }
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                    >
                        {sources.map((s) => (
                            <option key={s} value={s}>
                                {s === 'all' ? 'All sources' : s}
                            </option>
                        ))}
                    </select>
                )}

                <select
                    value={filters.time}
                    onChange={(e) =>
                        onChange({
                            ...filters,
                            time: e.target.value as NewsFeedFilters['time'],
                        })
                    }
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                    <option value="latest">Latest</option>
                    <option value="today">Today</option>
                    <option value="week">This week</option>
                </select>
            </div>
        </div>
    );
}
