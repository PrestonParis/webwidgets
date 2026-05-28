'use client';

import type { ContextFilterState } from './ContextFilters';
import type { GraphLayoutMode } from './GraphToolbar';

interface SavedViewsPanelProps {
    onApply: (view: {
        filters: ContextFilterState;
        layoutMode: GraphLayoutMode;
        focusMode: boolean;
    }) => void;
}

const VIEWS: Array<{
    label: string;
    filters: ContextFilterState;
    layoutMode: GraphLayoutMode;
    focusMode: boolean;
}> = [
    {
        label: 'Workflow Map',
        filters: {
            type: 'all',
            relationship: 'workflow',
            activity: 'all',
            connectedOnly: true,
        },
        layoutMode: 'workflow',
        focusMode: false,
    },
    {
        label: 'Active Systems',
        filters: {
            type: 'all',
            relationship: 'all',
            activity: 'active',
            connectedOnly: false,
        },
        layoutMode: 'cluster',
        focusMode: false,
    },
    {
        label: 'Compact Map',
        filters: {
            type: 'all',
            relationship: 'all',
            activity: 'all',
            connectedOnly: false,
        },
        layoutMode: 'compact',
        focusMode: false,
    },
];

export function SavedViewsPanel({ onApply }: SavedViewsPanelProps) {
    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Saved Views
            </h2>
            <div className="flex flex-wrap gap-2">
                {VIEWS.map((view) => (
                    <button
                        key={view.label}
                        type="button"
                        onClick={() => onApply(view)}
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-zinc-800 dark:text-zinc-300"
                    >
                        {view.label}
                    </button>
                ))}
            </div>
        </section>
    );
}
