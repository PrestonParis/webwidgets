'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
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
            <div className="flex justify-center py-10">
                <div className="w-6 h-6 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            </div>
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
                    <p className="text-2xl mb-2">📈</p>
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
