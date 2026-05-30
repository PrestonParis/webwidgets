'use client';

import Link from 'next/link';
import type { RefObject } from 'react';
import { Search, Sparkles, Bot, Folder } from 'lucide-react';
import { useSearchBarState } from '../hooks/useSearchBarState';
import { useCommandPalette } from '../store/useCommandPalette';
import { WIDGET_CATALOG, type WidgetEntry } from '../lib/widgetCatalog';
import type { NlpSuggestion } from '../hooks/useSearch';
import type { FolderEntry } from '../store/useFolderRegistry';
import { cn } from '@/lib/utils/utils';
import { getWidgetCategory } from '@/features/dashboard/lib/addWidgetConstants';
import type { WidgetSynthesisCandidate } from '@/features/widgets/synthesis/widgetBuilderInterfaces';

function widgetEmoji(type: string): string {
    return WIDGET_CATALOG.find((w) => w.type === type)?.emoji ?? '🧩';
}

function widgetName(type: string): string {
    return WIDGET_CATALOG.find((w) => w.type === type)?.name ?? type;
}

function widgetHref(type: string): string {
    return WIDGET_CATALOG.find((w) => w.type === type)?.href ?? '/';
}

interface SearchInputsProps {
    inputRef: RefObject<HTMLInputElement | null>;
    taskInputRef: RefObject<HTMLInputElement | null>;
    nlpLoading: boolean;
    query: string;
    taskQuery: string;
    onOpen: () => void;
    onOpenPalette: () => void;
    onQueryChange: (value: string) => void;
    onTaskQueryChange: (value: string) => void;
}

function SearchInputs({
    inputRef,
    taskInputRef,
    nlpLoading,
    query,
    taskQuery,
    onOpen,
    onOpenPalette,
    onQueryChange,
    onTaskQueryChange,
}: SearchInputsProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex w-44 lg:w-52 shrink-0 items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-colors">
                <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    placeholder="Widgets"
                    className="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none min-w-0"
                    onChange={(e) => onQueryChange(e.target.value)}
                    onFocus={onOpen}
                />
                <button
                    type="button"
                    onClick={onOpenPalette}
                    className="hidden lg:flex items-center gap-0.5 text-[10px] text-zinc-400 bg-zinc-200 dark:bg-zinc-700 rounded px-1 py-0.5 shrink-0 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                    title="Open command palette"
                >
                    <span>⌘K</span>
                </button>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-colors">
                <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <input
                    ref={taskInputRef}
                    type="text"
                    value={taskQuery}
                    placeholder="What are you trying to do?"
                    className="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none min-w-0"
                    onChange={(e) => onTaskQueryChange(e.target.value)}
                    onFocus={onOpen}
                />
                {nlpLoading && (
                    <span className="text-[10px] text-zinc-400 shrink-0 animate-pulse">
                        thinking…
                    </span>
                )}
                <span className="hidden lg:flex items-center gap-0.5 text-[10px] text-zinc-400 bg-zinc-200 dark:bg-zinc-700 rounded px-1 py-0.5 shrink-0">
                    ⌘1
                </span>
            </div>
        </div>
    );
}

