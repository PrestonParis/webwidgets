'use client';

import { RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type {
    ContextPayload,
    ContextSource,
    ContextSourceStatus,
} from '../types/contextPayload';

const STATUS_DOT: Record<ContextSourceStatus, string> = {
    available: 'bg-emerald-500',
    empty: 'bg-amber-400',
    unavailable: 'bg-rose-500',
    not_configured: 'bg-zinc-400',
    permission_denied: 'bg-rose-400',
    loading: 'bg-zinc-300 animate-pulse',
};

const STATUS_LABEL: Record<ContextSourceStatus, string> = {
    available: 'Available',
    empty: 'Empty',
    unavailable: 'Unavailable',
    not_configured: 'Not configured',
    permission_denied: 'Permission denied',
    loading: 'Loading…',
};

function SourceRow({ source }: { source: ContextSource }) {
    return (
        <div className="flex items-start gap-2.5 py-1.5">
            <span
                className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    STATUS_DOT[source.status],
                )}
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {source.displayName}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                        {STATUS_LABEL[source.status]}
                    </span>
                    {source.itemCount > 0 && (
                        <span className="text-[10px] text-zinc-400">
                            · {source.itemCount} items
                        </span>
                    )}
                </div>
                {source.error && (
                    <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-500">
                        {source.error}
                    </p>
                )}
            </div>
        </div>
    );
}

interface ContextStatusPanelProps {
    context: ContextPayload | null;
    loading: boolean;
    error: string | null;
    onRefresh: () => void;
    compact?: boolean;
}

export function ContextStatusPanel({
    context,
    loading,
    error,
    onRefresh,
    compact = false,
}: ContextStatusPanelProps) {
    if (compact) {
        if (loading)
            return (
                <span className="text-[10px] text-zinc-400">
                    Loading context…
                </span>
            );
        if (error)
            return <span className="text-[10px] text-rose-500">{error}</span>;
        if (!context) return null;
        return (
            <span
                className={cn(
                    'text-[10px] font-medium',
                    context.availableSources > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-500',
                )}
            >
                {context.availableSources > 0
                    ? `${context.availableSources} context source${context.availableSources !== 1 ? 's' : ''}`
                    : 'No context available'}
            </span>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Context Sources
                </span>
                <button
                    onClick={onRefresh}
                    disabled={loading}
                    className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    title="Refresh context"
                >
                    <RefreshCcw
                        size={12}
                        className={cn(
                            'text-zinc-400',
                            loading && 'animate-spin',
                        )}
                    />
                </button>
            </div>

            <div className="px-3 py-1 divide-y divide-zinc-50 dark:divide-zinc-800/60">
                {loading && (
                    <div className="py-3 text-xs text-zinc-400">
                        Collecting context…
                    </div>
                )}
                {!loading && error && (
                    <div className="py-3 text-xs text-rose-500">{error}</div>
                )}
                {!loading &&
                    !error &&
                    context &&
                    context.sources.map((source) => (
                        <SourceRow key={source.id} source={source} />
                    ))}
            </div>

            {context && context.warnings.length > 0 && (
                <div className="border-t border-zinc-100 dark:border-zinc-800 px-3 py-2 space-y-1">
                    {context.warnings.map((w, i) => (
                        <p
                            key={i}
                            className="text-[10px] leading-relaxed text-amber-600 dark:text-amber-400"
                        >
                            {w}
                        </p>
                    ))}
                </div>
            )}

            {context && context.unavailableSources > 0 && (
                <div className="border-t border-zinc-100 dark:border-zinc-800 px-3 py-2">
                    <p className="text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-500">
                        {context.unavailableSources} source
                        {context.unavailableSources !== 1 ? 's' : ''} not
                        configured. Connect the import/export service to include
                        widget, workspace, and integration context.
                    </p>
                </div>
            )}
        </div>
    );
}
