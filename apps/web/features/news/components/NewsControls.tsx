'use client';

import { Search } from 'lucide-react';
import type { EventCategory } from '@/features/news/schemas/eventEnumSchemas';
import type { NewsFeedFilters } from '@/features/news/types/news';
import { cn } from '@/lib/utils/utils';

const categories: Array<EventCategory | 'all'> = [
    'all',
    'technology',
    'markets',
    'business',
    'research',
    'productivity',
    'world',
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
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => onChange({ ...filters, category })}
                        className={cn(
                            'rounded-md px-2.5 py-1.5 text-xs font-semibold capitalize transition',
                            filters.category === category
                                ? 'bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950'
                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800',
                        )}
                    >
                        {category}
                    </button>
                ))}
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_140px]">
                <label className="flex items-center gap-2 border-b border-zinc-300 px-1 py-2 text-sm dark:border-zinc-700">
                    <Search size={16} className="text-zinc-400" />
                    <input
                        value={filters.query}
                        onChange={(event) =>
                            onChange({ ...filters, query: event.target.value })
                        }
                        placeholder="Search events, topics, providers"
                        className="w-full bg-transparent outline-none placeholder:text-zinc-400"
                    />
                </label>
                <select
                    value={filters.source}
                    onChange={(event) =>
                        onChange({ ...filters, source: event.target.value })
                    }
                    className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                    {sources.map((source) => (
                        <option key={source} value={source}>
                            {source}
                        </option>
                    ))}
                </select>
                <select
                    value={filters.time}
                    onChange={(event) =>
                        onChange({
                            ...filters,
                            time: event.target.value as NewsFeedFilters['time'],
                        })
                    }
                    className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                    <option value="latest">Latest</option>
                    <option value="today">Today</option>
                    <option value="week">This week</option>
                </select>
            </div>
        </div>
    );
}
