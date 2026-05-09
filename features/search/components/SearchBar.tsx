'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, Sparkles, Bot, Folder } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { WIDGET_CATALOG } from '../lib/widgetCatalog';

function widgetEmoji(type: string): string {
    return WIDGET_CATALOG.find((w) => w.type === type)?.emoji ?? '🧩';
}

function widgetName(type: string): string {
    return WIDGET_CATALOG.find((w) => w.type === type)?.name ?? type;
}

function widgetHref(type: string): string {
    return WIDGET_CATALOG.find((w) => w.type === type)?.href ?? '/';
}

export default function SearchBar() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [taskQuery, setTaskQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        widgetMatches,
        folderMatches,
        nlpSuggestions,
        suggestAi,
        nlpLoading,
    } = useSearch(query, taskQuery);

    const hasResults =
        widgetMatches.length > 0 ||
        folderMatches.length > 0 ||
        nlpSuggestions.length > 0 ||
        suggestAi;

    const showDropdown =
        open && (query.trim() || taskQuery.trim()) && hasResults;

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div ref={containerRef} className="relative w-full max-w-2xl">
            <div className="flex items-center gap-2">
                {/* Widget/folder search input */}
                <div className="flex w-44 lg:w-52 shrink-0 items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-colors">
                    <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        placeholder="Widgets"
                        className="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none min-w-0"
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                    />
                </div>

                {/* Task descriptor field */}
                <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-colors">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <input
                        type="text"
                        value={taskQuery}
                        placeholder="What are you trying to do?"
                        className="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none min-w-0"
                        onChange={(e) => {
                            setTaskQuery(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                    />
                    {nlpLoading && (
                        <span className="text-[10px] text-zinc-400 shrink-0 animate-pulse">
                            thinking…
                        </span>
                    )}
                </div>
            </div>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute top-full mt-2 left-0 right-0 z-50 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
                    {/* Widget keyword matches */}
                    {widgetMatches.length > 0 && (
                        <section>
                            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                Widgets
                            </p>
                            {widgetMatches.map((w) => (
                                <Link
                                    key={w.type}
                                    href={w.href}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <span className="text-base leading-none">
                                        {w.emoji}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                                            {w.name}
                                        </p>
                                        <p className="text-xs text-zinc-400 truncate">
                                            {w.description}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </section>
                    )}

                    {/* Folder matches */}
                    {folderMatches.length > 0 && (
                        <section>
                            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                Folders
                            </p>
                            {folderMatches.map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setOpen(false)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                                >
                                    <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                                        {f.name}
                                    </p>
                                </button>
                            ))}
                        </section>
                    )}

                    {/* NLP suggestions */}
                    {nlpSuggestions.length > 0 && (
                        <section>
                            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                Suggested for you
                            </p>
                            {nlpSuggestions.map((s) => (
                                <Link
                                    key={s.widget}
                                    href={widgetHref(s.widget)}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <span className="text-base leading-none">
                                        {widgetEmoji(s.widget)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                                            {widgetName(s.widget)}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-zinc-400 shrink-0">
                                        {Math.round(s.confidence * 100)}% match
                                    </span>
                                </Link>
                            ))}
                        </section>
                    )}

                    {/* AI chat fallback */}
                    {suggestAi && (
                        <section className="border-t border-zinc-100 dark:border-zinc-800">
                            <Link
                                href="https://claude.ai"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-3 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                            >
                                <Bot className="w-4 h-4 text-violet-500 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                                        Chat with AI
                                    </p>
                                    <p className="text-xs text-zinc-400 truncate">
                                        No widget matches — let AI help you
                                        solve this
                                    </p>
                                </div>
                            </Link>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
