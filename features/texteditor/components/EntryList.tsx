'use client';

import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { JournalEntry } from '@/features/journal/types/journal';

interface EntryListProps {
    entries: JournalEntry[];
    activeId: number | null;
    onSelect: (entry: JournalEntry) => void;
    onNew: () => void;
    noteType: 'document' | 'journal';
    view: 'all' | 'trash';
    onViewChange: (v: 'all' | 'trash') => void;
}

function EntryButton({
    entry,
    active,
    noteType,
    onSelect,
}: {
    entry: JournalEntry;
    active: boolean;
    noteType: 'document' | 'journal';
    onSelect: (entry: JournalEntry) => void;
}) {
    return (
        <button
            key={entry.id}
            onClick={() => onSelect(entry)}
            className={cn(
                'w-full text-left px-3 py-2.5 mx-0 transition-colors group',
                active
                    ? 'bg-stone-100 dark:bg-zinc-800'
                    : 'hover:bg-stone-50 dark:hover:bg-zinc-800/40',
            )}
        >
            <p className="text-[12px] font-medium text-stone-800 dark:text-zinc-200 truncate leading-tight">
                {entry.title || 'Untitled'}
            </p>
            <p className="text-[10px] text-stone-400 dark:text-zinc-600 mt-0.5">
                {new Date(entry.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                })}
                {noteType === 'journal' && (
                    <span className="ml-1.5 opacity-70">
                        {entry.content.replace(/<[^>]+>/g, '').slice(0, 30)}…
                    </span>
                )}
            </p>
        </button>
    );
}

export function EntryList({
    entries,
    activeId,
    onSelect,
    onNew,
    noteType,
    view,
    onViewChange,
}: EntryListProps) {
    const [search, setSearch] = useState('');

    const filtered = entries.filter((e) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            e.title.toLowerCase().includes(q) ||
            e.content
                .replace(/<[^>]+>/g, '')
                .toLowerCase()
                .includes(q)
        );
    });

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Search */}
            <div className="px-3 py-2">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-zinc-800">
                    <Search
                        size={12}
                        className="text-stone-400 dark:text-zinc-500 shrink-0"
                    />
                    <input
                        type="text"
                        placeholder="Search…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 text-xs bg-transparent outline-none text-stone-700 dark:text-zinc-300 placeholder:text-stone-400 dark:placeholder:text-zinc-600"
                    />
                </div>
            </div>

            {/* View tabs */}
            <div className="flex px-3 gap-3 pb-1 border-b border-stone-100 dark:border-zinc-800/60">
                {(['all', 'trash'] as const).map((v) => (
                    <button
                        key={v}
                        onClick={() => onViewChange(v)}
                        className={cn(
                            'text-[11px] font-medium pb-1.5 capitalize transition-colors border-b',
                            view === v
                                ? 'text-stone-800 dark:text-zinc-100 border-stone-800 dark:border-zinc-100'
                                : 'text-stone-400 dark:text-zinc-600 border-transparent hover:text-stone-600 dark:hover:text-zinc-400',
                        )}
                    >
                        {v === 'all' ? 'All' : 'Trash'}
                    </button>
                ))}
            </div>

            {/* Entry list */}
            <div className="flex-1 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-stone-400 dark:text-zinc-600">
                        {search
                            ? 'No results'
                            : `No ${noteType === 'journal' ? 'entries' : 'documents'} yet`}
                    </p>
                ) : (
                    filtered.map((entry) => (
                        <EntryButton
                            key={entry.id}
                            entry={entry}
                            active={activeId === entry.id}
                            noteType={noteType}
                            onSelect={onSelect}
                        />
                    ))
                )}
            </div>

            {/* New button */}
            {view === 'all' && (
                <div className="p-3 border-t border-stone-100 dark:border-zinc-800/60">
                    <button
                        onClick={onNew}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-stone-500 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-800 dark:hover:text-zinc-200 transition-all"
                    >
                        <Plus size={12} />
                        New {noteType === 'journal' ? 'Entry' : 'Document'}
                    </button>
                </div>
            )}
        </div>
    );
}
