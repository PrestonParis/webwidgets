'use client';

import { X } from 'lucide-react';
import { LineChart } from '@/features/tracking/viz/LineChart';
import { LoadingState } from '@/features/ui/loading';
import { useWatchlistChart } from '@/features/finance/hooks/useWatchlistChart';
import type { WatchlistItemWithLatest } from '@/features/finance/types/watchlist';

interface WatchlistChartDrawerProps {
    item: WatchlistItemWithLatest;
    onClose: () => void;
}

export function WatchlistChartDrawer({
    item,
    onClose,
}: WatchlistChartDrawerProps) {
    const { readings, loading } = useWatchlistChart(item.id);

    const chartData = readings.map((r) => ({
        date: r.fetchedAt.slice(0, 10),
        value: r.value,
    }));
    const latest = item.latest?.value;
    const fmt = (n: number) =>
        n.toLocaleString('en-US', {
            style: 'currency',
            currency: item.currency,
            minimumFractionDigits: 2,
        });

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-2xl border-t border-gray-200 dark:border-zinc-700 shadow-xl p-5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                            {item.displayName}
                        </p>
                        <p className="text-xs text-gray-400">
                            {item.symbol.toUpperCase()}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {latest !== undefined && (
                            <p className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                                {fmt(latest)}
                            </p>
                        )}
                        <button onClick={onClose}>
                            <X size={16} className="text-gray-400" />
                        </button>
                    </div>
                </div>
                {loading ? (
                    <LoadingState
                        variant="section"
                        minHeight="min-h-40"
                        centered
                    />
                ) : chartData.length < 2 ? (
                    <p className="text-sm text-gray-400 text-center py-10">
                        Not enough data yet — fetch or log more readings
                    </p>
                ) : (
                    <LineChart
                        data={chartData}
                        label={item.displayName}
                        color="#3b82f6"
                        height={160}
                    />
                )}
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-3 text-center">
                    {readings.length} readings
                </p>
            </div>
        </div>
    );
}
