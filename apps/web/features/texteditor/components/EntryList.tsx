'use client';

import { useState } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import {
    getEntryDisplayDate,
    parseTextEditorDisplayDate,
} from '@/features/texteditor/lib/entryMetadata';
import type { JournalEntry } from '@/features/journal/types/journal';

interface EntryListProps {
    entries: JournalEntry[];
    activeId: number | null;
    onSelect: (entry: JournalEntry) => void;
    onNew: () => void;
    noteType?: 'document' | 'journal' | 'note';
    onDelete?: (id: number) => void;
    view: 'all' | 'trash';
    onViewChange: (v: 'all' | 'trash') => void;
}

const TYPE_LABELS: Record<string, string> = {
    journal: 'J',
    document: 'D',
    note: 'N',
};

const NEW_LABELS: Record<NonNullable<EntryListProps['noteType']>, string> = {
    document: 'Document',
    journal: 'Entry',
    note: 'Note',
};

function EntryButton({
    entry,
    active,
    showTypeBadge,
    onSelect,
    onDelete,
}: {
    entry: JournalEntry;
    active: boolean;
    showTypeBadge: boolean;
    onSelect: (entry: JournalEntry) => void;
    onDelete?: (id: number) => void;
}) {
    return (
        <div
            className={cn(
                'group flex items-start gap-1 transition-colors',
                active
                    ? 'bg-stone-100 dark:bg-zinc-800'
                    : 'hover:bg-stone-50 dark:hover:bg-zinc-800/40',
            )}
        >
            <button
                onClick={() => onSelect(entry)}
                className="flex-1 min-w-0 text-left px-3 py-2.5"
            >
                <div className="flex items-center gap-1.5">
                    {showTypeBadge && (
                        <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1 py-0.5 rounded bg-stone-200 dark:bg-zinc-700 text-stone-500 dark:text-zinc-400">
                            {TYPE_LABELS[entry.type] ?? entry.type}
                        </span>
                    )}
                    <p className="text-[12px] font-medium text-stone-800 dark:text-zinc-200 truncate leading-tight">
                        {entry.title || 'Untitled'}
                    </p>
                </div>
                <p className="text-[10px] text-stone-400 dark:text-zinc-600 mt-0.5">
                    {parseTextEditorDisplayDate(
                        getEntryDisplayDate(entry),
                    ).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                    })}
                    {entry.type === 'journal' && (
                        <span className="ml-1.5 opacity-70">
                            {entry.content.replace(/<[^>]+>/g, '').slice(0, 30)}
                            …
                        </span>
                    )}
                </p>
            </button>
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(entry.id);
                    }}
                    title="Delete"
                    className="shrink-0 mt-2.5 mr-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-stone-300 dark:text-zinc-600 hover:text-red-400 dark:hover:text-red-400"
                >
                    <Trash2 size={11} />
                </button>
            )}
        </div>
    );
}

export function EntryList({
    entries,
    activeId,
    onSelect,
    onNew,
    noteType,
    onDelete,
    view,
    onViewChange,
}: EntryListProps) {
    const [search, setSearch] = useState('');
    const showTypeBadge = noteType === undefined;

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
                        {search ? 'No results' : 'Nothing here yet'}
                    </p>
                ) : (
                    filtered.map((entry) => (
                        <EntryButton
                            key={entry.id}
                            entry={entry}
                            active={activeId === entry.id}
                            showTypeBadge={showTypeBadge}
                            onSelect={onSelect}
                            {...(view === 'all' && onDelete
                                ? { onDelete }
                                : {})}
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
                        New {noteType ? NEW_LABELS[noteType] : 'Note'}
                    </button>
                </div>
            )}
        </div>
    );
}
