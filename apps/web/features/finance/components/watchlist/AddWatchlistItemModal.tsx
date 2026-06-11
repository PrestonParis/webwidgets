'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type {
    AssetType,
    WatchlistItem,
} from '@/features/finance/types/watchlist';

interface AddWatchlistItemModalProps {
    item?: WatchlistItem;
    onAdd: (input: {
        assetType: AssetType;
        symbol: string;
        displayName: string;
        currency?: string;
        config?: Record<string, unknown>;
    }) => Promise<void>;
    onClose: () => void;
}

const ASSET_HINTS: Record<
    AssetType,
    { placeholder: string; hint: string; configHint?: string }
> = {
    stock: { placeholder: 'AAPL', hint: 'Yahoo Finance ticker symbol' },
    etf: { placeholder: 'VOO', hint: 'ETF ticker symbol' },
    index: { placeholder: '^GSPC', hint: 'Index symbol' },
    crypto: {
        placeholder: 'bitcoin',
        hint: 'CoinGecko coin ID (e.g. bitcoin, ethereum)',
    },
    real_estate: {
        placeholder: '123 Main St',
        hint: 'Enter address as display name. Paste Zillow ZPID for auto-fetch.',
        configHint: 'Zillow property ID (zpid), optional, enables auto-fetch',
    },
    other: { placeholder: 'My asset', hint: 'You will log values manually' },
    custom: { placeholder: 'My metric', hint: 'You will log values manually' },
};

function formString(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : '';
}

export function AddWatchlistItemModal({
    item,
    onAdd,
    onClose,
}: AddWatchlistItemModalProps) {
    const [assetType, setAssetType] = useState<AssetType>(
        item?.assetType ?? 'stock',
    );
    const [symbol, setSymbol] = useState(item?.symbol ?? '');
    const [displayName, setDisplayName] = useState(item?.displayName ?? '');
    const [currency, setCurrency] = useState(item?.currency ?? 'USD');
    const [targetPrice, setTargetPrice] = useState(
        formString(item?.config?.targetPrice),
    );
    const [notes, setNotes] = useState(formString(item?.config?.notes));
    const [zpid, setZpid] = useState(formString(item?.config?.zpid));
    const [coinId, setCoinId] = useState(formString(item?.config?.coinId));
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const hints = ASSET_HINTS[assetType];

    const handleSubmit = async () => {
        const parsedTarget = targetPrice ? Number(targetPrice) : undefined;
        if (!symbol.trim() || !displayName.trim()) {
            setError('Symbol and name are required.');
            return;
        }
        if (parsedTarget !== undefined && !Number.isFinite(parsedTarget)) {
            setError('Target price must be numeric.');
            return;
        }
        setSaving(true);
        const config: Record<string, unknown> = {};
        if (parsedTarget !== undefined) config.targetPrice = parsedTarget;
        if (notes.trim()) config.notes = notes.trim();
        if (assetType === 'real_estate' && zpid) config.zpid = zpid;
        if (assetType === 'crypto' && coinId) config.coinId = coinId;
        try {
            await onAdd({
                assetType,
                symbol: symbol.trim(),
                displayName: displayName.trim(),
                currency,
                config,
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                        {item ? 'Edit watchlist item' : 'Add to watchlist'}
                    </p>
                    <button onClick={onClose}>
                        <X size={16} className="text-gray-400" />
                    </button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Asset type
                        </label>
                        <select
                            value={assetType}
                            onChange={(e) => {
                                setAssetType(e.target.value as AssetType);
                                setSymbol('');
                                setDisplayName('');
                            }}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        >
                            <option value="stock">Stock / ETF</option>
                            <option value="etf">ETF</option>
                            <option value="index">Index</option>
                            <option value="crypto">Cryptocurrency</option>
                            <option value="real_estate">Real Estate</option>
                            <option value="other">Other</option>
                            <option value="custom">Custom metric</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Symbol / identifier
                        </label>
                        <input
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            placeholder={hints.placeholder}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        />
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                            {hints.hint}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Display name
                        </label>
                        <input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="e.g. Apple Inc."
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="w-24">
                            <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                                Currency
                            </label>
                            <input
                                value={currency}
                                onChange={(e) =>
                                    setCurrency(e.target.value.toUpperCase())
                                }
                                maxLength={3}
                                className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                                Target price
                            </label>
                            <input
                                type="number"
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(e.target.value)}
                                className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        />
                    </div>
                    {assetType === 'real_estate' && (
                        <div>
                            <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                                Zillow ZPID (optional)
                            </label>
                            <input
                                value={zpid}
                                onChange={(e) => setZpid(e.target.value)}
                                placeholder="e.g. 2095832"
                                className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                            />
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                                {hints.configHint}
                            </p>
                        </div>
                    )}
                    {assetType === 'crypto' && (
                        <div>
                            <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                                CoinGecko ID (if different from symbol)
                            </label>
                            <input
                                value={coinId}
                                onChange={(e) => setCoinId(e.target.value)}
                                placeholder="e.g. bitcoin"
                                className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                            />
                        </div>
                    )}
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button
                    onClick={() => void handleSubmit()}
                    disabled={saving || !symbol.trim() || !displayName.trim()}
                    className="w-full text-xs py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium transition-colors"
                >
                    {saving
                        ? 'Saving...'
                        : item
                          ? 'Save watchlist item'
                          : 'Add to watchlist'}
                </button>
            </div>
        </div>
    );
}
