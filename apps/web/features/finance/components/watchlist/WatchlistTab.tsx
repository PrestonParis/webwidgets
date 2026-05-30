'use client';

import { useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { LoadingState } from '@/features/ui/loading';
import { useWatchlist } from '@/features/finance/hooks/useWatchlist';
import { WatchlistItemRow } from './WatchlistItemRow';
import { AddWatchlistItemModal } from './AddWatchlistItemModal';
import { WatchlistChartDrawer } from './WatchlistChartDrawer';
import type { WatchlistItemWithLatest } from '@/features/finance/types/watchlist';

export function WatchlistTab() {
    const { items, loading, add, update, remove, fetchLatest, logManual } =
        useWatchlist();
    const [showAdd, setShowAdd] = useState(false);
    const [chartItem, setChartItem] = useState<WatchlistItemWithLatest | null>(
        null,
    );
    const [editing, setEditing] = useState<WatchlistItemWithLatest | null>(
        null,
    );

    if (loading)
        return (
            <LoadingState
                variant="section"
                size="md"
                minHeight="min-h-40"
                centered
            />
        );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Watchlist
                </p>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
                >
                    <Plus size={11} /> Add
                </button>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-12">
                    <TrendingUp
                        size={28}
                        className="mx-auto mb-2 text-gray-300 dark:text-zinc-600"
                    />
                    <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                        No watchlist items yet
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                        Track stocks, crypto, real estate, or any custom metric
                    </p>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="mt-4 text-xs px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
                    >
                        Add first item
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map((item) => (
                        <WatchlistItemRow
                            key={item.id}
                            item={item}
                            onDelete={remove}
                            onFetch={(id) =>
                                fetchLatest(id) as Promise<{
                                    needsManual?: boolean;
                                }>
                            }
                            onManualLog={logManual}
                            onViewChart={setChartItem}
                            onEdit={setEditing}
                        />
                    ))}
                </div>
            )}

            {showAdd && (
                <AddWatchlistItemModal
                    onAdd={add}
                    onClose={() => setShowAdd(false)}
                />
            )}
            {editing && (
                <AddWatchlistItemModal
                    item={editing}
                    onAdd={(input) => update(editing.id, input)}
                    onClose={() => setEditing(null)}
                />
            )}
            {chartItem && (
                <WatchlistChartDrawer
                    item={chartItem}
                    onClose={() => setChartItem(null)}
                />
            )}
        </div>
    );
}
