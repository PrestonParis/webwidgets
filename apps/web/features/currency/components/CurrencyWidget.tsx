'use client';

import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useCurrency } from '@/features/currency/hooks/useCurrency';
import {
    CURRENCY_SYMBOLS,
    DISPLAY_TARGETS,
    POPULAR_CURRENCIES,
} from '@/features/currency/constants';

function formatRate(value: number, currency: string): string {
    if (currency === 'JPY' || currency === 'INR' || currency === 'CNY') {
        return value.toFixed(0);
    }
    return value.toFixed(2);
}

export default function CurrencyWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'currency',
        'currency',
    );
    const [amount, setAmount] = useState('1');
    const [base, setBase] = useState('USD');
    const { rates, loading, error } = useCurrency(base);

    const parsed = parseFloat(amount) || 1;
    const targets = DISPLAY_TARGETS.filter((c) => c !== base);

    return (
        <WidgetShell
            icon={<DollarSign size={16} />}
            title="Currency"
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="currency"
            widgetType="currency"
        >
            {/* Input row */}
            <div className="flex gap-2 mb-4">
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="0"
                />
                <select
                    value={base}
                    onChange={(e) => setBase(e.target.value)}
                    className="text-sm px-2 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
                >
                    {POPULAR_CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
            </div>

            {loading && (
                <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-7 bg-stone-100 dark:bg-zinc-800 rounded-lg animate-pulse"
                        />
                    ))}
                </div>
            )}

            {error && (
                <p className="text-sm text-center text-stone-400 dark:text-zinc-600 py-4">
                    Failed to load rates. Check connection.
                </p>
            )}

            {!loading && !error && rates && (
                <>
                    <ul className="space-y-1.5">
                        {targets.map((currency) => {
                            const rate = rates.rates[currency];
                            if (!rate) return null;
                            const converted = parsed * rate;
                            const sym = CURRENCY_SYMBOLS[currency] ?? '';
                            return (
                                <li
                                    key={currency}
                                    className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors"
                                >
                                    <span className="text-sm font-medium text-stone-600 dark:text-zinc-400">
                                        {currency}
                                    </span>
                                    <span className="text-sm font-semibold tabular-nums text-stone-800 dark:text-zinc-200">
                                        {sym}
                                        {formatRate(converted, currency)}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                    <p className="mt-3 text-[10px] text-center text-stone-400 dark:text-zinc-600">
                        Rates as of {rates.date} · ECB
                    </p>
                </>
            )}
        </WidgetShell>
    );
}
