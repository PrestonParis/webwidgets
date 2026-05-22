'use client';

import {
    useEffect,
    useRef,
    useState,
    useCallback,
    type KeyboardEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Sparkles,
    ArrowRight,
    LayoutDashboard,
    Bot,
    Folder,
    Zap,
    Plus,
} from 'lucide-react';
import { useCommandPalette } from '../store/useCommandPalette';
import { useSearch } from '../hooks/useSearch';
import { WIDGET_CATALOG, type WidgetEntry } from '../lib/widgetCatalog';
import {
    useFolderRegistry,
    type FolderEntry,
} from '../store/useFolderRegistry';
import type { NlpSuggestion } from '../hooks/useSearch';

interface QuickAction {
    id: string;
    label: string;
    description?: string;
    icon: React.ElementType;
    href: string;
    shortcut?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
    { id: 'dashboard', label: 'Dashboard', description: 'Go to your board', icon: LayoutDashboard, href: '/', shortcut: 'G D' },
    { id: 'finance', label: 'Finance', description: 'Net worth, accounts, watchlist', icon: () => <span>💰</span>, href: '/finance' },
    { id: 'tracking', label: 'Health Tracking', description: 'Sleep, meals, workouts', icon: () => <span>📊</span>, href: '/tracking' },
    { id: 'chat', label: 'AI Chat', description: 'Chat with Claude, GPT-4o, Gemini', icon: () => <span>💬</span>, href: '/chat' },
    { id: 'files', label: 'Files', description: 'Uploads and Google Drive', icon: () => <span>📁</span>, href: '/files' },
    { id: 'calendar', label: 'Calendar', description: 'Google Calendar events', icon: () => <span>📅</span>, href: '/calendar' },
    { id: 'reading', label: 'Reading', description: 'Bible, PDFs, ebooks', icon: () => <span>📖</span>, href: '/reading' },
    { id: 'chess', label: 'Chess', description: 'Play and study chess', icon: () => <span>♟️</span>, href: '/chess' },
    { id: 'settings', label: 'Settings', description: 'Profile, integrations, plan', icon: () => <span>⚙️</span>, href: '/settings' },
    { id: 'add-widget', label: 'Add Widget', description: 'Browse and add to dashboard', icon: Plus, href: '/?addWidget=true' },
    { id: 'widget-builder', label: 'Widget Builder', description: 'Create a custom widget', icon: () => <span>🔧</span>, href: '/widgets/create' },
];

function filterQuickActions(query: string): QuickAction[] {
    if (!query.trim()) return QUICK_ACTIONS.slice(0, 6);
    const q = query.toLowerCase();
    return QUICK_ACTIONS.filter(
        (a) =>
            a.label.toLowerCase().includes(q) ||
            (a.description?.toLowerCase().includes(q) ?? false),
    );
}

type ResultItem =
    | { kind: 'action'; data: QuickAction }
    | { kind: 'widget'; data: WidgetEntry }
    | { kind: 'folder'; data: FolderEntry }
    | { kind: 'nlp'; data: NlpSuggestion };

function buildFlatList(
    actions: QuickAction[],
    widgets: WidgetEntry[],
    folders: FolderEntry[],
    nlp: NlpSuggestion[],
): ResultItem[] {
    return [
        ...actions.map((a): ResultItem => ({ kind: 'action', data: a })),
        ...widgets.map((w): ResultItem => ({ kind: 'widget', data: w })),
        ...folders.map((f): ResultItem => ({ kind: 'folder', data: f })),
        ...nlp.map((n): ResultItem => ({ kind: 'nlp', data: n })),
    ];
}

function widgetByType(type: string) {
    return WIDGET_CATALOG.find((w) => w.type === type);
}

