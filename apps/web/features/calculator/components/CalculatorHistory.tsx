'use client';

import { useState, useMemo } from 'react';
import { Pin, Trash2, Search, Download, X, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { HistoryEntry } from '../types';

interface CalculatorHistoryProps {
    entries: HistoryEntry[];
    onUse: (expression: string, result: string) => void;
    onPin: (id: string) => void;
    onDelete: (id: string) => void;
    onClear: () => void;
    onExport: () => void;
    onAddNote?: (id: string, note: string) => void;
    compact?: boolean;
}

export function CalculatorHistory({
    entries,
    onUse,
    onPin,
    onDelete,
    onClear,
    onExport,
    onAddNote,
    compact = false,
}: CalculatorHistoryProps) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'pinned'>('all');
    const [editNoteId, setEditNoteId] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return entries.filter((e) => {
            if (filter === 'pinned' && !e.pinned) return false;
            if (
                q &&
                !e.expression.toLowerCase().includes(q) &&
                !e.result.toLowerCase().includes(q)
            )
                return false;
            return true;
        });
    }, [entries, search, filter]);

    const pinned = entries.filter((e) => e.pinned);
    const isEmpty = filtered.length === 0;

    return (
        <div className="flex flex-col gap-2">
            {/* Toolbar */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                    <Search size={12} className="text-zinc-400 shrink-0" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search history…"
                        className="flex-1 text-xs bg-transparent outline-none text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
                    />
                    {search && (
                        <button onClick={() => setSearch('')}>
                            <X
                                size={10}
                                className="text-zinc-400 hover:text-zinc-600"
                            />
                        </button>
                    )}
                </div>
                <button
                    onClick={() =>
                        setFilter((f) => (f === 'all' ? 'pinned' : 'all'))
                    }
                    className={cn(
                        'flex items-center justify-center w-7 h-7 rounded-xl transition-colors',
                        filter === 'pinned'
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200',
                    )}
                    title={
                        filter === 'pinned' ? 'Show all' : 'Show pinned only'
                    }
                >
                    <Pin size={12} />
                </button>
                <button
                    onClick={onExport}
                    title="Export history"
                    className="flex items-center justify-center w-7 h-7 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                    <Download size={12} />
                </button>
                {entries.length > 0 && (
                    <button
                        onClick={onClear}
                        title="Clear history"
                        className="flex items-center justify-center w-7 h-7 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={12} />
                    </button>
                )}
            </div>

            {/* Entry count */}
            {!compact && entries.length > 0 && (
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    {filtered.length} of {entries.length} entries
                    {pinned.length > 0 && ` · ${pinned.length} pinned`}
                </p>
            )}

            {/* List */}
            <div
                className={cn(
                    'space-y-1 overflow-y-auto no-scrollbar',
                    compact ? 'max-h-40' : 'max-h-72',
                )}
            >
                {isEmpty ? (
                    <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 py-6">
                        {search
                            ? `No results for "${search}"`
                            : 'No history yet'}
                    </p>
                ) : (
                    filtered.map((entry) => (
                        <div key={entry.id} className="group relative">
                            <button
                                onClick={() =>
                                    onUse(entry.expression, entry.result)
                                }
                                className={cn(
                                    'w-full text-right px-3 py-2 rounded-xl text-xs transition-all',
                                    'bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                                    entry.pinned &&
                                        'border border-amber-200 dark:border-amber-800/50',
                                )}
                            >
                                <div className="font-mono text-zinc-500 dark:text-zinc-400 truncate">
                                    {entry.expression}
                                </div>
                                <div className="font-bold text-sm text-zinc-800 dark:text-zinc-100 tabular-nums">
                                    = {entry.result}
                                </div>
                                {entry.note && (
                                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 text-left mt-0.5 truncate">
                                        📝 {entry.note}
                                    </div>
                                )}
                                <div className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-0.5">
                                    {new Date(
                                        entry.timestamp,
                                    ).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                    {' · '}
                                    {new Date(
                                        entry.timestamp,
                                    ).toLocaleDateString([], {
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </div>
                            </button>

                            {/* Actions */}
                            <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-0.5">
                                <button
                                    onClick={() => onPin(entry.id)}
                                    title={entry.pinned ? 'Unpin' : 'Pin'}
                                    className={cn(
                                        'p-1 rounded-md transition-colors',
                                        entry.pinned
                                            ? 'text-amber-500'
                                            : 'text-zinc-400 hover:text-amber-500',
                                    )}
                                >
                                    <Pin size={10} />
                                </button>
                                {onAddNote && (
                                    <button
                                        onClick={() => {
                                            setEditNoteId(entry.id);
                                            setNoteText(entry.note ?? '');
                                        }}
                                        title="Add note"
                                        className="p-1 rounded-md text-zinc-400 hover:text-blue-500 transition-colors"
                                    >
                                        <StickyNote size={10} />
                                    </button>
                                )}
                                <button
                                    onClick={() => onDelete(entry.id)}
                                    title="Delete"
                                    className="p-1 rounded-md text-zinc-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={10} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Note editor */}
            {editNoteId && onAddNote && (
                <div className="flex gap-2">
                    <input
                        autoFocus
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onAddNote(editNoteId, noteText);
                                setEditNoteId(null);
                            }
                            if (e.key === 'Escape') setEditNoteId(null);
                        }}
                        placeholder="Add a note…"
                        className="flex-1 text-xs px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 outline-none text-zinc-700 dark:text-zinc-300"
                    />
                    <button
                        onClick={() => {
                            onAddNote(editNoteId, noteText);
                            setEditNoteId(null);
                        }}
                        className="px-3 py-1.5 text-xs rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                        Save
                    </button>
                </div>
            )}
        </div>
    );
}
