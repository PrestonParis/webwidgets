'use client';

import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { useCurrency } from '@/features/currency/hooks/useCurrency';
import {
    CURRENCY_SYMBOLS,
    POPULAR_CURRENCIES,
} from '@/features/currency/constants';

const ALL_TARGETS = [
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'CAD',
    'AUD',
    'CHF',
    'CNY',
    'INR',
    'MXN',
    'BRL',
    'KRW',
    'SGD',
    'HKD',
    'NOK',
    'SEK',
    'DKK',
    'NZD',
    'ZAR',
    'AED',
    'SAR',
    'THB',
    'PLN',
    'TRY',
    'RUB',
    'IDR',
    'MYR',
    'PHP',
    'ILS',
    'CZK',
];

function formatRate(value: number, currency: string): string {
    if (['JPY', 'INR', 'CNY', 'KRW', 'IDR'].includes(currency))
        return value.toFixed(0);
    return value.toFixed(2);
}

export function CurrencyPage() {
    const [amount, setAmount] = useState('1');
    const [base, setBase] = useState('USD');
    const [search, setSearch] = useState('');
    const { rates, loading, error } = useCurrency(base);

    const parsed = parseFloat(amount) || 1;
    const targets = ALL_TARGETS.filter(
        (c) => c !== base && c.includes(search.toUpperCase()),
    );

    return (
        <main className="max-w-4xl mx-auto px-6 py-8 lg:px-12">
            <div className="flex items-center gap-3 mb-8">
                <DollarSign size={22} className="text-emerald-500" />
                <div>
                    <h1 className="text-2xl font-bold text-stone-900 dark:text-zinc-100">
                        Currency Converter
                    </h1>
                    <p className="text-sm text-stone-500 dark:text-zinc-500">
                        Live exchange rates · European Central Bank
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 text-lg px-4 py-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="0"
                    placeholder="Amount"
                />
                <select
                    value={base}
                    onChange={(e) => setBase(e.target.value)}
                    className="text-lg px-4 py-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors font-semibold"
                >
                    {POPULAR_CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter currencies…"
                    className="flex-1 text-sm px-4 py-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
                />
            </div>

            {loading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-20 bg-stone-100 dark:bg-zinc-800 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            )}

            {error && (
                <p className="text-sm text-center text-stone-400 dark:text-zinc-600 py-8">
                    Failed to load rates. Check your connection.
                </p>
            )}

            {!loading && !error && rates && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {targets.map((currency) => {
                            const rate = rates.rates[currency];
                            if (!rate) return null;
                            const sym = CURRENCY_SYMBOLS[currency] ?? '';
                            return (
                                <div
                                    key={currency}
                                    className="bg-white dark:bg-zinc-900 rounded-xl border border-stone-100 dark:border-zinc-800 px-4 py-3 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
                                >
                                    <p className="text-xs font-bold text-stone-500 dark:text-zinc-400 mb-1">
                                        {currency}
                                    </p>
                                    <p className="text-xl font-bold tabular-nums text-stone-800 dark:text-zinc-100">
                                        {sym}
                                        {formatRate(parsed * rate, currency)}
                                    </p>
                                    <p className="text-[10px] text-stone-400 dark:text-zinc-600 mt-0.5">
                                        1 {base} = {formatRate(rate, currency)}{' '}
                                        {currency}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                    <p className="mt-4 text-xs text-center text-stone-400 dark:text-zinc-600">
                        Rates as of {rates.date} · European Central Bank
                    </p>
                </>
            )}
        </main>
    );
}
