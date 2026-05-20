'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type {
    FinanceBillingCycle,
    FinanceSubscription,
    FinanceSubscriptionSource,
} from '@/features/finance/types/finance';

interface AddSubscriptionModalProps {
    subscription?: FinanceSubscription;
    onSave: (
        input: Omit<
            FinanceSubscription,
            'id' | 'userId' | 'createdAt' | 'cadence' | 'nextChargeOn'
        >,
    ) => Promise<void>;
    onClose: () => void;
}

export function AddSubscriptionModal({
    subscription,
    onSave,
    onClose,
}: AddSubscriptionModalProps) {
    const [name, setName] = useState(subscription?.name ?? '');
    const [amount, setAmount] = useState(String(subscription?.amount ?? ''));
    const [billingCycle, setBillingCycle] = useState<FinanceBillingCycle>(
        subscription?.billingCycle ?? 'monthly',
    );
    const [nextBillingDate, setNextBillingDate] = useState(
        subscription?.nextBillingDate ?? '',
    );
    const [category, setCategory] = useState(
        subscription?.category ?? 'Subscriptions',
    );
    const [active, setActive] = useState(subscription?.active ?? true);
    const [source, setSource] = useState<FinanceSubscriptionSource>(
        subscription?.source ?? 'manual',
    );
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        const parsedAmount = Number(amount);
        if (!name.trim()) {
            setError('Name is required.');
            return;
        }
        if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
            setError('Amount must be numeric.');
            return;
        }
        if (
            nextBillingDate &&
            Number.isNaN(new Date(nextBillingDate).getTime())
        ) {
            setError('Next billing date must be valid.');
            return;
        }
        setSaving(true);
        try {
            await onSave({
                name: name.trim(),
                amount: parsedAmount,
                billingCycle,
                nextBillingDate: nextBillingDate || undefined,
                category: category.trim() || 'Subscriptions',
                active,
                source,
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                        {subscription
                            ? 'Edit subscription'
                            : 'Add subscription'}
                    </p>
                    <button onClick={onClose}>
                        <X size={16} className="text-gray-400" />
                    </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Name
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Netflix"
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Amount
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Billing cycle
                        </label>
                        <select
                            value={billingCycle}
                            onChange={(e) =>
                                setBillingCycle(
                                    e.target.value as FinanceBillingCycle,
                                )
                            }
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="weekly">Weekly</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Next billing date
                        </label>
                        <input
                            type="date"
                            value={nextBillingDate}
                            onChange={(e) => setNextBillingDate(e.target.value)}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Source
                        </label>
                        <select
                            value={source}
                            onChange={(e) =>
                                setSource(
                                    e.target.value as FinanceSubscriptionSource,
                                )
                            }
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        >
                            <option value="manual">Manual</option>
                            <option value="detected">Detected</option>
                            <option value="email">Email</option>
                            <option value="bank">Bank</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Category
                        </label>
                        <input
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        />
                    </div>
                    <label className="sm:col-span-2 flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                        <input
                            type="checkbox"
                            checked={active}
                            onChange={(e) => setActive(e.target.checked)}
                        />
                        Active subscription
                    </label>
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button
                    onClick={() => void handleSubmit()}
                    disabled={saving || !name.trim() || !amount}
                    className="w-full text-xs py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium transition-colors"
                >
                    {saving
                        ? 'Saving...'
                        : subscription
                          ? 'Save subscription'
                          : 'Add subscription'}
                </button>
            </div>
        </div>
    );
}
