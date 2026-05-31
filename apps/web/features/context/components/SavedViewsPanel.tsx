'use client';

import { useEffect, useState } from 'react';
import type { ContextFilterState } from './ContextFilters';
import type { GraphLayoutMode } from './GraphToolbar';
import {
    deleteContextView,
    fetchSavedViews,
    saveContextView,
} from '@/features/context/api/contextApi';
import type { ContextSavedView } from '@/features/context/types/schemas';

interface SavedViewsPanelProps {
    current: {
        filters: ContextFilterState;
        layoutMode: GraphLayoutMode;
        focusMode: boolean;
        focusNode?: string | null;
    };
    onApply: (view: {
        filters: ContextFilterState;
        layoutMode: GraphLayoutMode;
        focusMode: boolean;
    }) => void;
}

export function SavedViewsPanel({ current, onApply }: SavedViewsPanelProps) {
    const [views, setViews] = useState<ContextSavedView[]>([]);
    const [name, setName] = useState('');

    useEffect(() => {
        void fetchSavedViews()
            .then(setViews)
            .catch(() => setViews([]));
    }, []);

    async function saveView() {
        if (!name.trim()) return;
        const view = await saveContextView({
            name: name.trim(),
            filters: { ...current.filters, focusMode: current.focusMode },
            layoutMode: current.layoutMode,
            focusNode: current.focusNode ?? null,
        });
        setViews((prev) => [
            view,
            ...prev.filter((item) => item.id !== view.id),
        ]);
        setName('');
    }

    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Saved Views
            </h2>
            <div className="mb-2 flex gap-2">
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="View name"
                    className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-950"
                />
                <button
                    type="button"
                    disabled={!name.trim()}
                    onClick={() => void saveView()}
                    className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                >
                    Save
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {views.length === 0 && (
                    <p className="text-xs text-zinc-500">No saved views yet.</p>
                )}
                {views.map((view) => {
                    const filters =
                        view.filters as unknown as ContextFilterState & {
                            focusMode?: boolean;
                        };
                    return (
                        <span
                            key={view.id}
                            className="inline-flex overflow-hidden rounded-lg border border-zinc-200 text-xs dark:border-zinc-800"
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    onApply({
                                        filters,
                                        layoutMode:
                                            view.layoutMode as GraphLayoutMode,
                                        focusMode: Boolean(filters.focusMode),
                                    })
                                }
                                className="px-2.5 py-1.5 font-medium text-zinc-600 transition hover:text-blue-700 dark:text-zinc-300"
                            >
                                {view.name}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!view.id) return;
                                    void deleteContextView(view.id).then(() =>
                                        setViews((prev) =>
                                            prev.filter(
                                                (item) => item.id !== view.id,
                                            ),
                                        ),
                                    );
                                }}
                                className="border-l border-zinc-200 px-2 text-zinc-400 hover:text-rose-600 dark:border-zinc-800"
                            >
                                ×
                            </button>
                        </span>
                    );
                })}
            </div>
        </section>
    );
}
