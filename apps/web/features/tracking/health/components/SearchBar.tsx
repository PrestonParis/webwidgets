'use client';

import { useMemo, useState } from 'react';
import { searchRegions } from '@/features/tracking/health/lib/bodyRegions';

type AnatomyView =
    | 'surface'
    | 'muscle'
    | 'bone'
    | 'nerve'
    | 'tendon'
    | 'tooth'
    | 'general';

interface SearchBarProps {
    activeView: AnatomyView;
    onSelect: (regionId: string) => void;
}

export function SearchBar({ activeView, onSelect }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const results = useMemo(
        () =>
            query.trim().length >= 1
                ? searchRegions(query)
                      .filter((region) =>
                          activeView === 'general'
                              ? true
                              : region.supportedTissueTypes.includes(
                                    activeView,
                                ),
                      )
                      .slice(0, 8)
                : [],
        [activeView, query],
    );

    return (
        <div className="relative mb-2">
            <input
                type="search"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder="Search body region…"
                className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-400"
            />
            {open && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
                    {results.map((r) => (
                        <button
                            key={r.id}
                            type="button"
                            onMouseDown={() => {
                                onSelect(r.id);
                                setQuery('');
                                setOpen(false);
                            }}
                            className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300"
                        >
                            {r.displayName}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