function WidgetMatches({
    widgets,
    onSelect,
}: {
    widgets: WidgetEntry[];
    onSelect: () => void;
}) {
    if (widgets.length === 0) return null;
    return (
        <section>
            <SectionTitle>Widgets</SectionTitle>
            {widgets.map((w) => {
                const category = getWidgetCategory(w.type);
                return (
                    <Link
                        key={w.type}
                        href={w.href}
                        onClick={onSelect}
                        className="flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <span className="text-base leading-none">
                            {w.emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                                    {w.name}
                                </p>
                                {category && (
                                    <span
                                        className={cn(
                                            'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                                            category.color.chip,
                                        )}
                                    >
                                        {category.label}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-zinc-400 truncate">
                                {w.description}
                            </p>
                        </div>
                    </Link>
                );
            })}
        </section>
    );
}

function FolderMatches({
    folders,
    onSelect,
}: {
    folders: FolderEntry[];
    onSelect: () => void;
}) {
    if (folders.length === 0) return null;
    return (
        <section>
            <SectionTitle>Folders</SectionTitle>
            {folders.map((f) => (
                <button
                    key={f.id}
                    onClick={onSelect}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                    <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {f.name}
                    </p>
                </button>
            ))}
        </section>
    );
}

function NlpMatches({
    suggestions,
    onSelect,
}: {
    suggestions: NlpSuggestion[];
    onSelect: () => void;
}) {
    if (suggestions.length === 0) return null;
    return (
        <section>
            <SectionTitle>Suggested for you</SectionTitle>
            {suggestions.map((s) => (
                <NlpMatchRow
                    key={s.widget}
                    suggestion={s}
                    onSelect={onSelect}
                />
            ))}
        </section>
    );
}

function NlpMatchRow({
    suggestion,
    onSelect,
}: {
    suggestion: NlpSuggestion;
    onSelect: () => void;
}) {
    const category = getWidgetCategory(suggestion.widget);
    return (
        <Link
            href={widgetHref(suggestion.widget)}
            onClick={onSelect}
            className="flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
            <span className="text-base leading-none">
                {widgetEmoji(suggestion.widget)}
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {widgetName(suggestion.widget)}
                    </p>
                    {category && (
                        <span
                            className={cn(
                                'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                                category.color.chip,
                            )}
                        >
                            {category.label}
                        </span>
                    )}
                </div>
            </div>
            <span className="text-[10px] text-zinc-400 shrink-0">
                {Math.round(suggestion.confidence * 100)}% match
            </span>
        </Link>
    );
}

function SynthesizedMatches({
    candidates,
    onSelect,
}: {
    candidates: WidgetSynthesisCandidate[];
    onSelect: () => void;
}) {
    if (candidates.length === 0) return null;
    return (
        <section>
            <SectionTitle>Generate a widget</SectionTitle>
            {candidates.map((candidate) => (
                <Link
                    key={candidate.id}
                    href={`/widgets/create?intent=${encodeURIComponent(candidate.definitionDraft.metadata.intentQuery ?? candidate.title)}`}
                    onClick={onSelect}
                    className="flex items-start gap-2.5 px-3 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                >
                    <span className="text-base leading-none mt-0.5">
                        {candidate.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                                {candidate.title}
                            </p>
                            <span
                                className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                                    candidate.buildableNow
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                }`}
                            >
                                {candidate.buildableNow ? 'buildable' : 'setup'}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-400 truncate">
                            {candidate.description}
                        </p>
                    </div>
                    <span className="text-[10px] text-zinc-400 shrink-0">
                        {Math.round(candidate.confidence * 100)}%
                    </span>
                </Link>
            ))}
        </section>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            {children}
        </p>
    );
}

function AiFallback({
    show,
    onSelect,
}: {
    show: boolean;
    onSelect: () => void;
}) {
    if (!show) return null;
    return (
        <section className="border-t border-zinc-100 dark:border-zinc-800">
            <Link
                href="/chat"
                onClick={onSelect}
                className="flex items-center gap-2.5 px-3 py-3 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
            >
                <Bot className="w-4 h-4 text-violet-500 shrink-0" />
                <div className="min-w-0">
                    <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                        Chat with AI
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                        No widget matches. Open AI Chat in WebWidgets
                    </p>
                </div>
            </Link>
        </section>
    );
}

export default function SearchBar() {
    const {
        containerRef,
        inputRef,
        taskInputRef,
        query,
        results,
        setOpen,
        setQuery,
        setTaskQuery,
        showDropdown,
        taskQuery,
    } = useSearchBarState();
    const { openPalette } = useCommandPalette();
    const close = () => setOpen(false);
    const open = () => setOpen(true);

    return (
        <div ref={containerRef} className="relative w-full max-w-2xl">
            <SearchInputs
                inputRef={inputRef}
                taskInputRef={taskInputRef}
                nlpLoading={results.nlpLoading}
                query={query}
                taskQuery={taskQuery}
                onOpen={open}
                onOpenPalette={openPalette}
                onQueryChange={(value) => {
                    setQuery(value);
                    open();
                }}
                onTaskQueryChange={(value) => {
                    setTaskQuery(value);
                    open();
                }}
            />

            {showDropdown && (
                <div className="absolute top-full mt-2 left-0 right-0 z-50 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
                    <WidgetMatches
                        widgets={results.widgetMatches}
                        onSelect={close}
                    />
                    <FolderMatches
                        folders={results.folderMatches}
                        onSelect={close}
                    />
                    <NlpMatches
                        suggestions={results.nlpSuggestions}
                        onSelect={close}
                    />
                    <SynthesizedMatches
                        candidates={results.synthesizedWidgets}
                        onSelect={close}
                    />
                    <AiFallback show={results.suggestAi} onSelect={close} />
                </div>
            )}
        </div>
    );
}
