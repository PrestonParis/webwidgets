'use client';

import { useState } from 'react';
import { Trash2, RefreshCw, BarChart2, Edit3 } from 'lucide-react';
import { PortfolioSparkline } from '@/features/finance/components/charts/PortfolioSparkline';
import type { WatchlistItemWithLatest } from '@/features/finance/types/watchlist';

interface WatchlistItemRowProps {
    item: WatchlistItemWithLatest;
    onDelete: (id: string) => Promise<void>;
    onFetch: (id: string) => Promise<{ needsManual?: boolean }>;
    onManualLog: (id: string, value: number) => Promise<void>;
    onViewChart: (item: WatchlistItemWithLatest) => void;
    onEdit: (item: WatchlistItemWithLatest) => void;
}

const ASSET_EMOJI: Record<string, string> = {
    stock: '📈',
    etf: '📈',
    index: '📉',
    crypto: '🪙',
    real_estate: '🏠',
    other: '📊',
    custom: '📊',
};

export function WatchlistItemRow({
    item,
    onDelete,
    onFetch,
    onManualLog,
    onViewChart,
    onEdit,
}: WatchlistItemRowProps) {
    const [fetching, setFetching] = useState(false);
    const [manualValue, setManualValue] = useState('');
    const [showManual, setShowManual] = useState(false);

    const price = item.latest?.value;
    const prev = item.prev?.value;
    const change =
        price !== undefined && prev !== undefined
            ? ((price - prev) / prev) * 100
            : null;
    const fmt = (n: number) =>
        n >= 1000
            ? n.toLocaleString('en-US', {
                  style: 'currency',
                  currency: item.currency,
                  maximumFractionDigits: 0,
              })
            : n.toLocaleString('en-US', {
                  style: 'currency',
                  currency: item.currency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              });

    const handleFetch = async () => {
        setFetching(true);
        try {
            const result = await onFetch(item.id);
            if (result.needsManual) setShowManual(true);
        } finally {
            setFetching(false);
        }
    };

    const handleManualSubmit = async () => {
        const v = parseFloat(manualValue);
        if (!isNaN(v) && v > 0) {
            await onManualLog(item.id, v);
            setManualValue('');
            setShowManual(false);
        }
    };

    return (
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-base">
                        {ASSET_EMOJI[item.assetType] ?? '📊'}
                    </span>
                    <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">
                            {item.displayName}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                            {item.symbol.toUpperCase()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {item.prev && item.latest && (
                        <PortfolioSparkline
                            points={[
                                {
                                    value: item.prev.value,
                                    date: item.prev.fetchedAt,
                                },
                                {
                                    value: item.latest.value,
                                    date: item.latest.fetchedAt,
                                },
                            ]}
                            width={56}
                            height={28}
                        />
                    )}
                    {price !== undefined ? (
                        <div className="text-right">
                            <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                                {fmt(price)}
                            </p>
                            {change !== null && (
                                <p
                                    className={`text-[10px] font-medium ${change >= 0 ? 'text-green-500' : 'text-red-400'}`}
                                >
                                    {change >= 0 ? '+' : ''}
                                    {change.toFixed(2)}%
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 dark:text-zinc-500">
                            No data
                        </p>
                    )}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onViewChart(item)}
                            className="text-gray-300 hover:text-blue-400 transition-colors"
                        >
                            <BarChart2 size={13} />
                        </button>
                        <button
                            onClick={() => void handleFetch()}
                            disabled={fetching}
                            className="text-gray-300 hover:text-green-400 transition-colors"
                        >
                            <RefreshCw
                                size={13}
                                className={fetching ? 'animate-spin' : ''}
                            />
                        </button>
                        <button
                            onClick={() => onEdit(item)}
                            className="text-gray-300 hover:text-emerald-400 transition-colors"
                        >
                            <Edit3 size={13} />
                        </button>
                        <button
                            onClick={() => setShowManual((v) => !v)}
                            className="text-gray-300 hover:text-amber-400 transition-colors"
                        >
                            Log
                        </button>
                        <button
                            onClick={() => void onDelete(item.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>
            </div>
            {showManual && (
                <div className="flex gap-2 mt-2">
                    <input
                        type="number"
                        value={manualValue}
                        onChange={(e) => setManualValue(e.target.value)}
                        placeholder="Enter value"
                        className="flex-1 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-gray-800 dark:text-zinc-200"
                    />
                    <button
                        onClick={() => void handleManualSubmit()}
                        className="text-xs px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
                    >
                        Log
                    </button>
                </div>
            )}
        </div>
    );
}