export function CommandPalette() {
    const router = useRouter();
    const { open, closePalette } = useCommandPalette();
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const [query, setQuery] = useState('');
    const [taskQuery, setTaskQuery] = useState('');
    const [activeIdx, setActiveIdx] = useState(0);

    const results = useSearch(query, taskQuery);
    const folders = useFolderRegistry((s) => s.folders);

    const filteredActions = filterQuickActions(query || taskQuery);
    const flatList = buildFlatList(
        filteredActions,
        results.widgetMatches.slice(0, 5),
        results.folderMatches.slice(0, 3),
        results.nlpSuggestions.slice(0, 3),
    );

    function getHref(item: ResultItem): string {
        if (item.kind === 'action') return item.data.href;
        if (item.kind === 'widget') return item.data.href;
        if (item.kind === 'folder') return '/';
        const widget = widgetByType(item.data.widget);
        return widget?.href ?? '/';
    }

    const navigate = useCallback(
        (item: ResultItem) => {
            router.push(getHref(item));
            closePalette();
        },
        [router, closePalette],
    );

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, flatList.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            const item = flatList[activeIdx];
            if (item) navigate(item);
        } else if (e.key === 'Escape') {
            closePalette();
        }
    }

    useEffect(() => {
        if (!open) {
            setQuery('');
            setTaskQuery('');
            setActiveIdx(0);
            return;
        }
        setTimeout(() => inputRef.current?.focus(), 50);
    }, [open]);

    useEffect(() => {
        setActiveIdx(0);
    }, [query, taskQuery]);

    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [activeIdx]);

    if (!open) return null;

    const hasQuery = query.trim() || taskQuery.trim();

    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                aria-hidden
                onClick={closePalette}
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
                className="relative z-10 w-full max-w-xl rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-2xl overflow-hidden flex flex-col"
                style={{ maxHeight: '70vh' }}
            >
                {/* Input row */}
                <div className="flex items-center border-b border-gray-100 dark:border-zinc-800 px-4">
                    <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        placeholder="Search widgets, pages, actions…"
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none px-3 py-3.5"
                    />
                    <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5 shrink-0">
                        ESC
                    </kbd>
                </div>

                {/* AI task input */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <input
                        type="text"
                        value={taskQuery}
                        placeholder="What are you trying to do? (AI will suggest)"
                        onChange={(e) => setTaskQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent text-xs text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none"
                    />
                    {results.nlpLoading && (
                        <span className="text-[10px] text-violet-400 animate-pulse shrink-0">
                            thinking…
                        </span>
                    )}
                </div>

                {/* Results */}
                <div ref={listRef} className="overflow-y-auto flex-1 pb-2">
                    {/* Quick Actions */}
                    {filteredActions.length > 0 && (
                        <section>
                            <SectionLabel>
                                {hasQuery ? 'Actions & Pages' : 'Quick Access'}
                            </SectionLabel>
                            {filteredActions.map((action, localIdx) => {
                                const globalIdx = localIdx;
                                const Icon = action.icon as React.ComponentType<{ className?: string }>;
                                return (
                                    <ResultRow
                                        key={action.id}
                                        idx={globalIdx}
                                        active={activeIdx === globalIdx}
                                        onHover={() => setActiveIdx(globalIdx)}
                                        onClick={() => navigate({ kind: 'action', data: action })}
                                    >
                                        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                            <Icon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                                                {action.label}
                                            </span>
                                            {action.description && (
                                                <span className="ml-2 text-xs text-zinc-400">
                                                    {action.description}
                                                </span>
                                            )}
                                        </div>
                                        {action.shortcut && (
                                            <kbd className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5 shrink-0">
                                                {action.shortcut}
                                            </kbd>
                                        )}
                                        <ArrowRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600 shrink-0" />
                                    </ResultRow>
                                );
                            })}
                        </section>
                    )}

                    {/* Widget matches */}
                    {results.widgetMatches.length > 0 && (
                        <section>
                            <SectionLabel>Widgets</SectionLabel>
                            {results.widgetMatches.slice(0, 5).map((w, localIdx) => {
                                const globalIdx = filteredActions.length + localIdx;
                                return (
                                    <ResultRow
                                        key={w.type}
                                        idx={globalIdx}
                                        active={activeIdx === globalIdx}
                                        onHover={() => setActiveIdx(globalIdx)}
                                        onClick={() => navigate({ kind: 'widget', data: w })}
                                    >
                                        <span className="text-lg leading-none w-7 text-center shrink-0">{w.emoji}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                                                {w.name}
                                            </p>
                                            <p className="text-xs text-zinc-400 truncate">
                                                {w.description}
                                            </p>
                                        </div>
                                        <ArrowRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600 shrink-0" />
                                    </ResultRow>
                                );
                            })}
                        </section>
                    )}

                    {/* Folder matches */}
                    {results.folderMatches.length > 0 && (
                        <section>
                            <SectionLabel>Folders</SectionLabel>
                            {results.folderMatches.slice(0, 3).map((f, localIdx) => {
                                const globalIdx =
                                    filteredActions.length +
                                    Math.min(results.widgetMatches.length, 5) +
                                    localIdx;
                                return (
                                    <ResultRow
                                        key={f.id}
                                        idx={globalIdx}
                                        active={activeIdx === globalIdx}
                                        onHover={() => setActiveIdx(globalIdx)}
                                        onClick={() => navigate({ kind: 'folder', data: f })}
                                    >
                                        <Folder className="w-4 h-4 text-amber-500 shrink-0 ml-1.5" />
                                        <p className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">
                                            {f.name}
                                        </p>
                                    </ResultRow>
                                );
                            })}
                        </section>
                    )}

                    {/* NLP / AI suggestions */}
                    {results.nlpSuggestions.length > 0 && (
                        <section>
                            <SectionLabel>
                                <Zap className="inline w-3 h-3 mb-0.5 mr-1 text-violet-400" />
                                AI Suggestions
                            </SectionLabel>
                            {results.nlpSuggestions.slice(0, 3).map((s, localIdx) => {
                                const globalIdx =
                                    filteredActions.length +
                                    Math.min(results.widgetMatches.length, 5) +
                                    Math.min(results.folderMatches.length, 3) +
                                    localIdx;
                                const widget = widgetByType(s.widget);
                                return (
                                    <ResultRow
                                        key={s.widget}
                                        idx={globalIdx}
                                        active={activeIdx === globalIdx}
                                        onHover={() => setActiveIdx(globalIdx)}
                                        onClick={() => navigate({ kind: 'nlp', data: s })}
                                    >
                                        <span className="text-lg leading-none w-7 text-center shrink-0">
                                            {widget?.emoji ?? '🧩'}
                                        </span>
                                        <p className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">
                                            {widget?.name ?? s.widget}
                                        </p>
                                        <span className="text-[10px] text-zinc-400 shrink-0">
                                            {Math.round(s.confidence * 100)}% match
                                        </span>
                                    </ResultRow>
                                );
                            })}
                        </section>
                    )}

                    {/* AI Fallback */}
                    {results.suggestAi && (
                        <section className="border-t border-zinc-100 dark:border-zinc-800 mt-1">
                            <ResultRow
                                idx={flatList.length}
                                active={activeIdx === flatList.length}
                                onHover={() => setActiveIdx(flatList.length)}
                                onClick={() => {
                                    router.push('/chat');
                                    closePalette();
                                }}
                            >
                                <Bot className="w-4 h-4 text-violet-500 shrink-0 ml-1" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                                        Chat with AI
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                        No matches — let AI help
                                    </p>
                                </div>
                            </ResultRow>
                        </section>
                    )}

                    {!hasQuery && flatList.length === 0 && (
                        <div className="px-4 py-8 text-center text-sm text-zinc-400">
                            Start typing to search…
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <kbd className="bg-zinc-200 dark:bg-zinc-700 rounded px-1 py-0.5">↑↓</kbd> navigate
                    </span>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <kbd className="bg-zinc-200 dark:bg-zinc-700 rounded px-1 py-0.5">↵</kbd> open
                    </span>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <kbd className="bg-zinc-200 dark:bg-zinc-700 rounded px-1 py-0.5">ESC</kbd> close
                    </span>
                </div>
            </div>
        </div>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center">
            {children}
        </p>
    );
}

interface ResultRowProps {
    idx: number;
    active: boolean;
    onHover: () => void;
    onClick: () => void;
    children: React.ReactNode;
}

function ResultRow({ idx, active, onHover, onClick, children }: ResultRowProps) {
    return (
        <button
            data-idx={idx}
            type="button"
            className={`w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors ${
                active
                    ? 'bg-zinc-100 dark:bg-zinc-800'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
            }`}
            onMouseEnter={onHover}
            onClick={onClick}
        >
            {children}
        </button>
    );
}
